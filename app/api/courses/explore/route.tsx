import { NextRequest, NextResponse } from 'next/server'
import connectDB  from '@/lib/db' // Adjust path as needed
import Course from '@/models/Course' // Adjust path as needed

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB()

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const minPrice = Number(searchParams.get('minPrice')) || 0
    const maxPrice = Number(searchParams.get('maxPrice')) || 999999
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 50

    // Build MongoDB query
    const query: any = {}

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Add category filter
    if (category) {
      query.category = { $regex: category, $options: 'i' }
    }

    // Add price range filter
    if (minPrice > 0 || maxPrice < 999999) {
      query.price = {}
      if (minPrice > 0) query.price.$gte = minPrice
      if (maxPrice < 999999) query.price.$lte = maxPrice
    }

    console.log('MongoDB Query:', JSON.stringify(query, null, 2))

    // Execute query with pagination
    const skip = (page - 1) * limit
    
    const [courses, totalCount] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name email')
        .sort({ createdAt: -1 }) // Default sort by newest
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      courses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      },
      filters: {
        search,
        category,
        level: '', // Add level filter if needed
        minPrice,
        maxPrice
      }
    })

  } catch (error) {
    console.error('Error in /api/courses/explore:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Optional: Add POST method for more complex queries
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const {
      search = '',
      category = '',
      level = '',
      minPrice = 0,
      maxPrice = 999999,
      page = 1,
      limit = 50,
      sortBy = 'newest'
    } = body

    const query: any = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' }
    }

    if (level) {
      query.level = { $regex: level, $options: 'i' }
    }

    if (minPrice > 0 || maxPrice < 999999) {
      query.price = {}
      if (minPrice > 0) query.price.$gte = minPrice
      if (maxPrice < 999999) query.price.$lte = maxPrice
    }

    // Handle sorting
    let sortOptions: any = { createdAt: -1 }
    switch (sortBy) {
      case 'newest':
        sortOptions = { createdAt: -1 }
        break
      case 'oldest':
        sortOptions = { createdAt: 1 }
        break
      case 'price-low':
        sortOptions = { price: 1 }
        break
      case 'price-high':
        sortOptions = { price: -1 }
        break
      case 'rating':
        sortOptions = { rating: -1 }
        break
      case 'title':
        sortOptions = { title: 1 }
        break
      default:
        sortOptions = { createdAt: -1 }
    }

    const skip = (page - 1) * limit
    
    const [courses, totalCount] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      courses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
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
    console.error('Error in POST /api/courses/explore:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}