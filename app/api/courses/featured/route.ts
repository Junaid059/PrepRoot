import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Course from "@/models/Course"
import Enrollment from "@/models/Enrollment"

export async function GET() {
  try {
    await connectDB()

    // Get featured courses (for demo, we'll just get the most recent ones)
    const courses = await Course.find().sort({ createdAt: -1 }).limit(3).populate("instructor", "name")

    // Get additional data for each course
    const formattedCourses = await Promise.all(
      courses.map(async (course) => {
        // Count enrollments
        const enrollmentsCount = await Enrollment.countDocuments({ course: course._id })

        // Calculate average rating (mock data for now)
        const rating = 4.5 + Math.random() * 0.5 // Random rating between 4.5 and 5.0

        return {
          id: course._id,
          title: course.title,
          instructor: course.instructor ? course.instructor.name : "Unknown Instructor",
          thumbnail: course.thumbnail || "/placeholder.svg?height=200&width=350",
          price: course.price,
          category: course.category,
          rating: rating.toFixed(1),
          students: enrollmentsCount || Math.floor(Math.random() * 10000) + 1000, // Random enrollment count for demo
          duration: course.duration || `${Math.floor(Math.random() * 30) + 20} hours`, // Random duration for demo
          level: course.level || "All Levels",
        }
      }),
    )

    return NextResponse.json({ courses: formattedCourses })
  } catch (error) {
    console.error("Error fetching featured courses:", error)
    return NextResponse.json({ error: "Failed to fetch featured courses" }, { status: 500 })
  }
}
