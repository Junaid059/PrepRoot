import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import Section from "@/models/Section"
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

// Define the shape of the lean section object
interface LeanSection {
  _id: mongoose.Types.ObjectId
  title: string
  description?: string
  order: number
  courseId: mongoose.Types.ObjectId
  lectures?: mongoose.Types.ObjectId[]
  fileUrl?: string
  fileType?: string
  fileName?: string
  createdAt: Date
  updatedAt: Date
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

  // Verify token
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

  // Check if user is admin
  await connectDB()
  const adminUser = await User.findById(decoded.id)
  if (!adminUser || !adminUser.isAdmin) {
    throw new Error("Admin access required")
  }

  return decoded
}

// GET - Fetch all sections for a course
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin authentication
    await verifyAdminAuth()
    
    const { id } = await params
    console.log("Fetching sections for course:", id)

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

    // Fetch sections - using courseId as defined in the model
    const sections = await Section.find({ courseId: id })
      .sort({ order: 1, createdAt: 1 }) // Sort by order first, then by creation date
      .lean()

    console.log(`Found ${sections.length} sections for course ${id}`)

    // Type guard to ensure sections have the expected structure
    const validSections = sections.filter((section: any): section is LeanSection => {
      return section._id && 
             section.title && 
             section.createdAt &&
             section.courseId
    })

    // Format sections with proper type safety
    const formattedSections = validSections.map((section) => ({
      id: (section._id as mongoose.Types.ObjectId).toString(),
      title: section.title,
      description: section.description || "",
      order: section.order || 0,
      fileUrl: section.fileUrl || null,
      fileType: section.fileType || null,
      fileName: section.fileName || null,
      lectureCount: section.lectures?.length || 0, // Add lecture count
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      sections: formattedSections,
      course: {
        id: course._id.toString(),
        title: course.title,
      },
      totalSections: formattedSections.length,
    })

  } catch (error) {
    console.error("Error fetching sections:", error)

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
      message: "Failed to fetch sections",
      error: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : "Unknown error"
        : "Internal server error"
    }, { status: 500 })
  }
}