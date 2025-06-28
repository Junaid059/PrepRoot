import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import Enrollment from "@/models/Enrollment"
import Course from "@/models/Course"
import User from "@/models/User"
import mongoose from "mongoose"

interface JWTPayload {
  id: string
  email?: string
  isAdmin?: boolean
  iat?: number
  exp?: number
}

// Admin authentication function
async function verifyAdminAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    throw new Error("Not authenticated")
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined")
    throw new Error("Server configuration error")
  }

  let decoded: JWTPayload
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
  } catch (error) {
    console.error("Token verification error:", error)
    throw new Error("Not authenticated")
  }

  if (!decoded.id) {
    throw new Error("Not authenticated")
  }

  await connectDB()
  const adminUser = await User.findById(decoded.id)
  if (!adminUser || !adminUser.isAdmin) {
    throw new Error("Admin access required")
  }

  return decoded
}

// GET - Fetch all students enrolled in a specific course
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin authentication
    await verifyAdminAuth()
    
    const { id } = await params
    console.log("Fetching enrolled students for course:", id)

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid course ID format" }, { status: 400 })
    }

    // Ensure database connection
    await connectDB()

    // Check if course exists
    const course = await Course.findById(id)
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    // Get URL search parameters for filtering and pagination
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || 'all' // all, active, completed, etc.

    // Build aggregation pipeline to get enrolled students with their details
    const pipeline: any[] = [
      {
        $match: {
          course: new mongoose.Types.ObjectId(id)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      {
        $unwind: '$studentDetails'
      },
      {
        $match: {
          'studentDetails.isAdmin': { $ne: true } // Exclude admin users
        }
      }
    ]

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'studentDetails.name': { $regex: search, $options: 'i' } },
            { 'studentDetails.email': { $regex: search, $options: 'i' } }
          ]
        }
      })
    }

    // Add status filter if provided
    if (status !== 'all') {
      if (status === 'completed') {
        pipeline.push({
          $match: {
            progress: { $gte: 100 }
          }
        })
      } else if (status === 'in-progress') {
        pipeline.push({
          $match: {
            progress: { $gt: 0, $lt: 100 }
          }
        })
      } else if (status === 'not-started') {
        pipeline.push({
          $match: {
            progress: { $lte: 0 }
          }
        })
      }
    }

    // Add sorting
    pipeline.push({
      $sort: { enrolledAt: -1 } // Sort by enrollment date (newest first)
    })

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: "total" }]
    const totalResult = await Enrollment.aggregate(countPipeline)
    const totalEnrollments = totalResult.length > 0 ? totalResult[0].total : 0

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit }
    )

    // Add projection to format the output
    pipeline.push({
      $project: {
        _id: 1,
        progress: 1,
        completedLectures: 1,
        enrolledAt: 1,
        amountPaid: 1,
        paymentStatus: 1,
        paymentId: 1,
        studentId: '$studentDetails._id',
        studentName: '$studentDetails.name',
        studentEmail: '$studentDetails.email',
        studentProfilePicture: '$studentDetails.profilePicture',
        studentIsActive: '$studentDetails.isActive'
      }
    })

    // Execute the aggregation
    const enrollments = await Enrollment.aggregate(pipeline)

    // Format the response
    const formattedEnrollments = enrollments.map((enrollment) => ({
      enrollmentId: enrollment._id.toString(),
      student: {
        id: enrollment.studentId.toString(),
        name: enrollment.studentName,
        email: enrollment.studentEmail,
        profilePicture: enrollment.studentProfilePicture || null,
        isActive: enrollment.studentIsActive ?? true
      },
      enrollment: {
        progress: enrollment.progress || 0,
        completedLectures: enrollment.completedLectures?.length || 0,
        enrolledAt: enrollment.enrolledAt,
        amountPaid: enrollment.amountPaid || 0,
        paymentStatus: enrollment.paymentStatus || 'pending',
        paymentId: enrollment.paymentId || null
      }
    }))

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalEnrollments / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      enrollments: formattedEnrollments,
      course: {
        id: course._id.toString(),
        title: course.title,
        price: course.price || 0,
        totalEnrollments: totalEnrollments
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalEnrollments,
        enrollmentsPerPage: limit,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        search,
        status
      },
      stats: {
        totalEnrollments,
        completedCount: enrollments.filter(e => e.progress >= 100).length,
        inProgressCount: enrollments.filter(e => e.progress > 0 && e.progress < 100).length,
        notStartedCount: enrollments.filter(e => e.progress <= 0).length
      }
    })

  } catch (error) {
    console.error("Error fetching course enrollments:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: "Authentication required" }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: "Admin access required" }, { status: 403 })
      }
      if (error.message === "Server configuration error") {
        return NextResponse.json({ message: "Server configuration error" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      message: "Failed to fetch course enrollments",
      error: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : "Unknown error"
        : "Internal server error"
    }, { status: 500 })
  }
}

// DELETE - Remove a student enrollment (unenroll)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin authentication
    await verifyAdminAuth()

    const { id } = await params
    const body = await request.json()
    const { enrollmentId } = body

    // Validate required fields
    if (!enrollmentId) {
      return NextResponse.json({ 
        message: "Enrollment ID is required" 
      }, { status: 400 })
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return NextResponse.json({ message: "Invalid ID format" }, { status: 400 })
    }

    await connectDB()

    // Find the enrollment with student and course details
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('user', 'name email')
      .populate('course', 'title')

    if (!enrollment) {
      return NextResponse.json({ message: "Enrollment not found" }, { status: 404 })
    }

    // Verify that the enrollment belongs to the specified course
    if (enrollment.course._id.toString() !== id) {
      return NextResponse.json({ message: "Enrollment does not belong to this course" }, { status: 400 })
    }

    // Delete the enrollment
    await Enrollment.findByIdAndDelete(enrollmentId)

    // Update course enrollment count
    try {
      await Course.findByIdAndUpdate(
        id,
        {
          $inc: { enrollmentCount: -1, enrollments: -1 }
        }
      )
    } catch (updateError) {
      console.log("Course enrollment count update failed:", updateError)
      // Continue anyway as this is not critical
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unenrolled ${enrollment.user.name} from ${enrollment.course.title}`,
      unenrolledStudent: {
        name: enrollment.user.name,
        email: enrollment.user.email
      }
    })

  } catch (error) {
    console.error("Error removing enrollment:", error)

    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: "Authentication required" }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: "Admin access required" }, { status: 403 })
      }
    }

    return NextResponse.json({
      success: false,
      message: "Failed to remove enrollment",
      error: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : "Unknown error"
        : "Internal server error"
    }, { status: 500 })
  }
}