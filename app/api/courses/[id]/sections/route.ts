import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id || id === 'undefined') {
      return NextResponse.json(
        { message: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const sections = await Section.find({ courseId: id })
      .populate('lectures')
      .sort({ order: 1 });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
