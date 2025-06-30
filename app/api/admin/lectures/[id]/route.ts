// app/api/admin/lectures/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lecture from '@/models/Lecture';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    const lecture = await Lecture.findById(id).lean();
    
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    return NextResponse.json({
      lecture: {
        id: lecture._id.toString(),
        title: lecture.title,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        pdfUrl: lecture.pdfUrl,
        resourceType: lecture.resourceType || (lecture.videoUrl ? 'video' : 'pdf'),
        duration: lecture.duration,
        isFreePreview: lecture.isFreePreview || false,
        order: lecture.order,
        sectionId: lecture.sectionId,
        createdAt: lecture.createdAt,
      },
    });

  } catch (error) {
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
    const { 
      title, 
      description, 
      videoUrl, 
      pdfUrl, 
      resourceType, 
      duration, 
      isFreePreview 
    } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Determine resource type if not provided
    const finalResourceType = resourceType || (videoUrl ? 'video' : 'pdf');
    
    const lecture = await Lecture.findByIdAndUpdate(
      id,
      { 
        title, 
        description, 
        videoUrl, 
        pdfUrl, 
        resourceType: finalResourceType, 
        duration, 
        isFreePreview: isFreePreview || false 
      },
      { new: true }
    );
    
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      lecture: {
        id: lecture._id.toString(),
        title: lecture.title,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        pdfUrl: lecture.pdfUrl,
        resourceType: lecture.resourceType,
        duration: lecture.duration,
        isFreePreview: lecture.isFreePreview,
        order: lecture.order,
        sectionId: lecture.sectionId,
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