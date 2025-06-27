import mongoose from 'mongoose';

const EnrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedLectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture',
      },
    ],
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    paymentId: {
      type: String,
      required: false,
    },
    sessionId: {
      type: String,
      required: false,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    completedAt: {
      type: Date,
      required: false,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate enrollments
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// Index for efficient querying
EnrollmentSchema.index({ enrolledAt: -1 });
EnrollmentSchema.index({ paymentStatus: 1 });

export default mongoose.models.Enrollment ||
  mongoose.model('Enrollment', EnrollmentSchema);
