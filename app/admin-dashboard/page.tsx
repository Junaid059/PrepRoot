"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import TeachersPanel from "@/components/admin/teachers-panel"
import CoursesPanel from "@/components/admin/courses-panel"
import SectionsPanel from "@/components/admin/section-panel"
import {
  Users,
  BookOpen,
  DollarSign,
  Award,
  Trash2,
  Edit,
  X,
  GraduationCap,
  UserPlus,
  Mail,
  CheckCircle,
  Layers,
} from "lucide-react"
import { toast } from "react-hot-toast"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Type definitions
interface Stats {
  totalStudents: number
  totalCourses: number
  totalRevenue: number
  totalEnrollments: number
  totalTeachers?: number
  enrollmentStats?: EnrollmentStat[]
}

interface EnrollmentStat {
  _id: {
    year: number
    month: number
    day: number
  }
  count: number
  revenue: number
}

interface RevenueData {
  monthlyRevenue: Array<{
    month: string
    revenue: number
    enrollments: number
    monthName: string
  }>
  dailyRevenue: Array<{
    date: string
    revenue: number
    enrollments: number
  }>
  totalRevenue: number
  totalEnrollments: number
}

interface Activity {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  action: string
  timestamp: string
  type: string
}

interface Course {
  id: string
  title: string
  description: string
  price: number
  category: string
  instructor: string
  thumbnail?: string | File
  sections?: number
  lectures?: number
  enrollments?: number
  revenue?: string
  trend?: number
  createdAt?: string
}

interface Student {
  id: string
  name: string
  email: string
  enrolledCourses: number
  joinedDate: string
  password?: string
}

interface CourseEnrollment {
  id: string
  student: {
    id: string
    name: string
    email: string
  }
  enrolledAt: string
  progress: number
  amountPaid: number
}

interface Category {
  name: string
  count: number
  revenue?: number
  icon: React.ElementType
}

