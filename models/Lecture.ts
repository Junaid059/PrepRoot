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
    videoUrl: {
      type: String,
      required: [true, 'Please provide a video URL'],
    },
    duration: {
      type: String,
      required: [true, 'Please provide the lecture duration'],
    },
    isFree: {
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

export default mongoose.models.Lecture ||
  mongoose.model('Lecture', LectureSchema);
