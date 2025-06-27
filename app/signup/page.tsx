'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/auth-context';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(
        name,
        email,
        password,
        isAdmin ? adminKey : null
      );
      if (success) {
        toast.success('Account created successfully!');
        // The redirection will be handled in the auth context
      }
    } catch (error) {
      console.error('Registration error:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create account. Please try again.';

      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full flex rounded-2xl overflow-hidden shadow-xl">
        {/* Left Side - Form */}
        <motion.div
          className="w-full lg:w-1/2 bg-white p-8 md:p-12"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <Link
              href="/"
              className="flex items-center justify-center lg:justify-start mb-6"
            >
              <span className="text-2xl font-bold text-gray-900">
                PRE<span className="text-[#FF6B38]">PROOTS</span>
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center lg:text-left">
              Create Account
            </h2>
            <p className="text-gray-600 text-center lg:text-left">
              Join Preproots and start learning today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B38] focus:border-[#FF6B38] focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B38] focus:border-[#FF6B38] focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B38] focus:border-[#FF6B38] focus:z-10 sm:text-sm"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B38] focus:border-[#FF6B38] focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="isAdmin"
                name="isAdmin"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 text-[#FF6B38] focus:ring-[#FF6B38] border-gray-300 rounded"
              />
              <label
                htmlFor="isAdmin"
                className="ml-2 block text-sm text-gray-700"
              >
                Register as admin
              </label>
            </div>

            {isAdmin && (
              <div>
                <label
                  htmlFor="adminKey"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Admin Key
                </label>
                <input
                  id="adminKey"
                  name="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B38] focus:border-[#FF6B38] focus:z-10 sm:text-sm"
                  placeholder="Enter admin key"
                  required={isAdmin}
                />
              </div>
            )}

            <div className="pt-2">
              <motion.button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-[#FF6B38] hover:bg-[#2BBEB4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B38] font-medium"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </motion.button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-[#FF6B38] hover:text-[#2BBEB4]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Right Side - Image */}
        <div className="hidden lg:block lg:w-1/2 bg-[#FF6B38] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B38] to-[#2BBEB4] opacity-90"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
            <h3 className="text-3xl font-bold mb-6">
              Start Your Learning Journey Today
            </h3>
            <p className="text-lg text-center mb-8">
              Join thousands of students and gain access to high-quality courses
              taught by industry experts.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-white" />
                <span>Access to premium courses</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-white" />
                <span>Learn at your own pace</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-white" />
                <span>Connect with expert instructors</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-3 text-white" />
                <span>Earn certificates</span>
              </div>
            </div>
            <div className="w-full max-w-md">
              <Image
                src="/signup.png"
                alt="Learning illustration"
                width={300}
                height={300}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
