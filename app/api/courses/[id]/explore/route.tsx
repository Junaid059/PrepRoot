// File: app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from "@/lib/db"

import Course from "@/models/Course"

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const minPrice = parseInt(searchParams.get('minPrice') || '0')
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const level = searchParams.get('level') || ''

    // Build MongoDB query
    const query: any = {}
    
    // Search filter - searches across title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Category filter
    if (category && category !== 'All') {
      query.category = category
    }
    
    // Level filter
    if (level && level !== 'All') {
      query.level = level
    }
    
    // Price filter
    query.price = { $gte: minPrice, $lte: maxPrice }

    // Execute queries in parallel for better performance
    const [courses, totalCount] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name email') // Populate instructor details
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Course.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      courses: courses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: {
        search,
        category,
        level,
        minPrice,
        maxPrice
      }
    })

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses',
        courses: []
      },
      { status: 500 }
    )
  }
}

// Optional: Add POST method for creating courses (if needed)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate required fields
    const { title, description, price, category, instructor } = body
    
    if (!title || !description || price === undefined || !category || !instructor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, description, price, category, instructor'
        },
        { status: 400 }
      )
    }
    
    const course = new Course(body)
    await course.save()
    
    // Populate instructor details in response
    await course.populate('instructor', 'name email')
    
    return NextResponse.json({
      success: true,
      course: course
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create course'
      },
      { status: 500 }
    )
  }
}