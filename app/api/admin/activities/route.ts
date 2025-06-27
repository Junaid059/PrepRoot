import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Activity from '@/models/Activity';

export async function GET() {
  try {
    await connectDB();

    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      activities: activities.map((activity: any) => ({
        id: activity._id?.toString() || activity.id?.toString() || '',
        user: activity.user || '',
        action: activity.action || '',
        type: activity.type || '',
        timestamp: activity.timestamp || activity.createdAt || new Date(),
        courseId: activity.courseId || activity.course_id || null,
        // Add any other fields your Activity model might have
        details: activity.details || null,
        metadata: activity.metadata || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching activities:', error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch activities',
        message:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