// Admin Dashboard Main Component
export default function CompleteAdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalEnrollments: 0,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch("/api/admin/stats")

        if (!response.ok) {
          throw new Error(`Failed to fetch statistics: ${response.status} ${response.statusText}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API did not return JSON")
        }

        const data = await response.json()

        // Fetch teachers count separately to ensure it's included
        if (data.totalTeachers === undefined) {
          try {
            const teachersResponse = await fetch("/api/admin/teachers")
            if (teachersResponse.ok) {
              const teachersData = await teachersResponse.json()
              data.totalTeachers = teachersData.teachers?.length || 0
            }
          } catch (error) {
            console.error("Error fetching teacher count:", error)
            data.totalTeachers = 0
          }
        }

        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
        setError("Failed to load dashboard statistics. Please try again later.")
        toast.error("Failed to load dashboard statistics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        className="text-3xl font-bold mb-8 text-blue-600"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Admin Dashboard
      </motion.h1>

      {/* Dashboard Tabs */}
      <div className="flex flex-wrap gap-4 mb-8">
        {["overview", "students", "courses", "sections", "teachers", "enrollments"].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab === "teachers" ? (
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2" />
                <span>Teachers</span>
              </div>
            ) : tab === "enrollments" ? (
              <div className="flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                <span>Enrollments</span>
              </div>
            ) : tab === "sections" ? (
              <div className="flex items-center">
                <Layers className="h-4 w-4 mr-2" />
                <span>Sections</span>
              </div>
            ) : (
              tab.charAt(0).toUpperCase() + tab.slice(1)
            )}
          </motion.button>
        ))}
      </div>

      {/* Dashboard Content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {activeTab === "overview" && <OverviewPanel stats={stats} isLoading={isLoading} />}
        {activeTab === "students" && <StudentsPanel />}
        {activeTab === "courses" && <CoursesPanel />}
        {activeTab === "sections" && <SectionsPanel />}
        {activeTab === "teachers" && <TeachersPanel />}
        {activeTab === "enrollments" && <EnrollmentsPanel />}
      </div>
    </div>
  )
}

// Overview Panel Component with Dynamic Data
function OverviewPanel({
  stats,
  isLoading,
}: {
  stats: Stats
  isLoading: boolean
}) {
  const [categoryData, setCategoryData] = useState<Category[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [teacherCount, setTeacherCount] = useState<number>(stats.totalTeachers || 0)

  useEffect(() => {
    const handleTeachersUpdated = (event: CustomEvent) => {
      const { count } = event.detail
      setTeacherCount(count)
      stats.totalTeachers = count
    }

    window.addEventListener("teachersUpdated", handleTeachersUpdated as EventListener)

    return () => {
      window.removeEventListener("teachersUpdated", handleTeachersUpdated as EventListener)
    }
  }, [stats])

  const overviewData = [
    { name: "Students", value: stats.totalStudents, color: "#0088FE" },
    { name: "Courses", value: stats.totalCourses, color: "#00C49F" },
    { name: "Teachers", value: teacherCount, color: "#FFBB28" },
    { name: "Enrollments", value: stats.totalEnrollments, color: "#FF8042" },
  ]

  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        setIsChartLoading(true)
        setChartError(null)

        // Fetch category data
        const categoryResponse = await fetch("/api/categories")
        if (categoryResponse.ok) {
          const categoryResult = await categoryResponse.json()
          setCategoryData(categoryResult.categories || [])
        }

        // Fetch revenue data
        const revenueResponse = await fetch("/api/admin/revenue-stats")
        if (revenueResponse.ok) {
          const revenueResult = await revenueResponse.json()
          setRevenueData(revenueResult)
        }
      } catch (error) {
        console.error("Error fetching dynamic data:", error)
        setChartError("Failed to load chart data")
      } finally {
        setIsChartLoading(false)
      }
    }

    fetchDynamicData()
  }, [])

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "bg-green-500",
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers || 0,
      icon: GraduationCap,
      color: "bg-yellow-500",
    },
    {
      title: "Total Revenue",
      value: `USD ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-purple-500",
    },
    {
      title: "Total Enrollments",
      value: stats.totalEnrollments,
      icon: Award,
      color: "bg-orange-500",
    },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B", "#6B66FF"]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex items-center">
              <div className={`${card.color} p-3 rounded-lg mr-4`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{isLoading ? "..." : card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Revenue Chart */}
      {revenueData && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue and enrollment data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue" ? `PKR ${value.toLocaleString()}` : value,
                        name === "revenue" ? "Revenue" : "Enrollments",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="enrollments"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Platform Overview</h3>

          {isLoading ? (
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
            </div>
          ) : (
            <div className="h-80 w-full border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overviewData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {overviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Count"]} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Course Categories Distribution</h3>

          {isChartLoading ? (
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
            </div>
          ) : chartError ? (
            <div className="h-80 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-red-500">{chartError}</p>
            </div>
          ) : categoryData.length > 0 ? (
            <div className="h-80 w-full border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    nameKey="name"
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} courses`, name]} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No category data available</p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivityPanel />
        <TopCoursesPanel />
      </div>
    </div>
  )
}

// Recent Activity Panel
function RecentActivityPanel() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch("/api/admin/activities")

        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Activities API did not return JSON")
        }

        const data = await response.json()
        setActivities(data.activities || [])
      } catch (error) {
        console.error("Error fetching activities:", error)
        setError("Failed to load activities")
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Recent Activity</h3>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <span className="text-blue-600 dark:text-blue-300 text-sm font-bold">
                    {activity.user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-gray-800 dark:text-white">
                    <span className="font-medium">{activity.user.name}</span> {activity.action}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No recent activities found.</p>
      )}
    </motion.div>
  )
}

// Top Courses Panel
function TopCoursesPanel() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopCourses = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch("/api/admin/top-courses")

        if (!response.ok) {
          throw new Error(`Failed to fetch top courses: ${response.status} ${response.statusText}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Top courses API did not return JSON")
        }

        const data = await response.json()
        setCourses(data.courses || [])
      } catch (error) {
        console.error("Error fetching top courses:", error)
        setError("Failed to load top courses")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopCourses()
  }, [])

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Top Performing Courses</h3>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="space-y-4">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden mr-3">
                  {course.thumbnail ? (
                    <img
                      src={
                        typeof course.thumbnail === "string" ? course.thumbnail : "/placeholder.svg?height=48&width=48"
                      }
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{course.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{course.enrollments} enrollments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 dark:text-green-400">PKR {course.revenue}</p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className={course.trend && course.trend > 0 ? "text-green-500" : "text-red-500"}>
                    {course.trend && course.trend > 0 ? "↑" : "↓"} {course.trend && Math.abs(course.trend)}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No courses found.</p>
      )}
    </motion.div>
  )
}

