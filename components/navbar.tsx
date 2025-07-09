'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import {
  Search,
  Menu,
  X,
  User,
  LogOut,
  BookOpen,
  Settings,
  GraduationCap,
} from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Only hide the normal navbar on admin dashboard pages, but keep it for admin users on other pages
  // Admin dashboard has its own navbar with profile options
  if (pathname.startsWith('/admin-dashboard')) {
    return null;
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/explore?search=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Explore', href: '/explore' },
    {
      name: 'Instructors',
      href: '/instructors',
      icon: <GraduationCap className="h-4 w-4 mr-1" />,
    },
    { name: 'FAQs', href: '/faqs' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-md ${
        isScrolled ? 'py-2' : 'py-4'
      }`}
      // style={{
      //   background: 'linear-gradient(135deg, #fff3ec 0%, #ffe6d0 100%)',
      // }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">
              PRE<span className="text-[#2563eb]">PROOTS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#2563eb] ${
                  pathname === link.href ? 'text-[#2563eb]' : 'text-gray-700'
                } ${link.icon ? 'flex items-center' : ''}`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Search, Auth, and Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            {pathname === '/explore' && (
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center relative"
              >
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </form>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {user.profileImage ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#bfdbfe]">
                      <img 
                        src={user.profileImage} 
                        alt={user.name || "Profile"} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#bfdbfe] flex items-center justify-center text-[#2563eb] font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                    Welcome, {user.name || 'User'}
                  </span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        My Profile
                      </Link>
                      
                      {/* Only show My Courses for regular users */}
                      {!user.isAdmin && (
                        <Link
                          href="/my-courses"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          My Courses
                        </Link>
                      )}
                      
                      {user.isAdmin && (
                        <Link
                          href="/admin-dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-[#2563eb] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-[#2563eb] text-white rounded-full text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t mt-2"
          >
            <div className="container mx-auto px-4 py-4">
              {pathname === '/explore' && (
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </form>
              )}

              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-[#2563eb] ${
                      pathname === link.href
                        ? 'text-[#2563eb]'
                        : 'text-gray-700'
                    } ${link.icon ? 'flex items-center' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}

                {!user && (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-gray-700 hover:text-[#2563eb] transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 bg-[#2563eb] text-white rounded-full text-sm font-medium hover:bg-[#1d4ed8] transition-colors inline-block text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
