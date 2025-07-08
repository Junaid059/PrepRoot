"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"
import { User, Camera, Lock, Loader2, Save, ArrowLeft } from "lucide-react"

export default function ProfilePage() {
  const { user, loading: authLoading, updateUserData } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"info" | "security">("info")
  
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    profileImage: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push("/login")
      return
    }
    
    // Both regular users and admins can access their profile page
    // No redirect needed for admins
    
    // Populate form with user data
    setFormData({
      name: user.name || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      profileImage: user.profileImage || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    
    if (user.profileImage) {
      setImagePreview(user.profileImage)
    }
    
    setLoading(false)
  }, [user, authLoading, router])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Preview the selected image
    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
    
    // Upload the image
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload image')
      }
      
      const data = await response.json()
      setFormData(prev => ({ ...prev, profileImage: data.url }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }
  
  const handleProfileInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      const response = await fetch('/api/users/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          firstName: formData.firstName,
          lastName: formData.lastName,
          profileImage: formData.profileImage,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      const data = await response.json()
      
      // Update auth context with new user data
      const { user: updatedUser } = data
      updateUserData({
        name: updatedUser.name,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImage: updatedUser.profileImage
      })
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    try {
      setSaving(true)
      
      const response = await fetch('/api/users/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update password')
      }
      
      toast.success('Password updated successfully')
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-[#8B4513] border-gray-200 rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-8">
          <button
            onClick={() => user?.isAdmin ? router.push('/admin-dashboard') : router.back()}
            className="flex items-center text-gray-600 hover:text-[#8B4513] mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {user?.isAdmin ? 'Back to Dashboard' : 'Back'}
          </button>
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar / Avatar section */}
            <div className="w-full md:w-1/3 bg-gray-50 p-8 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F5DEB3] flex items-center justify-center">
                      <User className="h-20 w-20 text-[#8B4513]" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#8B4513] flex items-center justify-center cursor-pointer shadow-md hover:bg-[#6B3100] transition-colors"
                >
                  <Camera className="h-5 w-5 text-white" />
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {formData.name}
              </h2>
              <p className="text-gray-600 mb-6">{formData.email}</p>
              
              <div className="w-full space-y-2">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`w-full py-3 px-4 rounded-lg flex items-center text-left ${
                    activeTab === "info"
                      ? "bg-[#F5DEB3] text-[#8B4513]"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <User className="h-5 w-5 mr-3" />
                  Personal Information
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full py-3 px-4 rounded-lg flex items-center text-left ${
                    activeTab === "security"
                      ? "bg-[#F5DEB3] text-[#8B4513]"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Lock className="h-5 w-5 mr-3" />
                  Security
                </button>
              </div>
            </div>
            
            {/* Content section */}
            <div className="w-full md:w-2/3 p-8">
              <div className="animate-fadeIn">
                {activeTab === "info" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-6">
                      Personal Information
                    </h3>
                    
                    <form onSubmit={handleProfileInfoSubmit}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                          placeholder="Your full name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          disabled
                          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Email cannot be changed
                        </p>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-6 py-2 bg-[#8B4513] text-white rounded-lg flex items-center justify-center hover:bg-[#6B3100] transition-colors disabled:bg-gray-400"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-6">
                      Change Password
                    </h3>
                    
                    <form onSubmit={handlePasswordSubmit}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                          placeholder="Enter your current password"
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                          placeholder="Enter new password"
                          minLength={6}
                          required
                        />
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                          placeholder="Confirm new password"
                          minLength={6}
                          required
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-6 py-2 bg-[#8B4513] text-white rounded-lg flex items-center justify-center hover:bg-[#6B3100] transition-colors disabled:bg-gray-400"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Update Password
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
