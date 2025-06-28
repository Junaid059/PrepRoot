"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Filter, X } from "lucide-react"
import CourseCard from "@/components/course-card"
import { debounce } from "lodash"

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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
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

  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  // Debounced search function for better performance
  const debouncedFetchCourses = useCallback(
    debounce((query: string, category: string, minPrice: number, maxPrice: number) => {
      fetchCourses(query, category, minPrice, maxPrice)
    }, 500),
    []
  )

  // Load courses when component mounts or filters change
  useEffect(() => {
    debouncedFetchCourses(searchQuery, selectedCategory, priceRange[0], priceRange[1])
  }, [searchQuery, selectedCategory, priceRange, debouncedFetchCourses])

  const fetchCourses = async (
    search: string = "",
    category: string = "",
    minPrice: number = 0,
    maxPrice: number = 999999,
    page: number = 1
  ) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        search,
        category,
        minPrice: minPrice.toString(),
        maxPrice: maxPrice.toString(),
        page: page.toString(),
        limit: '50' // Increase limit to get more courses
      })
      
      const response = await fetch(`/api/courses?${queryParams}`)
      if (response.ok) {
        const data: ApiResponse = await response.json()
        setAllCourses(data.courses || [])
        setPagination({
          page: data.pagination?.page || 1,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0
        })
      } else {
        console.log(`Failed to fetch courses: ${response.status} ${response.statusText}`)
        setAllCourses([])
      }
    } catch (error) {
      console.log("Error fetching courses:", error instanceof Error ? error.message : String(error))
      setAllCourses([])
    } finally {
      setIsLoading(false)
    }
  }

  // Get unique categories from all courses dynamically
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allCourses.map(course => course.category))]
    return uniqueCategories.filter(Boolean)
  }, [allCourses])

  // Calculate dynamic price range from all courses
  const maxCoursePrice = useMemo(() => {
    return allCourses.length > 0 ? Math.max(...allCourses.map(course => course.price)) : 1000
  }, [allCourses])

  // Update price range when courses are loaded
  useEffect(() => {
    if (allCourses.length > 0 && priceRange[1] === 1000) {
      const maxPrice = Math.max(...allCourses.map(course => course.price))
      setPriceRange([0, maxPrice])
    }
  }, [allCourses, priceRange])

  // Client-side sorting only (since filtering is done server-side)
  const sortedCourses = useMemo(() => {
    let sorted = [...allCourses]

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
  }, [allCourses, sortBy])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Search is handled automatically by useEffect
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category)
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const newPriceRange = [...priceRange]
    newPriceRange[index] = Number.parseInt(e.target.value)
    setPriceRange(newPriceRange as [number, number])
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setPriceRange([0, maxCoursePrice])
    setSortBy("popular")
    setIsFilterOpen(false)
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
                  className="w-full py-3 pl-12 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                {(selectedCategory || priceRange[0] > 0 || priceRange[1] < maxCoursePrice) && (
                  <span className="ml-2 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
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
                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categories */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`category-${category}`}
                          checked={selectedCategory === category}
                          onChange={() => handleCategoryChange(category)}
                          className="h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300 rounded"
                        />
                        <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                          {category}
                        </label>
                      </div>
                    ))}
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
                        max={maxCoursePrice}
                        step="10"
                        value={priceRange[0]}
                        onChange={(e) => handlePriceChange(e, 0)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max={maxCoursePrice}
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
                          max={maxCoursePrice}
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
                className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
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