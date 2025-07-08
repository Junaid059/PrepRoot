"use client"

import { FileText, Download, ExternalLink, RefreshCw } from "lucide-react"
import { toast } from "react-hot-toast"
import { useState, useEffect } from "react"

interface PDFViewerProps {
  pdfUrl: string
  title: string
  isEnrolled: boolean
  isFreePreview: boolean
}

export default function PDFViewer({ pdfUrl, title, isEnrolled, isFreePreview }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [viewMethod, setViewMethod] = useState<'direct' | 'google' | 'object'>('direct')
  const canAccess = isEnrolled || isFreePreview

  useEffect(() => {
    // Reset loading state when PDF URL changes
    setIsLoading(true)
    
    // Set a timeout to hide the loading indicator after a few seconds
    // even if the PDF doesn't trigger the onLoad event
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [pdfUrl, viewMethod])

  const handleDownload = async () => {
    if (!canAccess) {
      toast.error("Please enroll in this course to download this PDF")
      return
    }

    // Show loading toast
    const loadingToast = toast.loading("Starting download...")
    
    try {
      // Method 1: Using fetch and Blob with explicit PDF MIME type
      const response = await fetch(pdfUrl)
      const blob = await response.blob()
      
      // Create a new blob with explicit PDF MIME type
      const pdfBlob = new Blob([blob], { type: 'application/pdf' })
      
      // Create a Blob URL
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title}.pdf`
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
        toast.dismiss(loadingToast)
        toast.success("Download complete!")
      }, 100)
    } catch (error) {
      console.error("Download error:", error)
      
      try {
        // Fallback method 1: Direct link with responseType
        const response = await fetch(pdfUrl, { 
          headers: { 'Content-Type': 'application/pdf' } 
        })
        const blob = await response.blob()
        const url = window.URL.createObjectURL(
          new Blob([blob], { type: 'application/pdf' })
        )
        
        const link = document.createElement('a')
        link.href = url
        link.download = `${title}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.dismiss(loadingToast)
        toast.success("Download complete!")
      } catch (fallbackError) {
        console.error("Fallback download error:", fallbackError)
        
        // Fallback method 2: Simplest approach
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = `${title}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.dismiss(loadingToast)
        toast.success("Download started with fallback method")
      }
    }
  }
  
  const openInNewTab = () => {
    if (!canAccess) {
      toast.error("Please enroll in this course to view this PDF")
      return
    }
    
    // Open with explicit PDF handling
    try {
      // Create a temporary link that forces content type
      const link = document.createElement('a')
      link.href = pdfUrl
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.setAttribute("download", `${title}.pdf`) // This won't download but hints at PDF content
      link.setAttribute("type", "application/pdf")
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error opening PDF in new tab:", error)
      // Fallback to simple window.open
      window.open(pdfUrl, "_blank")
    }
  }
  
  const cyclePdfViewMethod = () => {
    setIsLoading(true)
    if (viewMethod === 'direct') {
      setViewMethod('google')
    } else if (viewMethod === 'google') {
      setViewMethod('object')
    } else {
      setViewMethod('direct')
    }
  }
  
  // Render the appropriate PDF viewer based on the selected method
  const renderPdfViewer = () => {
    switch(viewMethod) {
      case 'direct':
        return (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="absolute inset-0 w-full h-full border-none"
            title={title}
            onLoad={() => setIsLoading(false)}
            sandbox="allow-scripts allow-same-origin"
          />
        )
      
      case 'google':
        return (
          <iframe
            src={`https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(pdfUrl)}`}
            className="absolute inset-0 w-full h-full border-none"
            title={title}
            onLoad={() => setIsLoading(false)}
          />
        )
      
      case 'object':
        return (
          <object
            data={pdfUrl}
            type="application/pdf"
            className="absolute inset-0 w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center p-4">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Your browser doesn't support PDF embedding</p>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 bg-[#FF6B38] text-white rounded-md hover:bg-opacity-90"
                >
                  Open PDF in New Tab
                </button>
              </div>
            </div>
          </object>
        )
    }
  }
  
  return (
    <div className="w-full h-full bg-gray-100 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h3 className="font-medium text-gray-800">{title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-1 bg-[#FF6B38] text-white rounded-md hover:bg-opacity-90 transition-colors text-sm"
          >
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </button>
          <button
            onClick={openInNewTab}
            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-opacity-90 transition-colors text-sm"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open in New Tab
          </button>
        </div>
      </div>
      
      <div className="relative w-full flex-1 bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-t-[#FF6B38] border-gray-200 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}
        
        {/* Render the appropriate PDF viewer */}
        {renderPdfViewer()}
        
        {/* Button to cycle through different viewing methods */}
        <button 
          onClick={cyclePdfViewMethod}
          className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
          title="Try another viewing method"
        >
          <RefreshCw className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
