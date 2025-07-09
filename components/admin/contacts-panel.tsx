"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mail,
  Search,
  Filter,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Reply,
  Archive,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { toast } from "react-hot-toast"

interface Contact {
  _id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'resolved'
  createdAt: string
  updatedAt: string
  adminNotes?: string
  repliedAt?: string
  repliedBy?: {
    _id: string
    name: string
    email: string
  }
}

interface ContactStats {
  total: number
  new: number
  read: number
  replied: number
  resolved: number
}

interface ContactsResponse {
  success: boolean
  contacts: Contact[]
  stats: ContactStats
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const statusColors = {
  new: "bg-red-100 text-red-800 border-red-200",
  read: "bg-blue-100 text-blue-800 border-blue-200",
  replied: "bg-green-100 text-green-800 border-green-200",
  resolved: "bg-gray-100 text-gray-800 border-gray-200"
}

const statusIcons = {
  new: <AlertCircle className="h-3 w-3" />,
  read: <Eye className="h-3 w-3" />,
  replied: <Reply className="h-3 w-3" />,
  resolved: <CheckCircle className="h-3 w-3" />
}

export default function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<ContactStats>({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    resolved: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [adminNotes, setAdminNotes] = useState("")
  const [updating, setUpdating] = useState(false)

  // Fetch contacts
  const fetchContacts = async (page = 1, search = searchTerm, status = statusFilter) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status !== 'all' && { status })
      })

      const response = await fetch(`/api/admin/contacts?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const data: ContactsResponse = await response.json()
      setContacts(data.contacts)
      setStats(data.stats)
      setCurrentPage(data.pagination.page)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error('Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
    fetchContacts(1, term, statusFilter)
  }

  // Handle filter change
  const handleFilterChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
    fetchContacts(1, searchTerm, status)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchContacts(page, searchTerm, statusFilter)
  }

  // Toggle contact expansion
  const toggleContactExpansion = (contactId: string) => {
    const newExpanded = new Set(expandedContacts)
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId)
    } else {
      newExpanded.add(contactId)
      // Mark as read if it's new
      const contact = contacts.find(c => c._id === contactId)
      if (contact && contact.status === 'new') {
        updateContactStatus(contactId, 'read')
      }
    }
    setExpandedContacts(newExpanded)
  }

  // View contact details
  const viewContact = (contact: Contact) => {
    setSelectedContact(contact)
    setAdminNotes(contact.adminNotes || "")
    setShowContactDialog(true)
    
    // Mark as read if it's new
    if (contact.status === 'new') {
      updateContactStatus(contact._id, 'read')
    }
  }

  // Update contact status
  const updateContactStatus = async (contactId: string, status: string, notes?: string) => {
    try {
      setUpdating(true)
      const response = await fetch('/api/admin/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          status,
          ...(notes !== undefined && { adminNotes: notes })
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update contact')
      }

      const data = await response.json()
      
      // Update local state
      setContacts(contacts.map(c => 
        c._id === contactId ? { ...c, status: status as any, adminNotes: notes || c.adminNotes } : c
      ))
      
      // Update selected contact if it's the one being updated
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact({
          ...selectedContact,
          status: status as any,
          adminNotes: notes || selectedContact.adminNotes
        })
      }

      toast.success('Contact updated successfully')
      
      // Refresh stats
      fetchContacts(currentPage, searchTerm, statusFilter)
    } catch (error) {
      console.error('Error updating contact:', error)
      toast.error('Failed to update contact')
    } finally {
      setUpdating(false)
    }
  }

  // Delete contact
  const deleteContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/admin/contacts?id=${contactId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete contact')
      }

      setContacts(contacts.filter(c => c._id !== contactId))
      toast.success('Contact deleted successfully')
      setShowDeleteDialog(false)
      setContactToDelete(null)
      
      // Refresh data
      fetchContacts(currentPage, searchTerm, statusFilter)
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Save admin notes
  const saveAdminNotes = () => {
    if (selectedContact) {
      updateContactStatus(selectedContact._id, selectedContact.status, adminNotes)
    }
  }

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Mail className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New</p>
                <p className="text-2xl font-bold text-red-600">{stats.new}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-bold text-blue-600">{stats.read}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Replied</p>
                <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
              </div>
              <Reply className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contact Messages
          </CardTitle>
          <CardDescription>
            View and manage contact form submissions from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contacts List */}
          <div className="space-y-4">
            {contacts.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Contact messages will appear here when users submit the contact form.'}
                </p>
              </div>
            ) : (
              contacts.map((contact) => (
                <motion.div
                  key={contact._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => toggleContactExpansion(contact._id)}
                          className="flex items-center hover:bg-gray-100 rounded p-1 transition-colors"
                        >
                          {expandedContacts.has(contact._id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <h3 className="font-semibold text-gray-900">{contact.subject}</h3>
                        <Badge className={`text-xs ${statusColors[contact.status]}`}>
                          {statusIcons[contact.status]}
                          <span className="ml-1 capitalize">{contact.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {contact.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {contact.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(contact.createdAt)}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedContacts.has(contact._id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-gray-50 rounded border-l-4 border-blue-600"
                          >
                            <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                            <p className="text-gray-700 whitespace-pre-wrap">{contact.message}</p>
                            
                            {contact.adminNotes && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="font-medium text-gray-900 mb-2">Admin Notes:</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{contact.adminNotes}</p>
                              </div>
                            )}

                            {contact.repliedBy && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-gray-600">
                                  Replied by {contact.repliedBy.name} on {formatDate(contact.repliedAt!)}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewContact(contact)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setContactToDelete(contact)
                          setShowDeleteDialog(true)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Detail Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Contact Details
                </DialogTitle>
                <DialogDescription>
                  View and manage contact message from {selectedContact.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{selectedContact.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedContact.email}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-gray-900">{selectedContact.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                    {selectedContact.message}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Select
                      value={selectedContact.status}
                      onValueChange={(value) => updateContactStatus(selectedContact._id, value)}
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Submitted</label>
                    <p className="text-gray-900">{formatDate(selectedContact.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this contact..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {selectedContact.repliedBy && (
                  <div className="p-3 bg-green-50 rounded border">
                    <p className="text-sm text-green-800">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Replied by {selectedContact.repliedBy.name} on {formatDate(selectedContact.repliedAt!)}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowContactDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={saveAdminNotes}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updating ? "Saving..." : "Save Notes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact message from {contactToDelete?.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToDelete && deleteContact(contactToDelete._id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
