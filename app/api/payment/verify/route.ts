import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
import User from '@/models/User';
import Activity from '@/models/Activity';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

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
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    const body = await request.json();
    const { sessionId, courseId } = body;

    if (!sessionId || !courseId) {
      return NextResponse.json(
        { message: 'Missing session ID or course ID' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { message: 'Payment not completed' },
        { status: 400 }
      );
    }

    await connectDB();

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
            amountPaid: existingEnrollment.amountPaid,
          },
        },
        { status: 200 }
      );
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
      progress: 0,
      completedLectures: [],
      enrolledAt: new Date(),
      paymentId: session.payment_intent,
      sessionId: sessionId,
      amountPaid: session.amount_total
        ? session.amount_total / 100
        : course.price,
      paymentStatus: 'completed',
    });

    await enrollment.save();

    // Update course stats
    await Course.findByIdAndUpdate(
      courseId,
      {
        $inc: {
          enrollmentCount: 1,
          totalRevenue: enrollment.amountPaid,
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
        paymentId: session.payment_intent,
        amount: enrollment.amountPaid,
        sessionId,
      },
    });

    await activity.save();

    return NextResponse.json(
      {
        message: 'Payment verified and enrollment completed',
        enrollment: {
          id: enrollment._id.toString(),
          courseId,
          userId,
          progress: enrollment.progress,
          amountPaid: enrollment.amountPaid,
          paymentId: enrollment.paymentId,
        },
        redirectUrl: `/courses/${courseId}`, // Add this for frontend reference
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { message: 'Server error verifying payment' },
      { status: 500 }
    );
  }
}
