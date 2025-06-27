import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
import User from '@/models/User';
import Activity from '@/models/Activity';
import mongoose from 'mongoose';

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

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    await connectDB();

    const body = await request.json();
    const { courseId, paymentId, amount, sessionId } = body;

    if (!courseId || !paymentId || !amount) {
      return NextResponse.json(
        { message: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Get course and user details
    const [course, user] = await Promise.all([
      Course.findById(courseId),
      User.findById(userId),
    ]);

    if (!course || !user) {
      return NextResponse.json(
        { message: 'Course or user not found' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return NextResponse.json(
        {
          message: 'Already enrolled in this course',
          enrollment: {
            id: existingEnrollment._id.toString(),
            courseId,
            userId,
            progress: existingEnrollment.progress || 0,
          },
        },
        { status: 200 }
      );
    }

    // Create enrollment after successful payment
    const enrollment = new Enrollment({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      progress: 0,
      completedLectures: [],
      enrolledAt: new Date(),
      paymentId,
      sessionId,
      amountPaid: amount,
      paymentStatus: 'completed',
    });

    await enrollment.save();

    // Update course stats
    await Course.findByIdAndUpdate(
      courseId,
      {
        $inc: {
          enrollmentCount: 1,
          totalRevenue: amount,
        },
      },
      { new: true }
    );

    // Create activity log
    const activity = new Activity({
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
      action: `enrolled in course "${course.title}" after payment`,
      type: 'enrollment',
      courseId: courseId,
      timestamp: new Date(),
      metadata: {
        paymentId,
        amount,
        sessionId,
      },
    });

    await activity.save();

    console.log('Payment successful - enrollment created:', {
      userId,
      courseId,
      enrollmentId: enrollment._id.toString(),
      paymentId,
      amount,
    });

    return NextResponse.json(
      {
        message: 'Payment successful and enrollment completed',
        enrollment: {
          id: enrollment._id.toString(),
          courseId,
          userId,
          progress: enrollment.progress,
          amountPaid: enrollment.amountPaid,
          paymentId: enrollment.paymentId,
        },
        redirectUrl: `/courses/${courseId}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment success handling error:', error);
    return NextResponse.json(
      { message: 'Server error processing payment success' },
      { status: 500 }
    );
  }
}
