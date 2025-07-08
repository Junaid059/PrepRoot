import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { uploadFile } from '@/lib/upload';

// Define interfaces for better type safety
interface DecodedToken extends jwt.JwtPayload {
  id: string;
  email: string;
  isAdmin: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token with proper typing
    let decoded: DecodedToken;
    try {
      const result = jwt.verify(token, process.env.JWT_SECRET as string);
      decoded = result as DecodedToken;
    } catch (error) {
      console.error(
        'Token verification error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Check file type
    const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validFileTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type' }, { status: 400 });
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'File size exceeds 2MB limit' }, { status: 400 });
    }

    // Upload file using the upload utility
    try {
      // Use the uploadFile function from lib/upload.ts
      const fileUrl = await uploadFile(file, `profiles/${userId}`);
      
      return NextResponse.json({ url: fileUrl });
    } catch (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json({ message: 'File upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
