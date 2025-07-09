"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Filter, X } from "lucide-react"
import CourseCard from "@/components/course-card"

// Define TypeScript interfaces
interface Instructor {
  _id: string;
  name: string;
  email: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  level?: string;
  rating?: number;
  instructor: Instructor | string;
  image?: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  courses: Course[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: {
    search: string;
    category: string;
    level: string;
    minPrice: number;
    maxPrice: number;
  };
}

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") || ""
  const initialCategory = searchParams.get("category") || ""

  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState("popular")
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0
  })
  const [categories, setCategories] = useState<string[]>([])
  const [maxPrice, setMaxPrice] = useState(1000)

  // Use refs to track the current values for debouncing
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const isInitialRender = useRef(true)

  // Fetch courses function
  const fetchCourses = useCallback(async (
    search: string = "",
    category: string = "",
    minPrice: number = 0,
    maxPrice: number = 999999,
    page: number = 1
  ) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams({
        search: search.trim(),
        category: category.trim(),
        minPrice: minPrice.toString(),
        maxPrice: maxPrice.toString(),
        page: page.toString(),
        limit: '50'
      })
      
      // Clean up empty parameters
      const cleanParams = new URLSearchParams()
      queryParams.forEach((value, key) => {
        if (value && value !== '' && value !== '0' && !(key === 'maxPrice' && value === '999999')) {
          cleanParams.append(key, value)
        }
      })
      
      // Always include page and limit
      if (!cleanParams.has('page')) cleanParams.append('page', '1')
      if (!cleanParams.has('limit')) cleanParams.append('limit', '50')
      
      console.log('Fetching courses with params:', cleanParams.toString())
      
      const response = await fetch(`/api/courses/explore?${cleanParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      console.log('API Response:', data)
      
      if (data.success) {
        setCourses(data.courses || [])
        setPagination({
          page: data.pagination?.page || 1,
          total: data.pagination?.total || data.courses?.length || 0,
          totalPages: data.pagination?.totalPages || 1
        })

        // Extract categories from courses if not provided by API
        if (data.courses && data.courses.length > 0) {
          const uniqueCategories = [...new Set(data.courses.map(course => course.category).filter(Boolean))]
          setCategories(uniqueCategories)
          
          // Update max price based on courses only on initial load
          if (isInitialRender.current) {
            const courseMaxPrice = Math.max(...data.courses.map(course => course.price), 1000)
            if (courseMaxPrice > 1000) {
              setMaxPrice(courseMaxPrice)
              setPriceRange([0, courseMaxPrice])
            }
            isInitialRender.current = false
          }
        }
      } else {
        console.error('API returned success: false', data)
        setCourses([])
        setPagination({ page: 1, total: 0, totalPages: 0 })
        setError('Failed to load courses')
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      setCourses([])
      setPagination({ page: 1, total: 0, totalPages: 0 })
      setError(error instanceof Error ? error.message : 'Failed to load courses')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      fetchCourses(searchQuery, selectedCategory, priceRange[0], priceRange[1], 1)
    }, 500)

    // Cleanup function
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [searchQuery, selectedCategory, priceRange, fetchCourses])

  // Initial load
  useEffect(() => {
    fetchCourses(initialSearch, initialCategory)
  }, [fetchCourses, initialSearch, initialCategory])

  // Client-side sorting (since API handles filtering)
  const sortedCourses = useMemo(() => {
    if (!courses.length) return []
    
    let sorted = [...courses]

    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "price-low":
        sorted.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        sorted.sort((a, b) => b.price - a.price)
        break
      case "rating":
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case "popular":
      default:
        sorted.sort((a, b) => {
          const ratingDiff = (b.rating || 0) - (a.rating || 0)
          if (ratingDiff === 0) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          }
          return ratingDiff
        })
        break
    }

    return sorted
  }, [courses, sortBy])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Search is handled automatically by useEffect
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category)
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const value = Number.parseInt(e.target.value) || 0
    setPriceRange(prev => {
      const newRange = [...prev] as [number, number]
      newRange[index] = value
      // Ensure min doesn't exceed max and vice versa
      if (index === 0 && value > prev[1]) {
        newRange[1] = value
      } else if (index === 1 && value < prev[0]) {
        newRange[0] = value
      }
      return newRange
    })
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setPriceRange([0, maxPrice])
    setSortBy("popular")
    setIsFilterOpen(false)
    setError(null)
  }

  const hasActiveFilters = searchQuery || selectedCategory || priceRange[0] > 0 || priceRange[1] < maxPrice

  const handleRetry = () => {
    setError(null)
    fetchCourses(searchQuery, selectedCategory, priceRange[0], priceRange[1], 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Courses</h1>
          <p className="text-lg text-gray-600">
            Discover our wide range of courses to help you achieve your learning goals
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pl-12 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </form>

            <div className="flex gap-4">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categories */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <div key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`category-${category}`}
                            checked={selectedCategory === category}
                            onChange={() => handleCategoryChange(category)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                            {category}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No categories available</p>
                    )}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">${priceRange[0]}</span>
                      <span className="text-sm text-gray-600">${priceRange[1]}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max={maxPrice}
                        step="10"
                        value={priceRange[0]}
                        onChange={(e) => handlePriceChange(e, 0)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max={maxPrice}
                        step="10"
                        value={priceRange[1]}
                        onChange={(e) => handlePriceChange(e, 1)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer absolute top-0"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label htmlFor="min-price" className="block text-xs text-gray-600 mb-1">
                          Min Price
                        </label>
                        <input
                          type="number"
                          id="min-price"
                          min="0"
                          max={priceRange[1]}
                          value={priceRange[0]}
                          onChange={(e) => handlePriceChange(e, 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="max-price" className="block text-xs text-gray-600 mb-1">
                          Max Price
                        </label>
                        <input
                          type="number"
                          id="max-price"
                          min={priceRange[0]}
                          max={maxPrice}
                          value={priceRange[1]}
                          onChange={(e) => handlePriceChange(e, 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isLoading ? "Loading courses..." : `${pagination.total} Courses Found`}
            </h2>
            <div className="flex items-center">
              <label htmlFor="sort" className="text-sm text-gray-600 mr-2">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={`skeleton-${i}`} className="bg-white rounded-xl shadow-md p-4 h-96 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">Failed to load courses</p>
                <p className="text-sm text-gray-500">Please try again or check your connection.</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            sortedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedCourses.map((course, index) => (
                  <CourseCard 
                    key={course._id || `course-${index}`} 
                    course={course} 
                    index={index} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-2">No courses found matching your criteria.</p>
                  <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}