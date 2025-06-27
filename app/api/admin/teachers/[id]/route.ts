import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Teacher from "@/models/Teacher"
import { uploadTeacherAvatar, deleteFromCloudinary, validateImageFile } from "@/lib/upload"

interface JWTPayload {
  id: string
  email?: string
  isAdmin?: boolean
  iat?: number
  exp?: number
}

// GET - Get single teacher by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params before using
    const { id } = params

    // Verify admin authentication
    const cookieStore = await cookies() // Add await here
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

    const teacher = await Teacher.findById(id).populate("courses")

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Calculate total revenue from assigned courses
    const totalRevenue = teacher.courses?.reduce((sum: number, course: any) => sum + (course.revenue || 0), 0) || 0

    const teacherData = {
      _id: teacher._id.toString(),
      name: teacher.name,
      email: "",
      designation: teacher.designation,
      education: teacher.education,
      description: teacher.description,
      image: teacher.image || "/placeholder.svg?height=64&width=64",
      status: "active",
      coursesCount: teacher.courses?.length || 0,
      totalRevenue,
      joinedDate: teacher.createdAt,
    }

    return NextResponse.json({ success: true, teacher: teacherData })
  } catch (error) {
    console.error("Error fetching teacher:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch teacher" }, { status: 500 })
  }
}

// PUT - Update teacher by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params before using
    const { id } = params

    // Verify admin authentication
    const cookieStore = await cookies() // Add await here
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

    // Get current teacher data
    const currentTeacher = await Teacher.findById(id)
    if (!currentTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
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

    const updateData: any = {
      name,
      designation,
      education,
      description,
    }

    // Handle image upload if a new image is provided
    if (imageFile && imageFile.size > 0) {
      try {
        // Validate image file
        const validation = validateImageFile(imageFile)
        if (!validation.isValid) {
          return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        // Upload new image to Cloudinary
        const newImageUrl = await uploadTeacherAvatar(imageFile)
        console.log("New image uploaded successfully:", newImageUrl)

        // Delete old image from Cloudinary if it exists and is not a placeholder
        if (currentTeacher.image && !currentTeacher.image.includes("placeholder.svg")) {
          try {
            await deleteFromCloudinary(currentTeacher.image)
            console.log("Old image deleted from Cloudinary")
          } catch (deleteError) {
            console.error("Error deleting old image:", deleteError)
          }
        }

        updateData.image = newImageUrl
      } catch (error) {
        console.error("Image upload error:", error)
        return NextResponse.json({ error: "Failed to upload image. Please try again." }, { status: 500 })
      }
    }

    const teacher = await Teacher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("courses")

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Calculate total revenue from assigned courses
    const totalRevenue = teacher.courses?.reduce((sum: number, course: any) => sum + (course.revenue || 0), 0) || 0

    const teacherResponse = {
      _id: teacher._id.toString(),
      name: teacher.name,
      email: "",
      designation: teacher.designation,
      education: teacher.education,
      description: teacher.description,
      image: teacher.image,
      status: "active",
      coursesCount: teacher.courses?.length || 0,
      totalRevenue,
      joinedDate: teacher.createdAt,
    }

    return NextResponse.json({
      success: true,
      message: "Teacher updated successfully",
      teacher: teacherResponse,
    })
  } catch (error) {
    console.error("Error updating teacher:", error)
    return NextResponse.json({ success: false, error: "Failed to update teacher" }, { status: 500 })
  }
}

// DELETE - Delete teacher by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params before using
    const { id } = params

    // Verify admin authentication
    const cookieStore = await cookies() // Add await here
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

    // Get teacher data before deletion
    const teacher = await Teacher.findById(id)
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Check if teacher has courses assigned
    if (teacher.courses && teacher.courses.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete teacher with assigned courses. Please reassign or remove their courses first.",
        },
        { status: 400 },
      )
    }

    // Delete teacher's image from Cloudinary if it exists
    if (teacher.image && !teacher.image.includes("placeholder.svg")) {
      try {
        await deleteFromCloudinary(teacher.image)
        console.log("Teacher image deleted from Cloudinary")
      } catch (deleteError) {
        console.error("Error deleting teacher image:", deleteError)
      }
    }

    // Delete the teacher
    await Teacher.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return NextResponse.json({ success: false, error: "Failed to delete teacher" }, { status: 500 })
  }
}