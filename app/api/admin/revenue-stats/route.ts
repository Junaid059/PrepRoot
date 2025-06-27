import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';

interface JWTPayload {
  id: string;
  email?: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify token
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

    // Check if user is admin
    await connectDB();
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get revenue data for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const revenueData = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: twelveMonthsAgo },
          amountPaid: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$enrolledAt' },
            month: { $month: '$enrolledAt' },
          },
          totalRevenue: { $sum: '$amountPaid' },
          enrollmentCount: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Format data for charts
    const formattedData = revenueData.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      revenue: item.totalRevenue,
      enrollments: item.enrollmentCount,
      monthName: new Date(item._id.year, item._id.month - 1).toLocaleString(
        'default',
        {
          month: 'short',
          year: 'numeric',
        }
      ),
    }));

    // Get daily revenue for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: thirtyDaysAgo },
          amountPaid: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$enrolledAt' },
            month: { $month: '$enrolledAt' },
            day: { $dayOfMonth: '$enrolledAt' },
          },
          dailyRevenue: { $sum: '$amountPaid' },
          dailyEnrollments: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    const formattedDailyData = dailyRevenue.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(
        2,
        '0'
      )}-${String(item._id.day).padStart(2, '0')}`,
      revenue: item.dailyRevenue,
      enrollments: item.dailyEnrollments,
    }));

    return NextResponse.json({
      monthlyRevenue: formattedData,
      dailyRevenue: formattedDailyData,
      totalRevenue: revenueData.reduce(
        (sum, item) => sum + item.totalRevenue,
        0
      ),
      totalEnrollments: revenueData.reduce(
        (sum, item) => sum + item.enrollmentCount,
        0
      ),
    });
  } catch (error) {
    console.error('Revenue stats error:', error);
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