// Students Panel Component
function StudentsPanel() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/students")

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Students API did not return JSON")
      }

      const data = await response.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error("Error fetching students:", error)
      setError("Failed to load students")
      toast.error("Failed to load students")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student)
  }

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/students/${studentToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete student")

      toast.success("Student deleted successfully")
      setStudentToDelete(null)
      fetchStudents()
    } catch (error) {
      console.error("Error deleting student:", error)
      toast.error("Failed to delete student")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingStudent),
      })

      if (!response.ok) throw new Error("Failed to update student")

      toast.success("Student updated successfully")
      setEditingStudent(null)
      fetchStudents()
    } catch (error) {
      console.error("Error updating student:", error)
      toast.error("Failed to update student")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Students</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Enrolled Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                          <span className="text-blue-600 dark:text-blue-300 font-bold">{student.name.charAt(0)}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.enrolledCourses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(student.joinedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        disabled={isSubmitting}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Student Confirmation Dialog */}
      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Are you sure you want to delete this student?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {studentToDelete && (
                <>
                  This will permanently delete <strong>{studentToDelete.name}</strong> and all their data. This action
                  cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStudent}
              disabled={isSubmitting}
              className="bg-red-600 text-white hover:bg-red-700 border-0"
            >
              {isSubmitting ? "Deleting..." : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Student</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Name</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  value={editingStudent.email}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Reset Password</label>
                <input
                  type="password"
                  placeholder="New password (leave empty to keep current)"
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 mr-2"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Enrollments Panel Component
function EnrollmentsPanel() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualEnrollment, setShowManualEnrollment] = useState<boolean>(false)
  const [manualEnrollmentEmail, setManualEnrollmentEmail] = useState<string>("")
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/admin/courses")
      if (!response.ok) throw new Error("Failed to fetch courses")

      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to load courses")
    }
  }

  const fetchCourseEnrollments = async (courseId: string) => {
    if (!courseId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/enrollments`)

      if (!response.ok) {
        throw new Error("Failed to fetch course enrollments")
      }

      const data = await response.json()
      setCourseEnrollments(data.enrollments || [])
    } catch (error) {
      console.error("Error fetching course enrollments:", error)
      setError("Failed to load course enrollments")
      toast.error("Failed to load course enrollments")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId)
    if (courseId) {
      fetchCourseEnrollments(courseId)
    } else {
      setCourseEnrollments([])
    }
  }

  const handleManualEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCourse || !manualEnrollmentEmail.trim()) {
      toast.error("Please select a course and enter a valid email")
      return
    }

    setIsEnrolling(true)

    try {
      const response = await fetch("/api/admin/manual-enrollment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          studentEmail: manualEnrollmentEmail.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to enroll student")
      }

      toast.success("Student enrolled successfully!")
      setManualEnrollmentEmail("")
      setShowManualEnrollment(false)

      // Refresh the enrollments list
      fetchCourseEnrollments(selectedCourse)
    } catch (error) {
      console.error("Error enrolling student:", error)
      toast.error(error instanceof Error ? error.message : "Failed to enroll student")
    } finally {
      setIsEnrolling(false)
    }
  }

  const selectedCourseData = courses.find((course) => course.id === selectedCourse)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Course Enrollments</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCourse}
            onChange={(e) => handleCourseSelect(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          {selectedCourse && (
            <Button onClick={() => setShowManualEnrollment(true)} className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Manual Enrollment
            </Button>
          )}
        </div>
      </div>

      {selectedCourse && selectedCourseData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              {selectedCourseData.title}
            </CardTitle>
            <CardDescription>
              Price: PKR {selectedCourseData.price} • Total Enrollments: {courseEnrollments.length}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {selectedCourse ? (
        isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : courseEnrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Enrolled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount Paid
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {courseEnrollments.map((enrollment) => (
                  <motion.tr
                    key={enrollment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                          <span className="text-green-600 dark:text-green-300 font-bold">
                            {enrollment.student.name.charAt(0)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {enrollment.student.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {enrollment.student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${enrollment.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{enrollment.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                     USD {enrollment.amountPaid ? enrollment.amountPaid.toLocaleString() : 'N/A'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No students enrolled in this course yet.
          </div>
        )
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Please select a course to view its enrollments.
        </div>
      )}

      {/* Manual Enrollment Modal */}
      {showManualEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Manual Enrollment</h3>
              <button
                onClick={() => setShowManualEnrollment(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                disabled={isEnrolling}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualEnrollment}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Course</label>
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-800 dark:text-white font-medium">{selectedCourseData?.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Price: PKR {selectedCourseData?.price}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Student Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    value={manualEnrollmentEmail}
                    onChange={(e) => setManualEnrollmentEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    placeholder="Enter student's email address"
                    required
                    disabled={isEnrolling}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  The student must already have an account with this email address.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowManualEnrollment(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isEnrolling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center ${
                    isEnrolling ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enroll Student
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
