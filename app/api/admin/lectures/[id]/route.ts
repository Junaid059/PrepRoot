// app/api/admin/lectures/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lecture from '@/models/Lecture';
import { isValidObjectId } from 'mongoose';
import { Types } from 'mongoose';

// Define the lecture type for better type safety
interface LectureDoc {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  videoUrl?: string;
  pdfUrl?: string;
  resourceType?: string;
  duration?: number;
  isFreePreview?: boolean;
  order?: number;
  sectionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid lecture ID format' }, { status: 400 });
    }
    
    const lecture = await Lecture.findById(id).lean() as LectureDoc | null;
    
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    return NextResponse.json({
      lecture: {
        id: lecture._id.toString(),
        title: lecture.title,
        description: lecture.description || '',
        videoUrl: lecture.videoUrl || null,
        pdfUrl: lecture.pdfUrl || null,
        resourceType: lecture.resourceType || (lecture.videoUrl ? 'video' : 'pdf'),
        duration: lecture.duration || null,
        isFreePreview: lecture.isFreePreview || false,
        order: lecture.order || 0,
        sectionId: lecture.sectionId?.toString() || null,
        createdAt: lecture.createdAt,
        updatedAt: lecture.updatedAt,
      },
    });

  } catch (error: unknown) {
    console.error('Error fetching lecture:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lecture' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid lecture ID format' }, { status: 400 });
    }
    
    const body = await request.json();
    const { 
      title, 
      description, 
      videoUrl, 
      pdfUrl, 
      resourceType, 
      duration, 
      isFreePreview 
    } = body;
    
    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required and must be a non-empty string' }, { status: 400 });
    }

    // Validate URLs if provided
    if (videoUrl && typeof videoUrl !== 'string') {
      return NextResponse.json({ error: 'Video URL must be a string' }, { status: 400 });
    }
    
    if (pdfUrl && typeof pdfUrl !== 'string') {
      return NextResponse.json({ error: 'PDF URL must be a string' }, { status: 400 });
    }

    // Validate duration if provided
    if (duration !== undefined && (typeof duration !== 'number' || duration < 0)) {
      return NextResponse.json({ error: 'Duration must be a positive number' }, { status: 400 });
    }

    // Determine resource type if not provided
    const finalResourceType = resourceType || (videoUrl ? 'video' : 'pdf');
    
    // Validate resource type
    const validResourceTypes = ['video', 'pdf'];
    if (!validResourceTypes.includes(finalResourceType)) {
      return NextResponse.json({ 
        error: `Resource type must be one of: ${validResourceTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Ensure at least one URL is provided based on resource type
    if (finalResourceType === 'video' && !videoUrl) {
      return NextResponse.json({ error: 'Video URL is required for video resources' }, { status: 400 });
    }
    
    if (finalResourceType === 'pdf' && !pdfUrl) {
      return NextResponse.json({ error: 'PDF URL is required for PDF resources' }, { status: 400 });
    }
    
    const updateData = {
      title: title.trim(),
      description: description?.trim() || '',
      videoUrl: videoUrl || null,
      pdfUrl: pdfUrl || null,
      resourceType: finalResourceType,
      duration: duration || null,
      isFreePreview: Boolean(isFreePreview),
    };
    
    const lecture = await Lecture.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ) as LectureDoc | null;
    
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      lecture: {
        id: lecture._id.toString(),
        title: lecture.title,
        description: lecture.description || '',
        videoUrl: lecture.videoUrl || null,
        pdfUrl: lecture.pdfUrl || null,
        resourceType: lecture.resourceType,
        duration: lecture.duration || null,
        isFreePreview: lecture.isFreePreview || false,
        order: lecture.order || 0,
        sectionId: lecture.sectionId?.toString() || null,
        createdAt: lecture.createdAt,
        updatedAt: lecture.updatedAt,
      },
    });

  } catch (error: unknown) {
    console.error('Error updating lecture:', error);
    
    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).message },
        { status: 400 }
      );
    }
    
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
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid lecture ID format' }, { status: 400 });
    }
    
    const lecture = await Lecture.findByIdAndDelete(id) as LectureDoc | null;
    
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Lecture deleted successfully',
      deletedLecture: {
        id: lecture._id.toString(),
        title: lecture.title,
      }
    });

  } catch (error: unknown) {
    console.error('Error deleting lecture:', error);
    return NextResponse.json(
      { error: 'Failed to delete lecture' },
      { status: 500 }
    );
  }
}