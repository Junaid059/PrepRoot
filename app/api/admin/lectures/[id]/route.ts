import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lecture from '@/models/Lecture';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const duration = formData.get('duration') as string;
    const isFree = formData.get('isFree') === 'true';
    const videoFile = formData.get('videoFile') as File;

    if (!title || !duration) {
      return NextResponse.json(
        { error: 'Title and duration are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      title,
      description,
      duration,
      isFree,
    };

    // Handle video upload if new file provided
    if (videoFile && videoFile.size > 0) {
      // TODO: Upload video file to your storage service
      // updateData.videoUrl = await uploadVideo(videoFile);
      updateData.videoUrl = `/uploads/videos/${videoFile.name}`; // Placeholder
    }

    const lecture = await Lecture.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    return NextResponse.json({
      lecture: {
        id: lecture._id.toString(),
        title: lecture.title,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        duration: lecture.duration,
        isFree: lecture.isFree,
        order: lecture.order,
        createdAt: lecture.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating lecture:', error);
    return NextResponse.json(
      { error: 'Failed to update lecture' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const lecture = await Lecture.findByIdAndDelete(id);

    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lecture deleted successfully' });
  } catch (error) {
    console.error('Error deleting lecture:', error);
    return NextResponse.json(
      { error: 'Failed to delete lecture' },
      { status: 500 }
    );
  }
}
