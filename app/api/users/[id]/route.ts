import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Course from "@/models/Course"

export async function GET(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    // Find user by ID
    const user = await User.findById(id).select("-password")

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get additional instructor stats
    const coursesCount = await Course.countDocuments({ instructor: id })

    // Get total students across all courses (this is a simplified version)
    const courses = await Course.find({ instructor: id })
    const studentsCount = courses.reduce((total, course) => total + (course.enrollmentCount || 0), 0)

    // Format user data
    const formattedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio || "No bio available.",
      isAdmin: user.isAdmin,
      coursesCount,
      studentsCount,
      createdAt: user.createdAt,
    }

    return NextResponse.json({ user: formattedUser })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
