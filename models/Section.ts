import mongoose, { type Document, Schema } from "mongoose"

export interface ISection extends Document {
  title: string
  description?: string
  order: number
  courseId: mongoose.Types.ObjectId
  lectures?: mongoose.Types.ObjectId[] // Added this field
  fileUrl?: string
  fileType?: string
  fileName?: string
  createdAt: Date
  updatedAt: Date
}

const SectionSchema = new Schema<ISection>(
  {
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    order: {
      type: Number,
      default: 0,
      min: [0, "Order cannot be negative"],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    lectures: [{  // Changed to array of ObjectIds
      type: Schema.Types.ObjectId,
      ref: "Lecture",
    }]
  },
  {
    timestamps: true,
  },
)

// Create indexes for better performance
// Removed duplicate index - keeping only the unique compound index
SectionSchema.index({ courseId: 1, order: 1 }, { unique: true })
SectionSchema.index({ courseId: 1, createdAt: -1 })

const Section = mongoose.models.Section || mongoose.model<ISection>("Section", SectionSchema)

export default Section