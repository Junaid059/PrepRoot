'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  Star,
  Clock,
  Users,
  BookOpen,
} from 'lucide-react';
import CourseCard from '@/components/course-card';
import { useAuth } from '@/context/auth-context';

// Define types for our data structures
type Category = {
  name: string;
  icon: string;
};

type Instructor = {
  name: string;
  _id?: string;
};

type Course = {
  _id: string;
  id?: string; // Some APIs might return id instead of _id
  title: string;
  description?: string;
  thumbnail?: string;
  price?: string | number;
  duration?: string;
  category?: string;
  rating?: string | number;
  enrolledStudents?: number;
  instructor?: Instructor;
  instructorName?: string;
  featured?: boolean;
};

export default function Home() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] =
    useState<string>('All Categories');
  const [showCategoryDropdown, setShowCategoryDropdown] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured courses
        const coursesResponse = await fetch('/api/courses/featured');

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');

        if (coursesResponse.ok && categoriesResponse.ok) {
          const coursesData = await coursesResponse.json();
          const categoriesData = await categoriesResponse.json();

          // Validate courses have IDs before setting state
          const validCourses = (coursesData.courses || []).filter(
            (course: Course) => {
              if (!course._id && !course.id) {
                console.error('Course missing ID:', course);
                return false;
              }
              return true;
            }
          );

          setCourses(validCourses);
          setCategories(categoriesData.categories || []);
        } else {
          console.error('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/explore?search=${encodeURIComponent(
        searchQuery
      )}&category=${encodeURIComponent(
        selectedCategory !== 'All Categories' ? selectedCategory : ''
      )}`;
    }
  };

  // Default categories if API fails
  const defaultCategories: Category[] = [
    { name: 'Web Development', icon: 'ðŸ’»' },
    { name: 'Data Science', icon: 'ðŸ“Š' },
    { name: 'Business', icon: 'ðŸ“ˆ' },
    { name: 'Design', icon: 'ðŸŽ¨' },
    { name: 'Marketing', icon: 'ðŸ“±' },
    { name: 'Photography', icon: 'ðŸ“·' },
  ];

  const displayCategories =
    categories.length > 0 ? categories : defaultCategories;

  // Sample feature data
  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      title: 'Expert Instructors',
      description:
        'Learn from industry experts who are passionate about teaching and sharing their knowledge.',
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      title: 'Flexible Learning',
      description:
        'Study at your own pace, access courses anytime, anywhere on any device.',
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: 'Community Support',
      description:
        'Join a community of learners and get support from peers and instructors.',
    },
  ];

  // Sample testimonial data
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Web Development Student',
      image: '/placeholder.svg?height=60&width=60',
      text: "The courses are well-structured and the instructors are knowledgeable. I've learned so much in such a short time!",
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Data Science Student',
      image: '/placeholder.svg?height=60&width=60',
      text: "The platform is intuitive and the course content is top-notch. I've been able to apply what I've learned directly to my job.",
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'UX Design Student',
      image: '/placeholder.svg?height=60&width=60',
      text: 'The community support is amazing. Whenever I have questions, I get helpful responses quickly from both instructors and peers.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="py-12 md:py-20 mt-16 px-6 md:px-20 relative"
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="space-y-6 animate-fadeIn lg:w-1/2">
              <div className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium">
                eLearning Platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Smart Learning
                <br />
                Deeper & More
                <br />
                <span className="text-blue-600">-Amazing</span>
              </h1>
              <p className="text-gray-600 max-w-md">
                Plus/Purposefully display unique intellectual capital without
                enterprise-after bricks & clicks synergy. Enthusiastically
                revolutionize Preproots.
              </p>
              <div className="flex items-center space-x-4">
                <Link
                  href="/signup"
                  className="bg-blue-500 text-white px-6 py-3 rounded-full font-medium flex items-center hover:bg-blue-600 transition-all transform hover:scale-105"
                >
                  Start Free Trial
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <Link
                  href="/how-it-works"
                  className="bg-blue-600 text-white h-12 w-12 rounded-full flex items-center justify-center hover:bg-blue-700 transition-all transform hover:scale-105"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <span className="text-gray-700 font-medium">How it Work</span>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative animate-slideIn lg:w-1/2 flex justify-center">
              <div className="absolute -z-10 top-0 right-0 w-3/4 h-3/4">
              <div className="absolute top-10 right-10 w-64 h-64 bg-blue-500 rotate-12 animate-float"></div>
                <div className="absolute top-40 right-20 w-48 h-48 bg-blue-400 rotate-45 animate-float delay-300"></div>
              </div>
              <Image
                src="/design.png"
                width={450}
                height={550}
                alt="Student learning"
                className="relative z-10 mx-auto"
                priority
              />
              <div className="absolute top-10 left-0 bg-white rounded-full p-2 shadow-lg animate-bounce">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  P
                </div>
              </div>
              <div className="absolute top-1/4 right-0 bg-white rounded-full p-2 shadow-lg animate-pulse">
                <div className="h-8 w-8 bg-blue-500 rounded-full"></div>
              </div>
              <div className="absolute bottom-1/3 left-10 bg-white rounded-full p-2 shadow-lg animate-bounce delay-300">
                <div className="h-10 w-10 rounded-full flex items-center justify-center">
                  <div className="h-8 w-8 bg-blue-200 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-24 fill-white"
          >
            <path d="M0,120 L0,60 C300,120 600,20 900,80 C1050,110 1150,60 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 md:px-6 py-16 text-center">
        <div className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-6">
          ABOUT US
        </div>
        <h2 className="text-2xl md:text-3xl font-bold max-w-3xl mx-auto">
          We are passionate about empowering learners{' '}
          <span className="text-blue-600">Worldwide</span> with high-quality,
          accessible & engaging education. Our mission offering a diverse range
          of courses.
        </h2>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2 p-6 hover:shadow-lg rounded-xl transition-all transform hover:scale-105">
            <h3 className="text-5xl font-bold text-blue-600">25+</h3>
            <p className="text-gray-600 text-sm">
              Years of eLearning
              <br />
              Education Experience
            </p>
          </div>
          <div className="space-y-2 p-6 hover:shadow-lg rounded-xl transition-all transform hover:scale-105">
            <h3 className="text-5xl font-bold text-blue-600">56k</h3>
            <p className="text-gray-600 text-sm">
              Students Enrolled In
              <br />
              PREPROOTS Courses
            </p>
          </div>
          <div className="space-y-2 p-6 hover:shadow-lg rounded-xl transition-all transform hover:scale-105">
            <h3 className="text-5xl font-bold text-blue-600">170+</h3>
            <p className="text-gray-600 text-sm">
              Experienced Teacher's
              <br />
              services
            </p>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <div className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
              COURSES
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Explore Our Course
            </h2>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <form
              onSubmit={handleSearch}
              className="flex items-center space-x-2"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Courses"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center space-x-2 border border-gray-300 rounded-lg px-4 py-2"
                >
                  <span>{selectedCategory}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedCategory('All Categories');
                        setShowCategoryDropdown(false);
                      }}
                    >
                      All Categories
                    </div>
                    {displayCategories.map((category) => (
                      <div
                        key={category.name}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {category.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Course Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all animate-pulse"
              >
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {courses.map((course, index) => (
              <CourseCard
                key={course._id || `course-${index}`}
                course={course}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">
              No courses available yet. Check back soon!
            </p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/explore"
            className="inline-block bg-blue-100 text-blue-600 px-6 py-3 rounded-full font-medium hover:bg-blue-200 transition-all"
          >
            View All Courses
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
              WHY CHOOSE US
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Features That Make Learning Easier
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className="bg-blue-100 p-3 rounded-full w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 md:px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
            TESTIMONIALS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            What Our Students Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <Image
                  src={testimonial.image || '/placeholder.svg'}
                  width={60}
                  height={60}
                  alt={testimonial.name}
                  className="rounded-full"
                />
                <div className="ml-4">
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-100 py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Join thousands of students who are already learning and growing with
            our courses. Start your journey today and unlock your potential.
          </p>
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-8 py-4 rounded-full font-medium inline-block hover:bg-blue-700 transition-all transform hover:scale-105"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
