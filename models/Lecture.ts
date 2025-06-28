import mongoose from 'mongoose';

const LectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a lecture title'],
      trim: true,
      maxlength: [100, 'Lecture title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        'Lecture description cannot be more than 500 characters',
      ],
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    // Video fields
    videoUrl: {
      type: String,
      required: false, // Made optional since we can have PDF-only lectures
    },
    duration: {
      type: String,
      required: false, // Made optional for PDF lectures
    },
    // PDF fields - ADD THESE
    fileUrl: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
      enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'], // Allowed file types
    },
    fileName: {
      type: String,
      trim: true,
    },
    // Content type to determine what to display
    contentType: {
      type: String,
      enum: ['video', 'document', 'both'],
      default: 'video',
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isFreePreview: { // Add this field that your frontend expects
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add validation to ensure at least video or document is provided
LectureSchema.pre('save', function(next) {
  if (!this.videoUrl && !this.fileUrl) {
    next(new Error('Lecture must have either a video URL or a file URL'));
  } else {
    next();
  }
});

export default mongoose.models.Lecture ||
  mongoose.model('Lecture', LectureSchema);