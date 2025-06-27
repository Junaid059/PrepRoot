import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
  {
    user: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    action: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'enrollment',
        'course_creation',
        'user_registration',
        'payment',
        'completion',
      ],
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ActivitySchema.index({ timestamp: -1 });
ActivitySchema.index({ 'user.id': 1 });
ActivitySchema.index({ type: 1 });

export default mongoose.models.Activity ||
  mongoose.model('Activity', ActivitySchema);
