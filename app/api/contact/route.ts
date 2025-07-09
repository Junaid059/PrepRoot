import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Contact from "@/models/Contact"
import { z } from "zod"

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z.string().email("Invalid email format"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject cannot exceed 200 characters"),
  message: z.string().min(1, "Message is required").max(2000, "Message cannot exceed 2000 characters")
})

// Rate limiting helper (simple in-memory store)
const submissionTracker = new Map<string, { count: number; lastSubmission: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxSubmissions = 3 // Maximum 3 submissions per 15 minutes
  
  const tracker = submissionTracker.get(ip)
  
  if (!tracker) {
    submissionTracker.set(ip, { count: 1, lastSubmission: now })
    return false
  }
  
  // Reset if window has passed
  if (now - tracker.lastSubmission > windowMs) {
    submissionTracker.set(ip, { count: 1, lastSubmission: now })
    return false
  }
  
  // Check if limit exceeded
  if (tracker.count >= maxSubmissions) {
    return true
  }
  
  // Increment count
  tracker.count++
  tracker.lastSubmission = now
  return false
}

// POST - Submit contact form
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Too many submissions. Please wait 15 minutes before submitting again." 
        },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validationResult = contactSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid input data",
          errors: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validationResult.data

    // Connect to database
    await connectDB()

    // Create contact entry
    const contact = new Contact({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'new'
    })

    await contact.save()

    // Send success response
    return NextResponse.json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you within 24 hours.",
      contactId: contact._id
    })

  } catch (error) {
    console.error("Contact form submission error:", error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          message: "Please check your input and try again.",
          error: error.message
        },
        { status: 400 }
      )
    }

    // Handle duplicate email (if we want to prevent spam)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { 
          success: false, 
          message: "We've already received your message. We'll get back to you soon!"
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: "Something went wrong. Please try again later." 
      },
      { status: 500 }
    )
  }
}

// GET - Get contact form submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    // This endpoint would typically require admin authentication
    // For now, we'll add a simple check - in production, use proper auth
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin_key')
    
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 per page
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    // Build query
    const query: any = {}
    if (status !== 'all') {
      query.status = status
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ]
    }

    // Get total count
    const total = await Contact.countDocuments(query)

    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v')
      .lean()

    return NextResponse.json({
      success: true,
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Get contacts error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch contacts" },
      { status: 500 }
    )
  }
}
