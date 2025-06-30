import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import mongoose from 'mongoose';

// Interface for lean course document
interface LeanCourse {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  price?: number;
  instructor?: string | { _id: string; name: string; email: string };
  thumbnail?: string;
  category?: string;
  duration?: string;
  enrollmentCount?: number;
  rating?: number;
  level?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter object
    const filter: any = {};

    // Search filter - search in title, description, and instructor name
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'instructor.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Level filter
    if (level) {
      filter.level = level;
    }

    // Price range filter
    if (minPrice >= 0 || maxPrice < 999999) {
      filter.price = {
        $gte: minPrice,
        $lte: maxPrice
      };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch courses with filters and pagination
    const [courses, totalCount] = await Promise.all([
      Course.find(filter)
        .populate('instructor', 'name email')
        .select('title description price category level rating instructor thumbnail createdAt enrollmentCount duration whatYouWillLearn requirements')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanCourse[]>()
        .exec(),
      Course.countDocuments(filter)
    ]);

    // Transform courses data
    const transformedCourses = courses.map(course => ({
      _id: course._id.toString(),
      title: course.title || 'Untitled Course',
      description: course.description || 'No description available',
      price: typeof course.price === 'number' ? course.price : 0,
      category: course.category || 'General',
      level: course.level || 'Beginner',
      rating: typeof course.rating === 'number' ? course.rating : 4.5,
      instructor: course.instructor || 'Unknown Instructor',
      image: course.thumbnail || null,
      createdAt: course.createdAt?.toISOString() || new Date().toISOString(),
      enrollmentCount: typeof course.enrollmentCount === 'number' ? course.enrollmentCount : 0,
      duration: course.duration || '0 hours',
      whatYouWillLearn: Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn : [],
      requirements: Array.isArray(course.requirements) ? course.requirements : []
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      courses: transformedCourses,
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
    });

  } catch (error) {
    console.error('Error fetching courses:', error);

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('buffering timed out')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Database connection timeout',
            courses: [],
            pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses',
        courses: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined,
      },
      { status: 500 }
    );
  }
}