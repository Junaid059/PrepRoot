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

interface ManualEnrollmentRequest {
  courseId: string
  studentEmail: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("Manual enrollment request received")

    // Verify admin authentication
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined")
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 })
    }

    // Verify token
    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
    } catch (error) {
      console.error("Token verification error:", error)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    if (!decoded.id) {
      return NextResponse.json({ message: "Invalid token payload" }, { status: 401 })
    }

    // Check if user is admin
    await connectDB()
    const adminUser = await User.findById(decoded.id)
    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 })
    }

    // Parse request body
    let body: ManualEnrollmentRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ message: "Invalid JSON in request body" }, { status: 400 })
    }

    const { courseId, studentEmail } = body

    console.log("Enrollment data:", { courseId, studentEmail })

    // Validate required fields
    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json({ message: "Valid course ID is required" }, { status: 400 })
    }

    if (!studentEmail || typeof studentEmail !== "string") {
      return NextResponse.json({ message: "Valid student email is required" }, { status: 400 })
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ message: "Invalid course ID format" }, { status: 400 })
    }

    // Find the course
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    console.log("Course found:", course.title)

    // Find the student by email (case insensitive)
    const student = await User.findOne({
      email: { $regex: new RegExp(`^${studentEmail.trim()}$`, "i") },
      isAdmin: { $ne: true }, // Ensure we don't enroll admin users
    })

    if (!student) {
      console.log("Student not found with email:", studentEmail)
      return NextResponse.json(
        {
          message: "Student not found with this email address. Please ensure the student has an account.",
          searchedEmail: studentEmail.trim(),
        },
        { status: 404 },
      )
    }

    console.log("Student found:", student.name, student.email)

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: student._id,
      course: courseId,
    })

    if (existingEnrollment) {
      return NextResponse.json({ message: "Student is already enrolled in this course" }, { status: 409 })
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: student._id,
      course: courseId,
      progress: 0,
      completedLectures: [],
      enrolledAt: new Date(),
      amountPaid: 0, // Manual enrollment is free
      paymentId: `manual_${Date.now()}`,
      paymentStatus: "completed", // Changed from "manual" to "completed"
    })

    await enrollment.save()

    console.log("Enrollment created successfully:", enrollment._id)

    // Update course enrollment count
    try {
      await Course.findByIdAndUpdate(
        courseId,
        {
          $inc: { enrollmentCount: 1, enrollments: 1 },
        },
        { new: true },
      )
    } catch (updateError) {
      console.log("Course enrollment count update failed:", updateError)
      // Continue anyway as this is not critical
    }

    return NextResponse.json(
      {
        success: true,
        message: "Student enrolled successfully",
        enrollment: {
          id: enrollment._id.toString(),
          studentName: student.name,
          studentEmail: student.email,
          courseTitle: course.title,
          enrolledAt: enrollment.enrolledAt.toISOString(),
          paymentStatus: "completed", // Manual enrollments are treated as completed
          amountPaid: 0,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Manual enrollment error:", error)

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key") || error.message.includes("E11000")) {
        return NextResponse.json({ message: "Student is already enrolled in this course" }, { status: 409 })
      }

      if (error.message.includes("validation")) {
        return NextResponse.json({ message: "Invalid enrollment data provided" }, { status: 400 })
      }

      if (error.message.includes("Cast to ObjectId failed")) {
        return NextResponse.json({ message: "Invalid ID format provided" }, { status: 400 })
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Server error during manual enrollment",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "Internal server error",
      },
      { status: 500 },
    )
  }
}