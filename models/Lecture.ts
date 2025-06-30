import mongoose from 'mongoose';

const LectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  videoUrl: {
    type: String,
    trim: true,
  },
  pdfUrl: {
    type: String,
    trim: true,
  },
  resourceType: {
    type: String,
    enum: ['video', 'pdf'],
    required: true,
  },
  duration: {
    type: String, // Format: "10:30" or "1:20:45"
  },
  isFreePreview: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 1,
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
LectureSchema.index({ sectionId: 1, order: 1 });

// Ensure at least one URL is provided
LectureSchema.pre('save', function(next) {
  if (!this.videoUrl && !this.pdfUrl) {
    next(new Error('Either videoUrl or pdfUrl must be provided'));
  } else {
    next();
  }
});

export default mongoose.models.Lecture || mongoose.model('Lecture', LectureSchema);