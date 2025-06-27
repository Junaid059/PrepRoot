import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Teacher from "@/models/Teacher"
import { uploadTeacherAvatar, validateImageFile } from "@/lib/upload"

interface JWTPayload {
  id: string
  email?: string
  isAdmin?: boolean
  iat?: number
  exp?: number
}

// GET - List all teachers
export async function GET(request: NextRequest) {
  try {
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

    // Get all teachers from the Teacher model
    const teachers = await Teacher.find().populate("courses").sort({ createdAt: -1 })

    // Format teachers data for frontend
    const teachersData = teachers.map((teacher) => {
      // Calculate total revenue from assigned courses
      const totalRevenue = teacher.courses?.reduce((sum: number, course: any) => sum + (course.revenue || 0), 0) || 0

      return {
        _id: teacher._id.toString(),
        name: teacher.name,
        email: "", // No email in Teacher model
        designation: teacher.designation,
        education: teacher.education,
        description: teacher.description,
        image: teacher.image || "/placeholder.svg?height=200&width=200",
        status: "active", // Teachers are always active in this model
        coursesCount: teacher.courses?.length || 0,
        totalRevenue,
        joinedDate: teacher.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      teachers: teachersData,
      total: teachersData.length,
    })
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch teachers" }, { status: 500 })
  }
}

// POST - Create new teacher
export async function POST(request: NextRequest) {
  try {
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

    const formData = await request.formData()
    const name = formData.get("name") as string
    const designation = formData.get("designation") as string
    const education = formData.get("education") as string
    const description = formData.get("description") as string
    const imageFile = formData.get("image") as File | null

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!designation) {
      return NextResponse.json({ error: "Designation is required" }, { status: 400 })
    }
    if (!education) {
      return NextResponse.json({ error: "Education is required" }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    // Create teacher data
    const teacherData: any = {
      name,
      designation,
      education,
      description,
      courses: [], // Initialize with empty courses array
    }

    // Handle image upload if provided
    if (imageFile && imageFile.size > 0) {
      try {
        // Validate image file
        const validation = validateImageFile(imageFile)
        if (!validation.isValid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        // Upload image to Cloudinary
        const imageUrl = await uploadTeacherAvatar(imageFile)
        console.log("Image uploaded successfully:", imageUrl)

        teacherData.image = imageUrl
      } catch (error) {
        console.error("Image upload error:", error)
        return NextResponse.json({ error: "Failed to upload image. Please try again." }, { status: 500 })
      }
    }

    // Create the teacher
    const teacher = await Teacher.create(teacherData)

    const teacherResponse = {
      _id: teacher._id.toString(),
      name: teacher.name,
      email: "",
      designation: teacher.designation,
      education: teacher.education,
      description: teacher.description,
      image: teacher.image || "/placeholder.svg?height=200&width=200",
      status: "active",
      coursesCount: 0,
      totalRevenue: 0,
      joinedDate: teacher.createdAt,
    }

    return NextResponse.json({
      success: true,
      message: "Teacher created successfully",
      teacher: teacherResponse,
    })
  } catch (error) {
    console.error("Error creating teacher:", error)
    return NextResponse.json({ success: false, error: "Failed to create teacher" }, { status: 500 })
  }
}
