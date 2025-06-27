import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import Section from "@/models/Section"
import Course from "@/models/Course"
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

// Helper function to upload file to Cloudinary
async function uploadToCloudinary(file: File, resourceType: "video" | "raw" = "raw") {
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
            resolve(result?.secure_url)
          }
        },
      )
      .end(buffer)
  })
}

// Helper function to delete file from Cloudinary
async function deleteFromCloudinary(url: string) {
  try {
    const publicId = url.split("/").pop()?.split(".")[0]
    if (publicId) {
      await cloudinary.uploader.destroy(`course-sections/${publicId}`)
    }
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error)
  }
}

// Helper function to verify admin authentication
async function verifyAdminAuth() {
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

// GET - Fetch a specific section
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminAuth()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: "Invalid section ID format" }, { status: 400 })
    }

    const section = await Section.findById(params.id).lean()
    if (!section || Array.isArray(section)) {
      return NextResponse.json({ message: "Section not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      section: {
        id: (section as any)._id?.toString?.() ?? "",
        title: section.title,
        description: section.description || "",
        order: section.order || 0,
        fileUrl: section.fileUrl || null,
        fileType: section.fileType || null,
        fileName: section.fileName || null,
        courseId: section.courseId,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error fetching section:", error)

    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: error.message }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: error.message }, { status: 403 })
      }
    }

    return NextResponse.json({ success: false, message: "Failed to fetch section" }, { status: 500 })
  }
}

// PUT - Update a section
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminAuth()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: "Invalid section ID format" }, { status: 400 })
    }

    const section = await Section.findById(params.id)
    if (!section) {
      return NextResponse.json({ message: "Section not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const order = Number.parseInt(formData.get("order") as string) || section.order
    const file = formData.get("file") as File | null
    const removeFile = formData.get("removeFile") === "true"

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ message: "Section title is required" }, { status: 400 })
    }

    const updateData: any = {
      title: title.trim(),
      description: description?.trim() || "",
      order,
      updatedAt: new Date(),
    }

    // Handle file operations
    if (removeFile && section.fileUrl) {
      // Remove existing file
      await deleteFromCloudinary(section.fileUrl)
      updateData.fileUrl = null
      updateData.fileType = null
      updateData.fileName = null
    } else if (file && file.size > 0) {
      // Upload new file
      try {
        // Delete old file if exists
        if (section.fileUrl) {
          await deleteFromCloudinary(section.fileUrl)
        }

        // Determine file type and resource type for Cloudinary
        const fileExtension = file.name.split(".").pop()?.toLowerCase()
        const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm"]
        const resourceType = videoExtensions.includes(fileExtension || "") ? "video" : "raw"

        const fileUrl = await uploadToCloudinary(file, resourceType)
        updateData.fileUrl = fileUrl
        updateData.fileType = file.type
        updateData.fileName = file.name

        console.log("New file uploaded to Cloudinary:", fileUrl)
      } catch (uploadError) {
        console.error("File upload error:", uploadError)
        return NextResponse.json({ message: "Failed to upload file" }, { status: 500 })
      }
    }

    const updatedSection = await Section.findByIdAndUpdate(params.id, updateData, { new: true, runValidators: true })

    return NextResponse.json({
      success: true,
      message: "Section updated successfully",
      section: {
        id: updatedSection._id.toString(),
        title: updatedSection.title,
        description: updatedSection.description,
        order: updatedSection.order,
        fileUrl: updatedSection.fileUrl,
        fileType: updatedSection.fileType,
        fileName: updatedSection.fileName,
        courseId: updatedSection.courseId,
        updatedAt: updatedSection.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error updating section:", error)

    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: error.message }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: error.message }, { status: 403 })
      }
    }

    return NextResponse.json({ success: false, message: "Failed to update section" }, { status: 500 })
  }
}

// DELETE - Delete a section
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminAuth()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: "Invalid section ID format" }, { status: 400 })
    }

    const section = await Section.findById(params.id)
    if (!section) {
      return NextResponse.json({ message: "Section not found" }, { status: 404 })
    }

    // Delete file from Cloudinary if exists
    if (section.fileUrl) {
      await deleteFromCloudinary(section.fileUrl)
    }

    // Delete section from database
    await Section.findByIdAndDelete(params.id)

    // Update course section count
    if (section.courseId) {
      await Course.findByIdAndUpdate(section.courseId, {
        $inc: { sections: -1 },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Section deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting section:", error)

    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: error.message }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: error.message }, { status: 403 })
      }
    }

    return NextResponse.json({ success: false, message: "Failed to delete section" }, { status: 500 })
  }
}
