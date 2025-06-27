import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Course from "@/models/Course"
import Enrollment from "@/models/Enrollment"

export async function GET() {
  try {
    await connectDB()

    // Get all courses
    const courses = await Course.find()

    // Get enrollment counts and calculate revenue for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await Enrollment.countDocuments({ course: course._id })
        const revenue = course.price * enrollments

        // Calculate a random trend percentage for demo purposes
        // In a real app, you would compare with previous period data
        const trend = Math.floor(Math.random() * 41) - 20 // Random number between -20 and 20

        return {
          id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          price: course.price,
          enrollments,
          revenue: revenue.toFixed(2),
          trend,
        }
      }),
    )

    // Sort by revenue (highest first) and take top 5
    const topCourses = coursesWithStats.sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    return NextResponse.json({ courses: topCourses })
  } catch (error) {
    console.error("Error fetching top courses:", error)
    return NextResponse.json({ error: "Failed to fetch top courses" }, { status: 500 })
  }
}
