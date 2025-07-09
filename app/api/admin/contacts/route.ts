import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import Contact from "@/models/Contact"
import User from "@/models/User"

interface JWTPayload {
  id: string
  email?: string
  isAdmin?: boolean
  iat?: number
  exp?: number
}

// Admin authentication function
async function verifyAdminAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    throw new Error("Not authenticated")
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined")
    throw new Error("Server configuration error")
  }

  let decoded: JWTPayload
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
  } catch (error) {
    console.error("Token verification error:", error)
    throw new Error("Not authenticated")
  }

  if (!decoded.id) {
    throw new Error("Not authenticated")
  }

  await connectDB()
  const adminUser = await User.findById(decoded.id)
  if (!adminUser || !adminUser.isAdmin) {
    throw new Error("Admin access required")
  }

  return decoded
}

// GET - Get all contact submissions (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    await connectDB()

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
      .populate('repliedBy', 'name email')
      .lean()

    // Get status counts for dashboard
    const statusCounts = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const stats = {
      total: total,
      new: statusCounts.find(s => s._id === 'new')?.count || 0,
      read: statusCounts.find(s => s._id === 'read')?.count || 0,
      replied: statusCounts.find(s => s._id === 'replied')?.count || 0,
      resolved: statusCounts.find(s => s._id === 'resolved')?.count || 0
    }

    return NextResponse.json({
      success: true,
      contacts,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Get contacts error:", error)
    
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: "Authentication required" }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: "Admin access required" }, { status: 403 })
      }
    }

    return NextResponse.json(
      { success: false, message: "Failed to fetch contacts" },
      { status: 500 }
    )
  }
}

// PUT - Update contact status/add notes (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminData = await verifyAdminAuth()

    const body = await request.json()
    const { contactId, status, adminNotes } = body

    if (!contactId) {
      return NextResponse.json(
        { success: false, message: "Contact ID is required" },
        { status: 400 }
      )
    }

    await connectDB()

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'replied') {
        updateData.repliedAt = new Date()
        updateData.repliedBy = adminData.id
      }
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true }
    ).populate('repliedBy', 'name email')

    if (!contact) {
      return NextResponse.json(
        { success: false, message: "Contact not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Contact updated successfully",
      contact
    })

  } catch (error) {
    console.error("Update contact error:", error)
    
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: "Authentication required" }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: "Admin access required" }, { status: 403 })
      }
    }

    return NextResponse.json(
      { success: false, message: "Failed to update contact" },
      { status: 500 }
    )
  }
}

// DELETE - Delete contact (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth()

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('id')

    if (!contactId) {
      return NextResponse.json(
        { success: false, message: "Contact ID is required" },
        { status: 400 }
      )
    }

    await connectDB()

    const contact = await Contact.findByIdAndDelete(contactId)

    if (!contact) {
      return NextResponse.json(
        { success: false, message: "Contact not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully"
    })

  } catch (error) {
    console.error("Delete contact error:", error)
    
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return NextResponse.json({ message: "Authentication required" }, { status: 401 })
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ message: "Admin access required" }, { status: 403 })
      }
    }

    return NextResponse.json(
      { success: false, message: "Failed to delete contact" },
      { status: 500 }
    )
  }
}
