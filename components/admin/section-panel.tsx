"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { toast } from "react-hot-toast"
import { Plus, Edit, Trash2, X, Upload, FileText, Video, Eye, Save, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Course {
  id: string
  title: string
  description: string
  price: number
  category: string
  instructor: string
}

interface Section {
  id: string
  title: string
  description: string
  order: number
  fileUrl?: string
  fileType?: string
  fileName?: string
  createdAt: string
  updatedAt?: string
}

export default function SectionsPanel() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const [newSection, setNewSection] = useState({
    title: "",
    description: "",
    order: 0,
    file: null as File | null,
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchSections(selectedCourse)
    } else {
      setSections([])
    }
  }, [selectedCourse])

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/admin/courses")
      if (!response.ok) throw new Error("Failed to fetch courses")

      const data = await response.json()
      setCourses(data.courses || [])

      if (data.courses && data.courses.length > 0) {
        setSelectedCourse(data.courses[0].id)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to load courses")
    }
  }

  const fetchSections = async (courseId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/sections`)

      if (!response.ok) {
        throw new Error("Failed to fetch sections")
      }

      const data = await response.json()
      setSections(data.sections || [])
    } catch (error) {
      console.error("Error fetching sections:", error)
      setError("Failed to load sections")
      toast.error("Failed to load sections")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !selectedCourse) return

    if (!newSection.title.trim()) {
      toast.error("Section title is required")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("title", newSection.title.trim())
      formData.append("description", newSection.description.trim())
      formData.append("order", newSection.order.toString())

      if (newSection.file) {
        formData.append("file", newSection.file)
      }

      const response = await fetch(`/api/admin/courses/${selectedCourse}/sections`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create section")
      }

      toast.success("Section created successfully")
      setIsCreating(false)
      setNewSection({ title: "", description: "", order: 0, file: null })
      fetchSections(selectedCourse)
    } catch (error) {
      console.error("Error creating section:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create section")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSection = async (e: React.FormEvent) => {
  e.preventDefault()
  if (isSubmitting || !editingSection) return

  if (!editingSection.title.trim()) {
    toast.error("Section title is required")
    return
  }

  setIsSubmitting(true)

  try {
    // Send JSON instead of FormData
    const response = await fetch(`/api/admin/sections/${editingSection.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: editingSection.title.trim(),
        description: editingSection.description.trim(),
        order: editingSection.order,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to update section")
    }

    toast.success("Section updated successfully")
    setEditingSection(null)
    fetchSections(selectedCourse)
  } catch (error) {
    console.error("Error updating section:", error)
    toast.error(error instanceof Error ? error.message : "Failed to update section")
  } finally {
    setIsSubmitting(false)
  }
}

  const handleDeleteSection = async () => {
    if (!sectionToDelete || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/sections/${sectionToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete section")
      }

      toast.success("Section deleted successfully")
      setSectionToDelete(null)
      fetchSections(selectedCourse)
    } catch (error) {
      console.error("Error deleting section:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete section")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isNew = true) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB")
        return
      }

      if (isNew) {
        setNewSection({ ...newSection, file })
      }
    }
  }

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="h-4 w-4" />

    if (fileType.startsWith("video/")) {
      return <Video className="h-4 w-4" />
    }

    return <FileText className="h-4 w-4" />
  }

  const selectedCourseData = courses.find((course) => course.id === selectedCourse)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Course Sections</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          {selectedCourse && (
            <Button onClick={() => setIsCreating(true)} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          )}
        </div>
      </div>

      {selectedCourse && selectedCourseData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              {selectedCourseData.title}
            </CardTitle>
            <CardDescription>
              {selectedCourseData.description} • {sections.length} sections
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {selectedCourse ? (
        isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium mr-3">
                        #{section.order}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{section.title}</h3>
                    </div>
                    {section.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{section.description}</p>
                    )}
                    {section.fileUrl && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {getFileIcon(section.fileType)}
                        <span className="ml-2">{section.fileName}</span>
                        <a
                          href={section.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingSection(section)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSectionToDelete(section.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No sections found for this course. Create your first section to get started.
          </div>
        )
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Please select a course to manage its sections.
        </div>
      )}

      {/* Create Section Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create New Section</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSection}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Description</label>
                <textarea
                  value={newSection.description}
                  onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Order</label>
                <input
                  type="number"
                  value={newSection.order}
                  onChange={(e) => setNewSection({ ...newSection, order: Number.parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  File (Video/PDF)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, true)}
                    accept="video/*,.pdf,.doc,.docx,.ppt,.pptx"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Upload video or document files (Max: 50MB)
                  </p>
                  {newSection.file && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <Upload className="h-4 w-4 mr-1" />
                      {newSection.file.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Section
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Section</h3>
              <button
                onClick={() => setEditingSection(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSection}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Description</label>
                <textarea
                  value={editingSection.description}
                  onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Order</label>
                <input
                  type="number"
                  value={editingSection.order}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, order: Number.parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>

              {editingSection.fileUrl && (
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Current File</label>
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      {getFileIcon(editingSection.fileType)}
                      <span className="ml-2 text-sm">{editingSection.fileName}</span>
                    </div>
                    <a
                      href={editingSection.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Section
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Section Confirmation Dialog */}
      <AlertDialog open={!!sectionToDelete} onOpenChange={() => setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this section?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the section and any associated files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Section"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
