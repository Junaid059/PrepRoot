'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FeaturedCoursesSection() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses/featured');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses);
        } else {
          console.error('Failed to fetch featured courses');
        }
      } catch (error) {
        console.error('Error fetching featured courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // If no courses are fetched yet, show placeholders
  const displayCourses =
    courses.length > 0
      ? courses
      : [
          {
            id: '1',
            title: 'Web Development Bootcamp',
            instructor: 'John Smith',
            rating: 4.8,
            students: 1250,
            duration: '48 hours',
            price: 89.99,
            thumbnail: '/placeholder.svg?height=200&width=350',
          },
          {
            id: '2',
            title: 'Data Science Fundamentals',
            instructor: 'Sarah Johnson',
            rating: 4.7,
            students: 980,
            duration: '36 hours',
            price: 79.99,
            thumbnail: '/placeholder.svg?height=200&width=350',
          },
          {
            id: '3',
            title: 'Mobile App Development',
            instructor: 'Michael Chen',
            rating: 4.9,
            students: 1450,
            duration: '52 hours',
            price: 94.99,
            thumbnail: '/placeholder.svg?height=200&width=350',
          },
          {
            id: '4',
            title: 'UI/UX Design Masterclass',
            instructor: 'Emma Wilson',
            rating: 4.6,
            students: 870,
            duration: '32 hours',
            price: 69.99,
            thumbnail: '/placeholder.svg?height=200&width=350',
          },
        ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="flex justify-between items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Featured Courses
            </h2>
            <p className="text-xl text-gray-600 mt-2">
              Explore our most popular courses
            </p>
          </div>

          <div className="flex space-x-2">
            <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayCourses.map((course, index) => (
            <motion.div
              key={course.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <div className="relative">
                <img
                  src={course.thumbnail || '/placeholder.svg'}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                  ${course.price}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 h-14">
                  {course.title}
                </h3>

                <p className="text-gray-600 mb-4">
                  by <span className="font-medium">{course.instructor}</span>
                </p>

                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-6"></div>

                <Link href={`/courses/${course.id}`}>
                  <motion.button
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    View Course
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link href="/courses">
            <motion.button
              className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View All Courses
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
