import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Teacher from "@/models/Teacher"
import Course from "@/models/Course"
import Enrollment from "@/models/Enrollment"

interface JWTPayload {
  id: string
  email?: string
  isAdmin?: boolean
  iat?: number
  exp?: number
}

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

    // Get current date and last month date for growth calculation
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

    // Get basic stats
    const [
      totalStudents,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      totalTeachers,
      lastMonthStudents,
      lastMonthRevenue,
      lastMonthEnrollments,
      currentMonthStudents,
      currentMonthRevenue,
      currentMonthEnrollments,
      twoMonthsAgoStudents,
      twoMonthsAgoRevenue,
      twoMonthsAgoEnrollments,
    ] = await Promise.all([
      // Basic totals
      User.countDocuments({ isAdmin: { $ne: true } }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$amountPaid", 0] } },
          },
        },
      ]).then((result) => result[0]?.total || 0),
      Teacher.countDocuments(), // Use Teacher model for teacher count

      // Last month data (for month-over-month comparison)
      User.countDocuments({
        isAdmin: { $ne: true },
        createdAt: { $gte: lastMonth, $lt: currentMonth },
      }),
      Enrollment.aggregate([
        {
          $match: {
            enrolledAt: { $gte: lastMonth, $lt: currentMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$amountPaid", 0] } },
          },
        },
      ]).then((result) => result[0]?.total || 0),
      Enrollment.countDocuments({
        enrolledAt: { $gte: lastMonth, $lt: currentMonth },
      }),

      // Current month data
      User.countDocuments({
        isAdmin: { $ne: true },
        createdAt: { $gte: currentMonth },
      }),
      Enrollment.aggregate([
        {
          $match: {
            enrolledAt: { $gte: currentMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$amountPaid", 0] } },
          },
        },
      ]).then((result) => result[0]?.total || 0),
      Enrollment.countDocuments({
        enrolledAt: { $gte: currentMonth },
      }),

      // Two months ago data (for better growth comparison when last month is 0)
      User.countDocuments({
        isAdmin: { $ne: true },
        createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
      }),
      Enrollment.aggregate([
        {
          $match: {
            enrolledAt: { $gte: twoMonthsAgo, $lt: lastMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$amountPaid", 0] } },
          },
        },
      ]).then((result) => result[0]?.total || 0),
      Enrollment.countDocuments({
        enrolledAt: { $gte: twoMonthsAgo, $lt: lastMonth },
      }),
    ])

    // Helper function to calculate growth rate
    const calculateGrowth = (current: number, previous: number, fallback = 0): number => {
      if (previous === 0) {
        return fallback === 0 ? 0 : ((current - fallback) / Math.max(fallback, 1)) * 100
      }
      return ((current - previous) / previous) * 100
    }

    // Calculate growth rates with fallback to two months ago if last month is 0
    const studentGrowth = calculateGrowth(currentMonthStudents, lastMonthStudents, twoMonthsAgoStudents)
    const revenueGrowth = calculateGrowth(currentMonthRevenue, lastMonthRevenue, twoMonthsAgoRevenue)
    const enrollmentGrowth = calculateGrowth(currentMonthEnrollments, lastMonthEnrollments, twoMonthsAgoEnrollments)

    const stats = {
      totalStudents,
      totalCourses,
      totalRevenue,
      totalEnrollments,
      totalTeachers, // Now using Teacher model count
      monthlyGrowth: {
        students: Math.round(studentGrowth * 100) / 100,
        revenue: Math.round(revenueGrowth * 100) / 100,
        enrollments: Math.round(enrollmentGrowth * 100) / 100,
      },
      // Additional context for debugging
      currentMonth: {
        students: currentMonthStudents,
        revenue: currentMonthRevenue,
        enrollments: currentMonthEnrollments,
      },
      lastMonth: {
        students: lastMonthStudents,
        revenue: lastMonthRevenue,
        enrollments: lastMonthEnrollments,
      },
    }

    console.log("Dashboard stats:", stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json(
      {
        message: "Server error",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "Internal server error",
      },
      { status: 500 },
    )
  }
}
