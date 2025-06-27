import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Section from '@/models/Section';
import Lecture from '@/models/Lecture';
import mongoose from 'mongoose';

// Interface for lean course document
interface LeanCourse {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  price?: number;
  instructor?: string;
  thumbnail?: string;
  category?: string;
  duration?: string;
  enrollmentCount?: number;
  rating?: number;
  level?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for lean section document
interface LeanSection {
  _id: mongoose.Types.ObjectId;
  title: string;
  course: mongoose.Types.ObjectId;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for lean lecture document
interface LeanLecture {
  _id: mongoose.Types.ObjectId;
  title: string;
  sectionId: mongoose.Types.ObjectId;
  duration?: number;
  isFree?: boolean;
  order?: number;
  videoUrl?: string;
  content?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for API params
interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Connect to database
    await connectDB();

    const courseId = params.id;

    // Validate course ID format
    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    // Fetch course with proper typing
    const course = await Course.findById(courseId).lean<LeanCourse>().exec();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch sections for this course with proper typing
    const sections = await Section.find({ course: courseId })
      .sort({ order: 1 })
      .lean<LeanSection[]>()
      .exec();

    if (!sections) {
      return NextResponse.json(
        { error: 'Failed to fetch course sections' },
        { status: 500 }
      );
    }

    // Fetch lectures for each section with proper error handling
    const sectionsWithLectures = await Promise.all(
      sections.map(async (section) => {
        try {
          const lectures = await Lecture.find({ sectionId: section._id })
            .sort({ order: 1 })
            .lean<LeanLecture[]>()
            .exec();

          return {
            id: section._id.toString(),
            title: section.title || 'Untitled Section',
            order: section.order || 0,
            lectures: (lectures || []).map((lecture) => ({
              id: lecture._id.toString(),
              title: lecture.title || 'Untitled Lecture',
              duration: lecture.duration || 0,
              isFree: lecture.isFree || false,
              order: lecture.order || 0,
            })),
          };
        } catch (lectureError) {
          console.error(
            `Error fetching lectures for section ${section._id}:`,
            lectureError
          );
          // Return section with empty lectures array if lecture fetch fails
          return {
            id: section._id.toString(),
            title: section.title || 'Untitled Section',
            order: section.order || 0,
            lectures: [],
          };
        }
      })
    );

    // Calculate total lectures and duration
    const totalLectures = sectionsWithLectures.reduce(
      (total, section) => total + section.lectures.length,
      0
    );

    const totalDuration = sectionsWithLectures.reduce(
      (total, section) =>
        total +
        section.lectures.reduce(
          (sectionTotal, lecture) => sectionTotal + lecture.duration,
          0
        ),
      0
    );

    // Build course data with proper defaults and validation
    const courseData = {
      id: course._id.toString(),
      title: course.title || 'Untitled Course',
      description: course.description || 'No description available',
      price: typeof course.price === 'number' ? course.price : 0,
      instructor: course.instructor || 'Unknown Instructor',
      thumbnail: course.thumbnail || null,
      category: course.category || 'General',
      duration: course.duration || `${Math.ceil(totalDuration / 60)} hours`,
      lectures: totalLectures,
      students:
        typeof course.enrollmentCount === 'number' ? course.enrollmentCount : 0,
      rating: typeof course.rating === 'number' ? course.rating : 4.5,
      level: course.level || 'Beginner',
      whatYouWillLearn:
        Array.isArray(course.whatYouWillLearn) &&
        course.whatYouWillLearn.length > 0
          ? course.whatYouWillLearn
          : [
              'Master the fundamentals',
              'Build practical projects',
              'Gain industry-relevant skills',
              'Get certificate of completion',
            ],
      requirements:
        Array.isArray(course.requirements) && course.requirements.length > 0
          ? course.requirements
          : [
              'Basic computer skills',
              'Internet connection',
              'Willingness to learn',
            ],
      sections: sectionsWithLectures.sort((a, b) => a.order - b.order),
      totalDuration: totalDuration, // in minutes
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    return NextResponse.json({
      course: courseData,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching course:', error);

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('Cast to ObjectId failed')) {
        return NextResponse.json(
          { error: 'Invalid course ID format' },
          { status: 400 }
        );
      }

      if (error.message.includes('buffering timed out')) {
        return NextResponse.json(
          { error: 'Database connection timeout' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch course',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined,
        success: false,
      },
      { status: 500 }
    );
  }
}
