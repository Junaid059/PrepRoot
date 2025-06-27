import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import mongoose from 'mongoose';

// Define interfaces for better type safety
interface DecodedToken extends JwtPayload {
  id: string;
  email: string;
  isAdmin: boolean;
}

interface EnrollmentDocument {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  progress?: number;
  completedLectures?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt?: Date;
  amountPaid?: number;
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

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json(
        { message: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Check if enrolled with proper typing
    const enrollment = (await Enrollment.findOne({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
    }).lean()) as EnrollmentDocument | null;

    console.log(
      'Enrollment check - UserId:',
      userId,
      'CourseId:',
      courseId,
      'Found:',
      !!enrollment
    );

    return NextResponse.json({
      isEnrolled: !!enrollment,
      enrollment: enrollment
        ? {
            id: enrollment._id.toString(),
            progress: enrollment.progress ?? 0,
            completedLectures:
              enrollment.completedLectures?.map((id) => id.toString()) ?? [],
            createdAt: enrollment.createdAt,
            amountPaid: enrollment.amountPaid ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error(
      'Enrollment check error:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ObjectId')) {
        return NextResponse.json(
          { message: 'Invalid ID format' },
          { status: 400 }
        );
      }

      if (error.message.includes('connection')) {
        return NextResponse.json(
          { message: 'Database connection error' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        message: 'Server error',
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined,
      },
      { status: 500 }
    );
  }
}
