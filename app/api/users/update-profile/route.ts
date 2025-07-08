import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

interface UpdateProfileRequest {
  name?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Define interfaces for better type safety
interface DecodedToken extends jwt.JwtPayload {
  id: string;
  email: string;
  isAdmin: boolean;
}

export async function PATCH(request: NextRequest) {
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
    await connectDB();
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Parse the request body
    let body: UpdateProfileRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { name, firstName, lastName, profileImage, currentPassword, newPassword } = body;
    
    // Update profile fields if provided
    const updates: any = {};
    
    if (name !== undefined) {
      updates.name = name;
    }
    
    if (firstName !== undefined) {
      updates.firstName = firstName;
    }
    
    if (lastName !== undefined) {
      updates.lastName = lastName;
    }
    
    if (profileImage !== undefined) {
      updates.profileImage = profileImage;
    }
    
    // If password change is requested
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordCorrect) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      updates.password = hashedPassword;
    }
    
    // Apply updates
    if (Object.keys(updates).length > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
      ).select('-password');
      
      return NextResponse.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          profileImage: updatedUser.profileImage,
        }
      });
    } else {
      return NextResponse.json(
        { message: 'No updates provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
