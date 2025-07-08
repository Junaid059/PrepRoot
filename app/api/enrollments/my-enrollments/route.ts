import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import mongoose from 'mongoose';

// Define interfaces for better type safety
interface DecodedToken extends jwt.JwtPayload {
  id: string;
  email: string;
  isAdmin: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token with proper typing
    let decoded: DecodedToken;
    try {
      const result = jwt.verify(token, process.env.JWT_SECRET as string);
      decoded = result as DecodedToken;
    } catch (error) {
      console.error(
        'Token verification error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    await connectDB();
    
    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: 'Invalid user ID format', enrollments: [] },
        { status: 400 }
      );
    }
    
    // Find all enrollments for the user and populate the course details
    const enrollments = await Enrollment.find({ user: userId })
      .populate({
        path: 'course',
        select: 'title description thumbnail category price instructor',
        populate: {
          path: 'instructor',
          select: 'name'
        }
      })
      .sort({ enrolledAt: -1 })
      .lean();
      
    // If no enrollments found, return empty array
    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollments found for user:', userId);
      return NextResponse.json({ 
        message: 'No enrollments found', 
        enrollments: [] 
      });
    }

    // Format the response with safe checks to prevent errors
    const formattedEnrollments = enrollments.map(enrollment => {
      try {
        // Check if course exists in the enrollment
        if (!enrollment || !enrollment.course) {
          console.warn('Skipping enrollment - missing course data:', enrollment?._id);
          return null;
        }
        
        return {
          id: enrollment._id ? enrollment._id.toString() : (enrollment.id || ''),
          enrolledAt: enrollment.enrolledAt,
          progress: typeof enrollment.progress === 'number' ? enrollment.progress : 0,
          course: {
            id: enrollment.course._id ? enrollment.course._id.toString() : 
               (enrollment.course.id || ''),
            title: enrollment.course.title || 'Untitled Course',
            description: enrollment.course.description || '',
            thumbnail: enrollment.course.thumbnail || '',
            category: enrollment.course.category || 'Uncategorized',
            price: typeof enrollment.course.price === 'number' ? enrollment.course.price : 0,
            instructor: typeof enrollment.course.instructor === 'object' 
              ? {
                  id: enrollment.course.instructor._id ? 
                     enrollment.course.instructor._id.toString() : 
                     (enrollment.course.instructor.id || ''),
                  name: enrollment.course.instructor.name || 'Instructor'
                }
              : { 
                  id: enrollment.course.instructor ? enrollment.course.instructor.toString() : '', 
                  name: 'Instructor' 
                }
          }
        };
      } catch (error) {
        console.error('Error processing enrollment:', error, enrollment?._id);
        return null;
      }
    }).filter(Boolean); // Filter out any null entries

    return NextResponse.json({
      enrollments: formattedEnrollments
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
