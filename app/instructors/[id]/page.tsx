'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, BookOpen, Users, Star } from 'lucide-react';

interface Teacher {
  _id: string;
  name: string;
  designation: string;
  education: string;
  description: string;
  image?: string;
}

interface Course {
  _id: string;
  title: string;
  thumbnail?: string;
  category?: string;
  price?: number;
  rating?: number;
  enrolledStudents?: number;
}

export default function InstructorProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extract ID outside the effect to avoid dependency issues
  const { id: instructorId } = use(params);

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/teachers/${instructorId}`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch teacher: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setTeacher(data.teacher || null);
        setCourses(data.courses || []);
      } catch (error) {
        console.error('Error fetching teacher profile:', error);
        setError('Failed to load teacher profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (instructorId) {
      fetchTeacherProfile();
    }
  }, [instructorId]); // Using instructorId as dependency

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            {error || 'Instructor not found'}
          </h1>
          <Link
            href="/instructors"
            className="bg-[#FF6B38] text-white px-6 py-2 rounded-full inline-block hover:bg-opacity-90"
          >
            Back to Instructors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#FF6B38]/10 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div
              className="w-full md:w-1/3 flex justify-center"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-xl">
                {teacher.image ? (
                  <Image
                    src={teacher.image || '/placeholder.svg'}
                    alt={teacher.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <GraduationCap className="h-32 w-32 text-gray-400" />
                  </div>
                )}
              </div>
            </motion.div>
            <motion.div
              className="w-full md:w-2/3 text-center md:text-left"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {teacher.name}
              </h1>
              <p className="text-[#FF6B38] text-xl font-medium mb-3">
                {teacher.designation}
              </p>
              <p className="text-gray-600 mb-6">{teacher.education}</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link
                  href={`mailto:contact@example.com?subject=Question for ${teacher.name}`}
                  className="flex items-center bg-[#2BBEB4] text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-all"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Instructor
                </Link>
                <Link
                  href="/explore"
                  className="flex items-center bg-white text-[#FF6B38] border border-[#FF6B38] px-6 py-2 rounded-full hover:bg-[#FF6B38]/5 transition-all"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  View All Courses
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">About {teacher.name}</h2>
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-line">{teacher.description}</p>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Courses by {teacher.name}
          </h2>

          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all transform hover:scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link href={`/courses/${course._id}`}>
                    <div className="relative">
                      <Image
                        src={course.thumbnail || '/placeholder.svg'}
                        width={400}
                        height={225}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#2BBEB4] text-sm font-medium">
                          {course.category}
                        </span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm ml-1">
                            {course.rating || '4.5'}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{course.enrolledStudents || 0} Students</span>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-[#FF6B38] font-bold">
                          ${course.price || '49.99'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No courses available from this instructor yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 md:px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Learn from {teacher.name}?
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Enroll in one of {teacher.name}'s courses today and start your
          learning journey with an expert instructor.
        </p>
        <Link
          href="/explore"
          className="bg-[#FF6B38] text-white px-8 py-3 rounded-full font-medium inline-block hover:bg-opacity-90 transition-all transform hover:scale-105"
        >
          Browse All Courses
        </Link>
      </section>
    </div>
  );
}
