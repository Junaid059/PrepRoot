import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import Course from "@/models/Course"
import Section from "@/models/Section"
import User from "@/models/User"
import mongoose from "mongoose"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface JWTPayload {
  id: string
  email?: string
  isAdmin?: boolean
  iat?: number
  exp?: number
}

// Define the section type for lean queries
interface LeanSection {
  _id: mongoose.Types.ObjectId
  title: string
  description?: string
  order?: number
  fileUrl?: string
  fileType?: string
  fileName?: string
  courseId: string
  createdAt: Date
  updatedAt: Date
}

// Helper function to upload file to Cloudinary
async function uploadToCloudinary(file: File, resourceType: "video" | "raw" = "raw"): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: resourceType,
          folder: "course-sections",
          public_id: `section_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result?.secure_url || "")
          }
        },
      )
      .end(buffer)
  })
}

// Helper function to verify admin authentication
async function verifyAdminAuth(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    throw new Error("Not authenticated")
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("Server configuration error")
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
  if (!decoded.id) {
    throw new Error("Invalid token payload")
  }

  await connectDB()
  const adminUser = await User.findById(decoded.id)
  if (!adminUser || !adminUser.isAdmin) {
    throw new Error("Admin access required")
  }

  return decoded.id
}

// GET - Fetch all sections for a course
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuth()
    
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid course ID format" }, { status: 400 })
    }

    // Check if course exists
    const course = await Course.findById(id)
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    // Fetch sections for the course
    const sections = await Section.find({ courseId: id })
      .sort({ order: 1, createdAt: 1 })
      .lean()

    // Type guard to ensure sections have the expected structure
    const validSections = sections.filter((section: any): section is LeanSection => {
      return section._id && 
             section.title && 
             section.createdAt &&
             section.updatedAt
    })

    const formattedSections = validSections.map((section) => ({
     id: (section._id as { toString: () => string }).toString(),
      title: section.title,
      description: section.description || "",
      order: section.order || 0,
      fileUrl: section.fileUrl || null,
      fileType: section.fileType || null,
      fileName: section.fileName || null,
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
    })
  } catch (error) {
    console.error("Error fetching sections:", error)

    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: error.message }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: error.message }, { status: 403 })
      }
    }

    return NextResponse.json({ success: false, message: "Failed to fetch sections" }, { status: 500 })
  }
}

// POST - Create a new section
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuth()
    
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid course ID format" }, { status: 400 })
    }

    // Check if course exists
    const course = await Course.findById(id)
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const orderValue = formData.get("order") as string
    const order = orderValue ? Number.parseInt(orderValue, 10) : 0
    const file = formData.get("file") as File | null

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ message: "Section title is required" }, { status: 400 })
    }

    let fileUrl: string | null = null
    let fileType: string | null = null
    let fileName: string | null = null

    // Handle file upload if provided
    if (file && file.size > 0) {
      try {
        // Determine file type and resource type for Cloudinary
        const fileExtension = file.name.split(".").pop()?.toLowerCase()
        const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm"]
        const resourceType = videoExtensions.includes(fileExtension || "") ? "video" : "raw"

        fileUrl = await uploadToCloudinary(file, resourceType)
        fileType = file.type
        fileName = file.name

        console.log("File uploaded to Cloudinary:", fileUrl)
      } catch (uploadError) {
        console.error("File upload error:", uploadError)
        return NextResponse.json({ message: "Failed to upload file" }, { status: 500 })
      }
    }

    // Create new section
    const section = new Section({
      title: title.trim(),
      description: description?.trim() || "",
      order,
      courseId: id,
      fileUrl,
      fileType,
      fileName,
    })

    await section.save()

    // Update course section count
    await Course.findByIdAndUpdate(id, {
      $inc: { sections: 1 },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Section created successfully",
        section: {
          id: section._id.toString(),
          title: section.title,
          description: section.description,
          order: section.order,
          fileUrl: section.fileUrl,
          fileType: section.fileType,
          fileName: section.fileName,
          createdAt: section.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating section:", error)

    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: error.message }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: error.message }, { status: 403 })
      }
    }

    return NextResponse.json({ success: false, message: "Failed to create section" }, { status: 500 })
  }
}