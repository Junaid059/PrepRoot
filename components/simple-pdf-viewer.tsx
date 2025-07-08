"use client"

import { FileText, Download, ExternalLink } from "lucide-react"
import { toast } from "react-hot-toast"
import { useState, useEffect } from "react"

interface SimplePDFViewerProps {
  url: string
  title: string
}

export default function SimplePDFViewer({ url, title }: SimplePDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  
  useEffect(() => {
    setIsLoading(true)
    setError(false)
    
    // Set a timeout to hide loading after a while even if PDF doesn't load
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [url])
  
  const handleDownload = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading("Starting download...")
      
      // Fetch the file with explicit content type
      const response = await fetch(url)
      const blob = await response.blob()
      
      // Create a new blob with PDF MIME type
      const pdfBlob = new Blob([blob], { type: 'application/pdf' })
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${title}.pdf`
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(link)
        toast.dismiss(loadingToast)
        toast.success("Download complete!")
      }, 100)
    } catch (error) {
      console.error("Download error:", error)
      
      // Fallback method
      try {
        // Direct link
        const link = document.createElement('a')
        link.href = url
        link.download = `${title}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success("Download started with fallback method")
      } catch (fallbackError) {
        console.error("Fallback download failed:", fallbackError)
        toast.error("Failed to download. Please try again later.")
      }
    }
  }
  
  const openInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer")
  }
  
  const handleIframeLoad = () => {
    setIsLoading(false)
    setError(false)
  }
  
  const handleIframeError = () => {
    setIsLoading(false)
    setError(true)
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 rounded-md overflow-hidden">
      <div className="bg-white p-3 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-800 truncate">{title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-1 bg-[#FF6B38] text-white rounded-md text-sm hover:bg-opacity-90"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </button>
          <button
            onClick={openInNewTab}
            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-opacity-90"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-t-[#FF6B38] border-gray-200 rounded-full animate-spin mb-2"></div>
              <p className="text-gray-600 text-sm">Loading PDF...</p>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-4">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 mb-4">Unable to display this PDF</p>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 bg-[#FF6B38] text-white rounded-md hover:bg-opacity-90 text-sm"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-opacity-90 text-sm"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* PDF Iframe */}
        <iframe
          src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
          className="absolute inset-0 w-full h-full border-none"
          title={title}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}
