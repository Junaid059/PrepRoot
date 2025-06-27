import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const teacher = await Teacher.findById(params.id);

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get courses taught by this teacher
    const courses = await Course.find({
      instructor: teacher._id,
    }).select('title thumbnail category price rating enrolledStudents');

    return NextResponse.json({
      teacher,
      courses,
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const teacher = await Teacher.findById(params.id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const designation = formData.get('designation') as string;
    const education = formData.get('education') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File;

    let imageUrl = teacher.image; // Keep existing image by default

    // Upload new image to Cloudinary if provided
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Delete old image from Cloudinary if it exists and is not a placeholder
      if (
        teacher.image &&
        teacher.image !== '/placeholder.svg' &&
        teacher.image.includes('cloudinary.com')
      ) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = teacher.image.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExtension.split('.')[0];
          const folder = urlParts[urlParts.length - 2];
          const fullPublicId = `${folder}/${publicId}`;

          await cloudinary.uploader.destroy(fullPublicId);
          console.log('Deleted old image:', fullPublicId);
        } catch (deleteError) {
          console.log('Error deleting old image:', deleteError);
        }
      }

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

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      params.id,
      {
        name,
        designation,
        education,
        description,
        image: imageUrl,
      },
      { new: true }
    );

    return NextResponse.json({ teacher: updatedTeacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { error: 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const teacher = await Teacher.findById(params.id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Delete image from Cloudinary if it exists and is not a placeholder
    if (
      teacher.image &&
      teacher.image !== '/placeholder.svg' &&
      teacher.image.includes('cloudinary.com')
    ) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = teacher.image.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const fullPublicId = `${folder}/${publicId}`;

        await cloudinary.uploader.destroy(fullPublicId);
        console.log('Deleted image:', fullPublicId);
      } catch (deleteError) {
        console.log('Error deleting image:', deleteError);
      }
    }

    await Teacher.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}
