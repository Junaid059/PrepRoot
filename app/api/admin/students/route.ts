import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Enrollment from "@/models/Enrollment"

export async function GET() {
  try {
    await connectDB()

    // Get all non-admin users
    const users = await User.find({ isAdmin: false }).select("-password")

    // Get enrollment counts for each user
    const studentsWithEnrollments = await Promise.all(
      users.map(async (user) => {
        const enrollmentCount = await Enrollment.countDocuments({ user: user._id })

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          enrolledCourses: enrollmentCount,
          joinedDate: user.createdAt,
          avatar: user.avatar,
        }
      }),
    )

    return NextResponse.json({ students: studentsWithEnrollments })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}
