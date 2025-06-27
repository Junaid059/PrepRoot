import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, adminKey } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Initialize isAdmin as false
    let isAdmin = false;

    // Check admin key if provided
    if (adminKey) {
      const correctAdminKey = process.env.ADMIN_SECRET_KEY;

      if (!correctAdminKey) {
        console.error('ADMIN_SECRET_KEY not found in environment variables');
        return NextResponse.json(
          { message: 'Admin registration not configured' },
          { status: 500 }
        );
      }

      if (adminKey !== correctAdminKey) {
        return NextResponse.json(
          { message: 'Invalid admin key' },
          { status: 403 }
        );
      }

      // Check if an admin already exists
      const existingAdmin = await User.findOne({ isAdmin: true });
      if (existingAdmin) {
        return NextResponse.json(
          { message: 'An admin account already exists' },
          { status: 400 }
        );
      }

      isAdmin = true;
    }

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not found in environment variables');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin,
    });

    await user.save();

    // Create token - using number for expiresIn (30 days in seconds)
    const jwtOptions: jwt.SignOptions = {
      expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    };

    const token = jwt.sign(
      {
        id: user._id.toString(),
        isAdmin: user.isAdmin,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      jwtOptions
    );

    // Create response
    const response = NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });

    // Set cookie with better configuration
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);

    // More specific error handling
    if (error instanceof Error) {
      // Handle specific MongoDB/Mongoose errors
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { message: 'User already exists' },
          { status: 400 }
        );
      }

      // Handle validation errors
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { message: 'Invalid user data' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Server error during registration' },
      { status: 500 }
    );
  }
}
