import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Section from '@/models/Section';
import Lecture from '@/models/Lecture';
import Enrollment from '@/models/Enrollment';
import { uploadImage } from '@/lib/upload';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();

    // Get all courses
    const coursesData = await Course.find().sort({ createdAt: -1 });

    // Get additional data for each course
    const courses = await Promise.all(
      coursesData.map(async (course) => {
        // Count sections
        const sectionsCount = await Section.countDocuments({
          course: course._id,
        });

        // Count lectures
        const sections = await Section.find({ course: course._id });
        const sectionIds = sections.map((section) => section._id);
        const lecturesCount = await Lecture.countDocuments({
          section: { $in: sectionIds },
        });

        // Count enrollments
        const enrollmentsCount = await Enrollment.countDocuments({
          course: course._id,
        });

        return {
          id: course._id,
          title: course.title,
          description: course.description,
          price: course.price,
          category: course.category,
          instructor: course.instructor, // Include instructor in the response
          thumbnail: course.thumbnail,
          sections: sectionsCount,
          lectures: lecturesCount,
          enrollments: enrollmentsCount,
          createdAt: course.createdAt,
        };
      })
    );

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();

    // Extract data from form
    const title = formData.get('title');
    const description = formData.get('description');
    const price = formData.get('price');
    const category = formData.get('category');
    const instructor = formData.get('instructor'); // Extract instructor from form data
    const thumbnailFile = formData.get('thumbnail');

    // Validate required fields
    if (!title || !description || !price || !category || !instructor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate instructor is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(instructor)) {
      return NextResponse.json(
        { error: 'Invalid instructor ID. Must be a valid MongoDB ObjectId' },
        { status: 400 }
      );
    }

    // Validate category is one of the allowed enum values
    const validCategories = [
      'Web Development',
      'Data Science',
      'Business',
      'Design',
      'Marketing',
      'Photography',
      'Other',
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: 'Invalid category value',
          validCategories,
          providedCategory: category,
        },
        { status: 400 }
      );
    }

    // Upload thumbnail if provided
    let thumbnail = '';
    if (thumbnailFile) {
      thumbnail = await uploadImage(thumbnailFile);
    }

    // Create new course
    const newCourse = new Course({
      title,
      description,
      price: Number.parseFloat(price),
      category,
      instructor, // Include instructor in the new course
      thumbnail,
    });

    await newCourse.save();

    return NextResponse.json({
      course: newCourse,
      message: 'Course created successfully',
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      {
        error: 'Failed to create course',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
