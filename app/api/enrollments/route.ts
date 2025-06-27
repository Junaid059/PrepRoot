import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
import User from '@/models/User';
import Activity from '@/models/Activity';
import mongoose from 'mongoose';

// Interface for JWT payload
interface JWTPayload {
  id: string;
  email?: string;
  iat?: number;
  exp?: number;
}

// Interface for enrollment request body
interface EnrollmentRequestBody {
  courseId: string;
  paymentId?: string;
  amount?: number;
}

// Interface for lean enrollment document
interface LeanEnrollment {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  course: any; // Will be populated with course data
  progress?: number;
  completedLectures?: string[];
  enrolledAt?: Date;
  createdAt?: Date;
  amountPaid?: number;
}

export async function POST(request: NextRequest) {
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

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify token with proper typing
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    if (!decoded.id) {
      return NextResponse.json(
        { message: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Connect to database
    await connectDB();

    // Parse and validate request body
    let body: EnrollmentRequestBody;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { courseId, paymentId, amount } = body;

    // Validate required fields
    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { message: 'Valid course ID is required' },
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

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
      return NextResponse.json(
        { message: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // Get user details for activity logging
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
    });

    if (existingEnrollment) {
      return NextResponse.json(
        {
          message: 'Already enrolled in this course',
          enrollment: {
            id: existingEnrollment._id.toString(),
            courseId: existingEnrollment.course.toString(),
            userId: existingEnrollment.user.toString(),
            progress: existingEnrollment.progress || 0,
            completedLectures: existingEnrollment.completedLectures || [],
            enrolledAt:
              existingEnrollment.enrolledAt || existingEnrollment.createdAt,
            amountPaid: existingEnrollment.amountPaid,
          },
        },
        { status: 409 } // Changed from 200 to 409 (Conflict)
      );
    }

    // Use transaction for data consistency
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Create enrollment
        const enrollment = new Enrollment({
          user: new mongoose.Types.ObjectId(userId),
          course: new mongoose.Types.ObjectId(courseId),
          progress: 0,
          completedLectures: [],
          enrolledAt: new Date(),
          paymentId: paymentId || null,
          amountPaid: amount || course.price || 0,
        });

        await enrollment.save({ session });

        // Update course enrollment count and revenue
        await Course.findByIdAndUpdate(
          courseId,
          {
            $inc: {
              enrollmentCount: 1,
              totalRevenue: amount || course.price || 0,
            },
          },
          { new: true, session }
        );

        // Create activity log
        const activity = new Activity({
          user: {
            id: userId,
            name: user.name,
            email: user.email,
          },
          action: `enrolled in course "${course.title}"`,
          type: 'enrollment',
          courseId: courseId,
          timestamp: new Date(),
        });

        await activity.save({ session });

        console.log('New enrollment created:', {
          userId,
          courseId,
          enrollmentId: enrollment._id.toString(),
          amount: amount || course.price || 0,
        });

        // Return success response (this will be handled outside the transaction)
        return {
          message: 'Successfully enrolled in the course',
          enrollment: {
            id: enrollment._id.toString(),
            courseId: enrollment.course.toString(),
            userId: enrollment.user.toString(),
            progress: enrollment.progress,
            completedLectures: enrollment.completedLectures,
            enrolledAt: enrollment.enrolledAt,
            amountPaid: enrollment.amountPaid,
          },
        };
      });

      // If we get here, the transaction was successful
      const finalEnrollment = await Enrollment.findOne({
        user: new mongoose.Types.ObjectId(userId),
        course: new mongoose.Types.ObjectId(courseId),
      });

      return NextResponse.json(
        {
          message: 'Successfully enrolled in the course',
          enrollment: {
            id: finalEnrollment!._id.toString(),
            courseId: finalEnrollment!.course.toString(),
            userId: finalEnrollment!.user.toString(),
            progress: finalEnrollment!.progress,
            completedLectures: finalEnrollment!.completedLectures,
            enrolledAt: finalEnrollment!.enrolledAt,
            amountPaid: finalEnrollment!.amountPaid,
          },
        },
        { status: 201 }
      );
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Enrollment error:', error);

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (
        error.message.includes('duplicate key') ||
        error.message.includes('E11000')
      ) {
        return NextResponse.json(
          { message: 'Already enrolled in this course' },
          { status: 409 }
        );
      }

      if (error.message.includes('validation')) {
        return NextResponse.json(
          { message: 'Invalid enrollment data' },
          { status: 400 }
        );
      }

      if (error.message.includes('Cast to ObjectId failed')) {
        return NextResponse.json(
          { message: 'Invalid ID format' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        message: 'Server error during enrollment',
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

// GET method to fetch user's enrollments
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

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify token with proper typing
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    } catch (error) {
      console.error('Get enrollments - Token verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    if (!decoded.id) {
      return NextResponse.json(
        { message: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get all enrollments for the user with course details
    const enrollments = await Enrollment.find({
      user: new mongoose.Types.ObjectId(userId),
    })
      .populate('course', 'title description instructor price thumbnail')
      .lean<LeanEnrollment[]>()
      .exec();

    return NextResponse.json({
      enrollments: enrollments.map((enrollment) => ({
        id: enrollment._id.toString(),
        course: enrollment.course,
        progress: enrollment.progress || 0,
        completedLectures: enrollment.completedLectures || [],
        enrolledAt: enrollment.enrolledAt || enrollment.createdAt,
        amountPaid: enrollment.amountPaid,
      })),
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
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
