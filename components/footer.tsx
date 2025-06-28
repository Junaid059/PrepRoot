import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              PRE<span className="text-[#8B4513]">PROOTS</span>
            </h3>
            <p className="text-gray-400 mb-4">
              Empowering learners worldwide with high-quality, accessible & engaging education.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#8B4513] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#8B4513] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#8B4513] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#8B4513] transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-teal-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-gray-400 hover:text-teal-500 transition-colors">
                  Explore Courses
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-gray-400 hover:text-teal-500 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-teal-500 transition-colors">
                  Contact
                </Link>
              </li>
             
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/explore?category=Web%20Development"
                  className="text-gray-400 hover:text-teal-500 transition-colors"
                >
                  Web Development
                </Link>
              </li>
              <li>
                <Link
                  href="/explore?category=Data%20Science"
                  className="text-gray-400 hover:text-teal-500 transition-colors"
                >
                  Data Science
                </Link>
              </li>
              <li>
                <Link href="/explore?category=Business" className="text-gray-400 hover:text-teal-500 transition-colors">
                  Business
                </Link>
              </li>
              <li>
                <Link href="/explore?category=Design" className="text-gray-400 hover:text-teal-500 transition-colors">
                  Design
                </Link>
              </li>
              <li>
                <Link
                  href="/explore?category=Marketing"
                  className="text-gray-400 hover:text-teal-500 transition-colors"
                >
                  Marketing
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-[#8B4513] mr-2 mt-0.5" />
                <span className="text-gray-400">123 Education Street, Learning City, 10001</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-[#8B4513] mr-2" />
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-[#8B4513] mr-2" />
                <span className="text-gray-400">info@preproots.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Preproots. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/terms" className="text-gray-400 hover:text-teal-500 transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-teal-500 transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-teal-500 transition-colors text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
