import mongoose from "mongoose"

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a course title"],
      trim: true,
      maxlength: [100, "Course title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a course description"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Please provide a course price"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Please provide a course category"],
      enum: ["Web Development", "Data Science", "Business", "Design", "Marketing", "Photography", "Other"],
    },
    thumbnail: {
      type: String,
      default: "",
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide an instructor"],
    },
    duration: {
      type: String,
      default: "",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "All Levels",
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Course || mongoose.model("Course", CourseSchema)
