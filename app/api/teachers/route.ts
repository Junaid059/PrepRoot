import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Teacher from '@/models/Teacher';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    await connectDB();
    const teachers = await Teacher.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const designation = formData.get('designation') as string;
    const education = formData.get('education') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File;

    let imageUrl = '/placeholder.svg'; // Default to placeholder

    // Upload image to Cloudinary if provided
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'image',
              folder: 'lms', // Using 'lms' folder to match your existing structure
              transformation: [
                { width: 500, height: 500, crop: 'fill', quality: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      imageUrl = (uploadResponse as any).secure_url;
    }

    const teacher = new Teacher({
      name,
      designation,
      education,
      description,
      image: imageUrl,
    });

    await teacher.save();

    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    );
  }
}
