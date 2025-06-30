// app/api/courses/[id]/sections/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Lecture from '@/models/Lecture';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: courseId } = await params;
    
    if (!courseId || courseId === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid course ID' }, 
        { status: 400 }
      );
    }

    // Fetch sections for the course
    const sections = await Section.find({ courseId })
      .sort({ order: 1 })
      .lean();

    // Fetch lectures for each section
    const sectionsWithLectures = await Promise.all(
      sections.map(async (section) => {
        const lectures = await Lecture.find({ sectionId: section._id })
          .sort({ order: 1 })
          .lean();

        return {
        _id: (section._id as string),
          title: section.title,
          description: section.description,
          order: section.order,
          courseId: section.courseId,
          lectures: lectures.map(lecture => ({
            _id: (lecture._id as string),
            title: lecture.title,
            description: lecture.description,
            videoUrl: lecture.videoUrl,
            pdfUrl: lecture.pdfUrl,
            resourceType: lecture.resourceType || (lecture.videoUrl ? 'video' : 'pdf'),
            duration: lecture.duration,
            isFreePreview: lecture.isFreePreview || false,
            order: lecture.order,
          })),
        };
      })
    );

    return NextResponse.json({
      sections: sectionsWithLectures,
    });

  } catch (error) {
    console.error('Error fetching course sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course sections' },
      { status: 500 }
    );
  }
}