import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import { uploadImage } from '@/lib/upload';

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const formData = await request.formData();

    // Extract data from form
    const title = formData.get('title');
    const description = formData.get('description');
    const price = formData.get('price');
    const category = formData.get('category');
    const thumbnailFile = formData.get('thumbnail');

    // Prepare update data
    const updateData = {
      title,
      description,
      price: Number.parseFloat(price),
      category,
    };

    // Upload thumbnail if provided
    if (thumbnailFile) {
      updateData.thumbnail = await uploadImage(thumbnailFile);
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      course: updatedCourse,
      message: 'Course updated successfully',
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
