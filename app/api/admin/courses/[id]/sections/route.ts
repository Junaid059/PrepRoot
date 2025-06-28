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
  fileCategory?: string
  courseId: string
  createdAt: Date
  updatedAt: Date
}

// File type categories
const FILE_CATEGORIES = {
  VIDEO: 'video',
  DOCUMENT: 'document',
  IMAGE: 'image',
  AUDIO: 'audio',
  OTHER: 'other'
} as const

type FileCategory = typeof FILE_CATEGORIES[keyof typeof FILE_CATEGORIES]

// File extension mappings
const FILE_EXTENSIONS = {
  video: ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v", "3gp", "ogv"],
  document: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "rtf", "odt"],
  image: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "ico"],
  audio: ["mp3", "wav", "aac", "ogg", "wma", "flac", "m4a"]
}

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  video: 200 * 1024 * 1024, // 200MB
  document: 50 * 1024 * 1024, // 50MB
  image: 10 * 1024 * 1024, // 10MB
  audio: 50 * 1024 * 1024, // 50MB
  other: 25 * 1024 * 1024 // 25MB
}

// Helper function to determine file category
function getFileCategory(filename: string): FileCategory {
  const extension = filename.split(".").pop()?.toLowerCase()
  if (!extension) return FILE_CATEGORIES.OTHER

  for (const [category, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return category as FileCategory
    }
  }
  
  return FILE_CATEGORIES.OTHER
}

// Helper function to get file size limit
function getFileSizeLimit(category: FileCategory): number {
  return FILE_SIZE_LIMITS[category] || FILE_SIZE_LIMITS.other
}

// Helper function to validate file
function validateFile(file: File): { valid: boolean; error?: string; category?: FileCategory } {
  if (!file || file.size === 0) {
    return { valid: false, error: "No file provided" }
  }

  const category = getFileCategory(file.name)
  const sizeLimit = getFileSizeLimit(category)

  if (file.size > sizeLimit) {
    const sizeMB = Math.round(sizeLimit / (1024 * 1024))
    return { 
      valid: false, 
      error: `File size too large. Maximum size for ${category} files is ${sizeMB}MB` 
    }
  }

  // Check if file type is supported
  const extension = file.name.split(".").pop()?.toLowerCase()
  const allSupportedExtensions = Object.values(FILE_EXTENSIONS).flat()
  
  if (!extension || !allSupportedExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${extension}. Supported types: ${allSupportedExtensions.join(', ')}` 
    }
  }

  return { valid: true, category }
}

// Helper function to upload file to Cloudinary
async function uploadToCloudinary(
  file: File, 
  category: FileCategory
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Determine Cloudinary resource type
  let resourceType: "video" | "image" | "raw" = "raw"
  if (category === FILE_CATEGORIES.VIDEO) {
    resourceType = "video"
  } else if (category === FILE_CATEGORIES.IMAGE) {
    resourceType = "image"
  }

  // Generate unique public ID
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2)
  const publicId = `section_${timestamp}_${randomString}`

  // Configure upload options based on file category
  const uploadOptions: any = {
    resource_type: resourceType,
    folder: "course-sections",
    public_id: publicId,
    use_filename: false,
    unique_filename: true,
  }

  // Category-specific optimizations
  switch (category) {
    case FILE_CATEGORIES.VIDEO:
      uploadOptions.quality = "auto"
      uploadOptions.fetch_format = "auto"
      // Generate thumbnail for videos
      uploadOptions.eager = [
        { width: 300, height: 200, crop: "fill", format: "jpg", quality: "auto" }
      ]
      break
      
    case FILE_CATEGORIES.IMAGE:
      uploadOptions.quality = "auto"
      uploadOptions.fetch_format = "auto"
      uploadOptions.flags = "progressive"
      break
      
    case FILE_CATEGORIES.DOCUMENT:
      // For PDFs, enable text extraction if needed
      if (file.name.toLowerCase().endsWith('.pdf')) {
        uploadOptions.ocr = "adv_ocr" // Advanced OCR for searchable text
        uploadOptions.categorization = "google_tagging"
      }
      break
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error)
            reject(new Error(`Upload failed: ${error.message}`))
          } else if (!result) {
            reject(new Error("Upload failed: No result returned"))
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id
            })
          }
        }
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

  try {
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
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token")
    }
    throw error
  }
}

// GET - Fetch all sections for a course
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuth()
    
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid course ID format" }, { status: 400 })
    }

    await connectDB()

    // Check if course exists
    const course = await Course.findById(id)
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }

    // Fetch sections for the course
    const sections = await Section.find({ courseId: id })
      .sort({ order: 1, createdAt: 1 })
      .lean()

    // Type guard and format sections
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
      fileCategory: section.fileCategory || FILE_CATEGORIES.OTHER,
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
      if (error.message === "Not authenticated" || error.message === "Invalid token") {
        return NextResponse.json({ message: "Authentication required" }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: error.message }, { status: 403 })
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch sections" 
    }, { status: 500 })
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

    await connectDB()

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
    let fileCategory: FileCategory = FILE_CATEGORIES.OTHER
    let cloudinaryPublicId: string | null = null

    // Handle file upload if provided
    if (file && file.size > 0) {
      try {
        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
          return NextResponse.json({ message: validation.error }, { status: 400 })
        }

        fileCategory = validation.category!

        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(file, fileCategory)
        fileUrl = uploadResult.url
        cloudinaryPublicId = uploadResult.publicId
        fileType = file.type
        fileName = file.name

        console.log(`File uploaded to Cloudinary (${fileCategory}):`, fileUrl)
      } catch (uploadError) {
        console.error("File upload error:", uploadError)
        return NextResponse.json({ 
          message: `Failed to upload file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}` 
        }, { status: 500 })
      }
    }

    // Create new section
    const sectionData: any = {
      title: title.trim(),
      description: description?.trim() || "",
      order,
      courseId: id,
    }

    // Add file data if file was uploaded
    if (fileUrl) {
      sectionData.fileUrl = fileUrl
      sectionData.fileType = fileType
      sectionData.fileName = fileName
      sectionData.fileCategory = fileCategory
      sectionData.cloudinaryPublicId = cloudinaryPublicId
    }

    const section = new Section(sectionData)
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
          fileCategory: section.fileCategory,
          createdAt: section.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating section:", error)

    if (error instanceof Error) {
      if (error.message === "Not authenticated" || error.message === "Invalid token") {
        return NextResponse.json({ message: "Authentication required" }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: error.message }, { status: 403 })
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: "Failed to create section" 
    }, { status: 500 })
  }
}