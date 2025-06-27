'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/auth-context';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login successful!');
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
      <div className="max-w-4xl w-full flex rounded-2xl overflow-hidden shadow-xl">
        {/* Left Side - Image */}
        <div className="hidden md:block md:w-1/2 bg-[#FF6B38] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B38] to-[#2BBEB4] opacity-90"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
            <h3 className="text-3xl font-bold mb-6">Welcome Back!</h3>
            <p className="text-lg text-center mb-8">
              Continue your learning journey and access all your courses, track
              your progress, and connect with instructors.
            </p>
            <div className="w-full max-w-md">
              <Image
                src="/login.png"
                alt="Learning illustration"
                width={400}
                height={400}
                className="mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <motion.div
          className="w-full md:w-1/2 bg-white p-8 md:p-12"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <Link
              href="/"
              className="flex items-center justify-center md:justify-start mb-6"
            >
              <span className="text-2xl font-bold text-gray-900">
                PRE<span className="text-[#FF6B38]">PROOTS</span>
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center md:text-left">
              Sign In
            </h2>
            <p className="text-gray-600 text-center md:text-left">
              Sign in to continue your learning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B38] focus:border-[#FF6B38] focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#FF6B38] focus:ring-[#FF6B38] border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#FF6B38] hover:text-[#2BBEB4]"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <motion.button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-[#FF6B38] hover:bg-[#2BBEB4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B38] font-medium"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </motion.button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-[#FF6B38] hover:text-[#2BBEB4]"
              >
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
