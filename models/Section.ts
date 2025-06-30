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
}, {
  timestamps: true,
});

// Index for efficient querying
SectionSchema.index({ courseId: 1, order: 1 });

export default mongoose.models.Section || mongoose.model('Section', SectionSchema);