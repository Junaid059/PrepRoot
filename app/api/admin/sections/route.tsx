// app/api/admin/sections/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Lecture from '@/models/Lecture';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' }, 
        { status: 400 }
      );
    }

    const sections = await Section.find({ courseId })
      .sort({ order: 1 })
      .lean();

    const sectionsWithLectures = await Promise.all(
      sections.map(async (section) => {
        const lectureCount = await Lecture.countDocuments({ sectionId: section._id });
        
        return {
          id: (section._id as string),
          title: section.title,
          description: section.description,
          order: section.order,
          courseId: section.courseId,
          lectureCount,
          createdAt: section.createdAt,
        };
      })
    );

    return NextResponse.json({
      sections: sectionsWithLectures,
    });

  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const { title, description, courseId } = await request.json();
    
    if (!title || !courseId) {
      return NextResponse.json(
        { error: 'Title and courseId are required' }, 
        { status: 400 }
      );
    }

    // Get the next order number
    const lastSection = await Section.findOne({ courseId })
      .sort({ order: -1 })
      .lean() as { order?: number } | null;
    
    const order = lastSection && typeof lastSection.order === 'number' ? lastSection.order + 1 : 1;

    const section = await Section.create({
      title,
      description,
      courseId,
      order,
    });

    return NextResponse.json({
      section: {
        id: section._id.toString(),
        title: section.title,
        description: section.description,
        order: section.order,
        courseId: section.courseId,
        lectureCount: 0,
        createdAt: section.createdAt,
      },
    });

  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}