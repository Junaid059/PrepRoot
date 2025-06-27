import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lecture from '@/models/Lecture';
import Section from '@/models/Section';

export async function POST(request: Request) {
  try {
    await connectDB();

    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const duration = formData.get('duration') as string;
    const isFree = formData.get('isFree') === 'true';
    const sectionId = formData.get('sectionId') as string;
    const videoFile = formData.get('videoFile') as File;

    if (!title || !duration || !sectionId) {
      return NextResponse.json(
        { error: 'Title, duration, and section are required' },
        { status: 400 }
      );
    }

    // Get the next order number for this section
    const lectureCount = await Lecture.countDocuments({ sectionId });

    // Handle video upload here (you'll need to implement file upload logic)
    let videoUrl = '';
    if (videoFile) {
      // TODO: Upload video file to your storage service
      // videoUrl = await uploadVideo(videoFile);
      videoUrl = `/uploads/videos/${videoFile.name}`; // Placeholder
    }

    // Create new lecture
    const lecture = new Lecture({
      title,
      description,
      videoUrl,
      duration,
      isFree,
      sectionId,
      order: lectureCount + 1,
    });

    await lecture.save();

    // Update section lecture count
    await Section.findByIdAndUpdate(sectionId, {
      $inc: { lectureCount: 1 },
    });

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
    console.error('Error creating lecture:', error);
    return NextResponse.json(
      { error: 'Failed to create lecture' },
      { status: 500 }
    );
  }
}
