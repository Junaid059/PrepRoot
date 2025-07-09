import mongoose, { Document, Schema } from "mongoose"

export interface IContact extends Document {
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'resolved'
  createdAt: Date
  updatedAt: Date
  adminNotes?: string
  repliedAt?: Date
  repliedBy?: mongoose.Types.ObjectId
}

const ContactSchema = new Schema<IContact>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    maxlength: [200, "Subject cannot exceed 200 characters"]
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    maxlength: [2000, "Message cannot exceed 2000 characters"]
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'resolved'],
    default: 'new'
  },
  adminNotes: {
    type: String,
    maxlength: [1000, "Admin notes cannot exceed 1000 characters"]
  },
  repliedAt: {
    type: Date
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Index for efficient querying
ContactSchema.index({ status: 1, createdAt: -1 })
ContactSchema.index({ email: 1 })

export default mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema)
