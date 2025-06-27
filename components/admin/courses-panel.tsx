'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit, Plus, X, BookOpen, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  instructorName: string;
  thumbnail?: string | File;
  sections?: number;
  lectures?: number;
  enrollments?: number;
  revenue?: string;
  trend?: number;
  createdAt?: string;
}

interface Category {
  name: string;
  count: number;
  icon: string;
}

export default function CoursesPanel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newCourse, setNewCourse] = useState<Course>({
    id: '',
    title: '',
    description: '',
    price: 0,
    category: '',
    instructorName: '',
    thumbnail: '',
  });

  // Add state for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/categories');

      if (!response.ok) {
        throw new Error(
          `Failed to fetch categories: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/courses');

      if (!response.ok) {
        throw new Error(
          `Failed to fetch courses: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Courses API did not return JSON');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete course');

      toast.success('Course deleted successfully');
      fetchCourses(); // Refresh the list
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      const formData = new FormData();
      Object.keys(editingCourse).forEach((key) => {
        if (
          key !== 'thumbnail' ||
          (key === 'thumbnail' && editingCourse.thumbnail instanceof File)
        ) {
          // @ts-ignore - We know these properties exist on the course object
          formData.append(key, editingCourse[key]);
        }
      });

      const response = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update course');

      toast.success('Course updated successfully');
      setEditingCourse(null);
      fetchCourses(); // Refresh the list
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      Object.keys(newCourse).forEach((key) => {
        // @ts-ignore - We know these properties exist on the course object
        formData.append(key, newCourse[key]);
      });

      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }

      toast.success('Course created successfully');
      setIsCreating(false);
      setNewCourse({
        id: '',
        title: '',
        description: '',
        price: 0,
        category: '',
        instructorName: '',
        thumbnail: '',
      });
      fetchCourses(); // Refresh the list
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create course'
      );
    }
  };

  const handleThumbnailChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isNew = false
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isNew) {
        setNewCourse({ ...newCourse, thumbnail: file });
      } else if (editingCourse) {
        setEditingCourse({ ...editingCourse, thumbnail: file });
      }
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Manage Courses
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <motion.button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-5 w-5 mr-1" />
            Add Course
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex-shrink-0 w-full md:w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4 md:mb-0 md:mr-6">
                      {course.thumbnail ? (
                        <img
                          src={
                            typeof course.thumbnail === 'string'
                              ? course.thumbnail
                              : URL.createObjectURL(course.thumbnail)
                          }
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            {course.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs mr-2">
                              {course.category}
                            </span>
                            <span className="mr-2">
                              {course.sections} sections
                            </span>
                            <span>{course.lectures} lectures</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Instructor:</span>{' '}
                            {course.instructorName || 'Not assigned'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            PKR {course.price}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {course.enrollments} students
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => setEditingCourse(course)}
                          className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors mr-2"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="flex items-center px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No courses found
            </div>
          )}
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Edit Course
              </h3>
              <button
                onClick={() => setEditingCourse(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingCourse.title}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Category
                  </label>
                  {categoriesLoading ? (
                    <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <select
                      value={editingCourse.category}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                      required
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categories.map((category) => (
                        <option key={category.name} value={category.name}>
                          {category.icon} {category.name} ({category.count}{' '}
                          courses)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Instructor Name
                  </label>
                  <input
                    type="text"
                    value={editingCourse.instructorName || ''}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        instructorName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={editingCourse.price}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        price: Number.parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Thumbnail
                  </label>
                  <div className="flex items-center">
                    <label className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleThumbnailChange(e)}
                        className="hidden"
                      />
                    </label>
                    {editingCourse.thumbnail &&
                      typeof editingCourse.thumbnail === 'string' && (
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          Current: {editingCourse.thumbnail.split('/').pop()}
                        </span>
                      )}
                  </div>
                  {editingCourse.thumbnail &&
                    typeof editingCourse.thumbnail === 'string' && (
                      <div className="mt-2">
                        <img
                          src={editingCourse.thumbnail || '/placeholder.svg'}
                          alt="Current thumbnail"
                          className="h-20 w-auto mt-1 rounded-md"
                        />
                      </div>
                    )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={editingCourse.description}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  rows={4}
                  required
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Course Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Create New Course
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Category
                  </label>
                  {categoriesLoading ? (
                    <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <select
                      value={newCourse.category}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                      required
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categories.map((category) => (
                        <option key={category.name} value={category.name}>
                          {category.icon} {category.name} ({category.count}{' '}
                          courses)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Instructor Name
                  </label>
                  <input
                    type="text"
                    value={newCourse.instructorName}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        instructorName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={newCourse.price === 0 ? '' : newCourse.price}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        price:
                          e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                    Thumbnail
                  </label>
                  <div className="flex items-center">
                    <label className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleThumbnailChange(e, true)}
                        className="hidden"
                      />
                    </label>
                    {newCourse.thumbnail instanceof File && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        Selected: {(newCourse.thumbnail as File).name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  rows={4}
                  required
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Course
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
