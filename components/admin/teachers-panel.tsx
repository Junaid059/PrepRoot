"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Edit, Plus, X, Upload, AlertTriangle } from "lucide-react"
import { toast } from "react-hot-toast"

interface Teacher {
  _id: string
  name: string
  designation: string
  education: string
  description: string
  image?: string | File
}

export default function TeachersPanel() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean
    teacherId: string
    teacherName: string
  } | null>(null)
  const [newTeacher, setNewTeacher] = useState<Omit<Teacher, "_id">>({
    name: "",
    designation: "",
    education: "",
    description: "",
    image: "",
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/teachers")

      if (!response.ok) {
        throw new Error(`Failed to fetch teachers: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Fetched teachers:", data.teachers)
      setTeachers(data.teachers || [])
    } catch (error) {
      console.error("Error fetching teachers:", error)
      setError("Failed to load teachers")
      toast.error("Failed to load teachers")
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDeleteTeacher = (id: string, name: string) => {
    console.log("Confirming delete for teacher ID:", id)
    setDeleteConfirmation({
      show: true,
      teacherId: id,
      teacherName: name,
    })
  }

  const handleDeleteTeacher = async () => {
    if (!deleteConfirmation) return

    try {
      setIsLoading(true)
      console.log("Deleting teacher with ID:", deleteConfirmation.teacherId)

      const response = await fetch(`/api/admin/teachers/${deleteConfirmation.teacherId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete teacher")
      }

      toast.success("Teacher deleted successfully")
      setDeleteConfirmation(null)
      await fetchTeachers()
    } catch (error) {
      console.error("Error deleting teacher:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete teacher")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpdateTeacher(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTeacher) return

    try {
      setIsLoading(true)
      console.log("Updating teacher with ID:", editingTeacher._id)

      const formData = new FormData()

      formData.append("name", editingTeacher.name)
      formData.append("designation", editingTeacher.designation)
      formData.append("education", editingTeacher.education)
      formData.append("description", editingTeacher.description)

      if (editingTeacher.image instanceof File) {
        formData.append("image", editingTeacher.image)
      }

      const response = await fetch(`/api/admin/teachers/${editingTeacher._id}`, {
        method: "PUT",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update teacher")
      }

      toast.success("Teacher updated successfully")
      setEditingTeacher(null)
      await fetchTeachers()
    } catch (error) {
      console.error("Error updating teacher:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update teacher")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isNew = false) => {
    const file = e.target.files?.[0]
    if (file) {
      // Only validate that it's an image file - no size restrictions
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file")
        return
      }

      console.log("File selected:", file.name, file.type, file.size)

      if (isNew) {
        setNewTeacher({ ...newTeacher, image: file })
      } else if (editingTeacher) {
        setEditingTeacher({ ...editingTeacher, image: file })
      }
    }
  }

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      const formData = new FormData()

      formData.append("name", newTeacher.name)
      formData.append("designation", newTeacher.designation)
      formData.append("education", newTeacher.education)
      formData.append("description", newTeacher.description)

      if (newTeacher.image instanceof File) {
        formData.append("image", newTeacher.image)
        console.log("Image being uploaded:", newTeacher.image.name, newTeacher.image.size)
      } else {
        console.log("No image file to upload")
      }

      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("Server response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to create teacher")
      }

      toast.success("Teacher profile created successfully")
      setIsCreating(false)
      setNewTeacher({
        name: "",
        designation: "",
        education: "",
        description: "",
        image: "",
      })
      await fetchTeachers()
    } catch (error) {
      console.error("Error creating teacher:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create teacher")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.designation.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Teachers</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teachers..."
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
            disabled={isLoading}
          >
            <Plus className="h-5 w-5 mr-1" />
            Add Teacher
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {isLoading && !isCreating && !editingTeacher && !deleteConfirmation ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <motion.div
                key={teacher._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex-shrink-0 w-full md:w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4 md:mb-0 md:mr-6">
                      {teacher.image && teacher.image !== "/placeholder.svg" ? (
                        <img
                          src={typeof teacher.image === "string" ? teacher.image : URL.createObjectURL(teacher.image)}
                          alt={teacher.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-gray-400">
                            {teacher.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{teacher.name}</h3>
                          <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">{teacher.designation}</p>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">{teacher.education}</p>
                          <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-3">{teacher.description}</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => setEditingTeacher(teacher)}
                          className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors mr-2"
                          disabled={isLoading}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDeleteTeacher(teacher._id, teacher.name)}
                          className="flex items-center px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                          disabled={isLoading}
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
              No teachers found. Only users with assigned courses will appear here.
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-6 w-6 mr-2" />
                <h3 className="text-xl font-bold">Confirm Deletion</h3>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-semibold">{deleteConfirmation.teacherName}</span>?
                This action cannot be undone and will remove all associated data from the database.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTeacher}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Teacher
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Teacher</h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Name</label>
                  <input
                    type="text"
                    value={editingTeacher.name}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Designation</label>
                  <input
                    type="text"
                    value={editingTeacher.designation}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        designation: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Education</label>
                  <input
                    type="text"
                    value={editingTeacher.education}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        education: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Profile Image</label>
                  <div className="flex items-center">
                    <label
                      className={`flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e)}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                    {editingTeacher.image && typeof editingTeacher.image === "string" && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Current image</span>
                    )}
                    {editingTeacher.image instanceof File && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        New image: {editingTeacher.image.name}
                      </span>
                    )}
                  </div>
                  {editingTeacher.image && (
                    <div className="mt-2">
                      <img
                        src={
                          editingTeacher.image instanceof File
                            ? URL.createObjectURL(editingTeacher.image)
                            : editingTeacher.image === "/placeholder.svg"
                              ? "/placeholder.svg?height=80&width=80"
                              : editingTeacher.image
                        }
                        alt="Teacher preview"
                        className="h-20 w-auto mt-1 rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=80&width=80"
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Description</label>
                <textarea
                  value={editingTeacher.description}
                  onChange={(e) =>
                    setEditingTeacher({
                      ...editingTeacher,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  rows={6}
                  required
                  disabled={isLoading}
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Teacher Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create New Teacher Profile</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Name</label>
                  <input
                    type="text"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Designation</label>
                  <input
                    type="text"
                    value={newTeacher.designation}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        designation: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                    placeholder="e.g. Senior Web Development Instructor"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Education</label>
                  <input
                    type="text"
                    value={newTeacher.education}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        education: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                    required
                    placeholder="e.g. PhD in Computer Science, Stanford University"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Profile Image</label>
                  <div className="flex items-center">
                    <label
                      className={`flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, true)}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                    {newTeacher.image instanceof File && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        Selected: {newTeacher.image.name}
                      </span>
                    )}
                  </div>
                  {newTeacher.image instanceof File && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(newTeacher.image) || "/placeholder.svg"}
                        alt="Teacher preview"
                        className="h-20 w-auto mt-1 rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=80&width=80"
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Description</label>
                <textarea
                  value={newTeacher.description}
                  onChange={(e) =>
                    setNewTeacher({
                      ...newTeacher,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  rows={6}
                  required
                  placeholder="Detailed description of the teacher's background, expertise, and teaching philosophy..."
                  disabled={isLoading}
                ></textarea>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> This creates a teacher profile only. No email or password is required. Login
                  credentials can be set up later if needed.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Teacher Profile"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
