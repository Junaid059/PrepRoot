import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, Users } from 'lucide-react';

interface CourseCardProps {
  course: {
    _id?: string;
    id?: string; // Some APIs might return id instead of _id
    title: string;
    description?: string;
    thumbnail?: string;
    price?: number | string;
    originalPrice?: number | string;
    category?: string;
    rating?: number | string;
    enrolledStudents?: number;
    duration?: string;
    featured?: boolean;
    instructor?: any;
    instructorName?: string;
  };
  index?: number;
}

export default function CourseCard({ course, index }: CourseCardProps) {
  // Ensure we have a valid ID by checking both _id and id fields
  const courseId = course._id || course.id;

  // If no valid ID exists, log an error
  if (!courseId) {
    console.error('Course missing ID:', course);
    return null; // Don't render the card if there's no ID
  }

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all transform hover:scale-105"
      style={{ animationDelay: index ? `${index * 0.1}s` : '0s' }}
    >
      <Link href={`/courses/${courseId}`}>
        <div className="relative">
          <Image
            src={course.thumbnail || '/placeholder.svg?height=200&width=400'}
            width={400}
            height={225}
            alt={course.title}
            className="w-full h-48 object-cover"
          />
          {course.featured && (
            <div className="absolute top-4 left-4 bg-[#FF6B38] text-white px-2 py-1 rounded-md text-xs font-medium">
              POPULAR
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#2BBEB4] text-sm font-medium">
              {course.category || 'Course'}
            </span>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm ml-1">{course.rating || '4.5'}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold mb-2 line-clamp-2">
            {course.title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm mb-4">
            <Clock className="h-4 w-4 mr-1" />
            <span>{course.duration || '12 Hours'}</span>
            <Users className="h-4 w-4 ml-3 mr-1" />
            <span>{course.enrolledStudents || 0} Students</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[#FF6B38] font-bold">
                {course.instructor?.name?.charAt(0) ||
                  course.instructorName?.charAt(0) ||
                  'I'}
              </div>
              <span className="text-sm ml-2">
                {course.instructor?.name ||
                  course.instructorName ||
                  'Instructor'}
              </span>
            </div>
            <span className="text-[#FF6B38] font-bold">
              ${course.price || '49.99'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
