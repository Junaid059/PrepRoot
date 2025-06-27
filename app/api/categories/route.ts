import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import {
  Code,
  LineChart,
  Briefcase,
  Palette,
  Heart,
  Camera,
  Laptop,
  GraduationCap,
  Music,
  Gamepad2,
} from 'lucide-react';

// Map category names to icons
const categoryIcons: Record<string, any> = {
  'Web Development': Code,
  'Data Science': LineChart,
  Business: Briefcase,
  Design: Palette,
  Marketing: Heart,
  Photography: Camera,
  Programming: Code,
  Technology: Laptop,
  Education: GraduationCap,
  Music: Music,
  Gaming: Gamepad2,
  Other: Laptop,
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Aggregate courses by category
    const categoryData = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$price', '$enrollmentCount'] } },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Format the data with icons
    const formattedCategories = categoryData.map((category) => ({
      name: category._id || 'Other',
      count: category.count,
      revenue: category.totalRevenue || 0,
      icon: categoryIcons[category._id] || categoryIcons['Other'],
    }));

    return NextResponse.json({
      categories: formattedCategories,
      totalCategories: formattedCategories.length,
    });
  } catch (error) {
    console.error('Categories error:', error);
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
