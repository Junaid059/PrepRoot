// app/api/admin/sections/[id]/route.ts
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
    
    const { id } = await params;
    
    const section = await Section.findById(id).lean();
    
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const lectureCount = await Lecture.countDocuments({ sectionId: id });

 return NextResponse.json({ 
  section: {
    id: (section._id as string),
    title: section.title,
    description: section.description,
    order: section.order,
    courseId: section.courseId,
    lectureCount,
    createdAt: section.createdAt,
  },
});
  } catch (error) {
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
    const { title, description } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    const section = await Section.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );
    
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const lectureCount = await Lecture.countDocuments({ sectionId: id });
    
    return NextResponse.json({
      section: {
        id: section._id.toString(),
        title: section.title,
        description: section.description,
        order: section.order,
        courseId: section.courseId,
        lectureCount,
        createdAt: section.createdAt,
      },
    });

  } catch (error) {
    console.error('Error updating section:', error);
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
    
    // First delete all lectures in this section
    await Lecture.deleteMany({ sectionId: id });
    
    // Then delete the section
    const section = await Section.findByIdAndDelete(id);
    
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Section deleted successfully' });

  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}