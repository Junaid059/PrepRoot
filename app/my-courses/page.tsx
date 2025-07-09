"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Clock, ChevronRight, Loader2, Search, Star } from "lucide-react"

interface Instructor {
  id: string
  name: string
}

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  category: string
  price: number
  instructor: Instructor
}

interface Enrollment {
  id: string
  enrolledAt: string
  progress: number
  course: Course
}

// Type guard for enrollment validation
function isValidEnrollment(enrollment: any): enrollment is Enrollment {
  return (
    enrollment &&
    typeof enrollment.id === 'string' &&
    enrollment.course &&
    typeof enrollment.course.id === 'string' &&
    typeof enrollment.course.title === 'string'
  )
}

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([])
  
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push("/login")
      return
    }
    
    // Don't allow admin to access this page
    if (user.isAdmin) {
      router.push("/admin-dashboard")
      return
    }
    
    fetchEnrollments()
  }, [user, authLoading, router])
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEnrollments(enrollments)
    } else {
      const filtered = enrollments.filter(enrollment => 
        enrollment.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.course.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredEnrollments(filtered)
    }
  }, [searchQuery, enrollments])
  
  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      console.log("Fetching enrollments for user:", user?.id) // Debug log
      const response = await fetch('/api/enrollments/my-enrollments')
      
      if (!response.ok) {
        console.error("API response not ok:", response.status, response.statusText)
        throw new Error('Failed to fetch enrollments')
      }
      
      const data = await response.json()
      console.log("Raw API response:", data) // Debug log
      
      // Check if enrollments data exists and is an array
      if (data && Array.isArray(data.enrollments)) {
        // Filter out any enrollments with missing or invalid data
        const validEnrollments = data.enrollments.filter((enrollment: any) => {
          const isValid = isValidEnrollment(enrollment)
          if (!isValid) {
            console.warn("Invalid enrollment:", enrollment)
          }
          return isValid
        }) as Enrollment[]
        
        console.log('Valid enrollments:', validEnrollments)
        setEnrollments(validEnrollments)
        setFilteredEnrollments(validEnrollments)
        
        if (validEnrollments.length === 0) {
          console.log("No valid enrollments found")
        }
      } else {
        console.error('Invalid enrollments data format:', data)
        setEnrollments([])
        setFilteredEnrollments([])
        toast.error('Invalid course data received')
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      toast.error('Failed to load your courses')
      // Initialize with empty arrays to avoid undefined errors
      setEnrollments([])
      setFilteredEnrollments([])
    } finally {
      setLoading(false)
    }
  }
  
  // Format date to a readable string
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    
    try {
      const date = new Date(dateString)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-[#2563eb] mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
          </div>
          
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search your courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-t-[#2563eb] border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            {searchQuery.trim() !== "" ? (
              <div>
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">No courses found</h2>
                <p className="text-gray-600 mb-4">
                  No courses match your search query. Try a different search term.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div>
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">No courses yet</h2>
                <p className="text-gray-600 mb-4">
                  You haven't enrolled in any courses yet.
                </p>
                <Link
                  href="/explore"
                  className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors inline-block"
                >
                  Explore Courses
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.filter(enrollment => 
              enrollment && enrollment.course && enrollment.course.title
            ).map((enrollment) => (
              <motion.div
                key={enrollment.id || `enrollment-${Math.random()}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 w-full">
                  {enrollment.course.thumbnail ? (
                    <div className="relative h-full w-full">
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        className="object-cover h-full w-full"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder.jpg'; // Fallback image
                        }}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <span className="px-2 py-1 bg-[#2563eb]/90 text-white text-xs font-medium rounded">
                      {enrollment.course.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {enrollment.course.title}
                  </h2>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <span>Instructor: {enrollment.course.instructor.name}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Enrolled: {formatDate(enrollment.enrolledAt)}</span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-[#2563eb] rounded-full"
                        style={{ 
                          width: `${typeof enrollment.progress === 'number' ? 
                            Math.min(Math.max(enrollment.progress, 0), 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-600">
                      <span>Progress</span>
                      <span>
                        {typeof enrollment.progress === 'number' ? 
                          Math.min(Math.max(enrollment.progress, 0), 100) : 0}%
                      </span>
                    </div>
                  </div>
                  
                  <Link
                    href={`/courses/${enrollment.course.id}`}
                    className="flex items-center justify-center w-full py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Continue Learning
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
