'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Search } from 'lucide-react';

interface Teacher {
  _id: string;
  name: string;
  designation: string;
  education: string;
  description: string;
  image?: string;
}

export default function InstructorsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/teachers');

        if (!response.ok) {
          throw new Error(
            `Failed to fetch teachers: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setTeachers(data.teachers || []);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setError('Failed to load teachers. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-blue-100 py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="inline-block bg-blue-200 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
            OUR INSTRUCTORS
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Meet Our Expert Instructors
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Learn from industry professionals with years of experience. Our
            instructors are passionate about teaching and committed to your
            success.
          </p>
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Instructors Grid */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
              >
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        ) : filteredTeachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTeachers.map((teacher, index) => (
              <motion.div
                key={teacher._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all transform hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link href={`/instructors/${teacher._id}`}>
                  <div className="h-64 relative overflow-hidden">
                    {teacher.image ? (
                      <Image
                        src={teacher.image || '/placeholder.svg'}
                        alt={teacher.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <GraduationCap className="h-20 w-20 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{teacher.name}</h3>
                    <p className="text-blue-600 font-medium mb-2">
                      {teacher.designation}
                    </p>
                    <p className="text-gray-600 text-sm mb-3">
                      {teacher.education}
                    </p>
                    <p className="text-gray-600 line-clamp-3">
                      {teacher.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">
              No instructors found matching your search.
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-blue-100 py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Want to Join Our Teaching Team?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            If you're passionate about teaching and have expertise in your
            field, we'd love to hear from you. Join our team of instructors and
            help students achieve their goals.
          </p>
          <Link
            href="/become-instructor"
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium inline-block hover:bg-blue-700 transition-all transform hover:scale-105"
          >
            Become an Instructor
          </Link>
        </div>
      </section>
    </div>
  );
}
