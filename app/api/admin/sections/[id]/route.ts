// app/api/admin/sections/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Lecture from '@/models/Lecture';
import { isValidObjectId, Types } from 'mongoose';

// Define the section type for better type safety
interface SectionDoc {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  courseId: Types.ObjectId;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  fileCategory?: string;
  cloudinaryPublicId?: string;
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
      return NextResponse.json({ error: 'Invalid section ID format' }, { status: 400 });
    }
    
    const section = await Section.findById(id).lean() as SectionDoc | null;
    
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const lectureCount = await Lecture.countDocuments({ sectionId: id });

    return NextResponse.json({
      section: {
        id: section._id.toString(),
        title: section.title,
        description: section.description || '',
        order: section.order,
        courseId: section.courseId.toString(),
        lectureCount,
        fileUrl: section.fileUrl || null,
        fileType: section.fileType || null,
        fileName: section.fileName || null,
        fileCategory: section.fileCategory || null,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      },
    });

  } catch (error: unknown) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section' },
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
      return NextResponse.json({ error: 'Invalid section ID format' }, { status: 400 });
    }
    
    const body = await request.json();
    const { title, description } = body;
    
    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required and must be a non-empty string' }, { status: 400 });
    }

    // Validate description if provided
    if (description !== undefined && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    const updateData = {
      title: title.trim(),
      description: description?.trim() || '',
    };
    
    const section = await Section.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ) as SectionDoc | null;
    
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const lectureCount = await Lecture.countDocuments({ sectionId: id });
    
    return NextResponse.json({
      section: {
        id: section._id.toString(),
        title: section.title,
        description: section.description || '',
        order: section.order,
        courseId: section.courseId.toString(),
        lectureCount,
        fileUrl: section.fileUrl || null,
        fileType: section.fileType || null,
        fileName: section.fileName || null,
        fileCategory: section.fileCategory || null,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      },
    });

  } catch (error: unknown) {
    console.error('Error updating section:', error);
    
    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update section' },
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
      return NextResponse.json({ error: 'Invalid section ID format' }, { status: 400 });
    }
    
    // Get section info before deletion for response
    const section = await Section.findById(id) as SectionDoc | null;
    
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // First delete all lectures in this section
    const deletedLectures = await Lecture.deleteMany({ sectionId: id });
    
    // Then delete the section
    await Section.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      message: 'Section deleted successfully',
      deletedSection: {
        id: section._id.toString(),
        title: section.title,
      },
      deletedLecturesCount: deletedLectures.deletedCount || 0,
    });

  } catch (error: unknown) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}