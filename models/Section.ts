import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  order: {
    type: Number,
    default: 1,
  },
  // File fields for section resources
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
  fileCategory: {
    type: String,
    trim: true,
  },
  cloudinaryPublicId: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

// Index for efficient querying
SectionSchema.index({ courseId: 1, order: 1 });

export default mongoose.models.Section || mongoose.model('Section', SectionSchema);