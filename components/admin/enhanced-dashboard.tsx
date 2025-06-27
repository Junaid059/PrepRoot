'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Award,
  Calendar,
  Target,
  Activity,
  Star,
} from 'lucide-react';

interface Stats {
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  totalEnrollments: number;
  totalTeachers?: number;
  enrollmentStats?: EnrollmentStat[];
}

interface EnrollmentStat {
  _id: {
    year: number;
    month: number;
    day: number;
  };
  count: number;
  revenue: number;
}

interface EnhancedDashboardProps {
  stats: Stats;
  isLoading: boolean;
}

// Sample data for enhanced visualizations
const monthlyRevenueData = [
  { month: 'Jan', revenue: 45000, enrollments: 120, courses: 8 },
  { month: 'Feb', revenue: 52000, enrollments: 145, courses: 12 },
  { month: 'Mar', revenue: 48000, enrollments: 132, courses: 10 },
  { month: 'Apr', revenue: 61000, enrollments: 168, courses: 15 },
  { month: 'May', revenue: 55000, enrollments: 155, courses: 13 },
  { month: 'Jun', revenue: 67000, enrollments: 189, courses: 18 },
];

const categoryPerformanceData = [
  { name: 'Web Development', students: 450, revenue: 180000, growth: 15.2 },
  { name: 'Data Science', students: 320, revenue: 128000, growth: 22.8 },
  { name: 'Design', students: 280, revenue: 98000, growth: 8.5 },
  { name: 'Business', students: 190, revenue: 76000, growth: 12.3 },
  { name: 'Marketing', students: 150, revenue: 52000, growth: 18.7 },
];

const studentEngagementData = [
  { day: 'Mon', active: 1200, completed: 89, started: 156 },
  { day: 'Tue', active: 1350, completed: 102, started: 178 },
  { day: 'Wed', active: 1180, completed: 95, started: 145 },
  { day: 'Thu', active: 1420, completed: 118, started: 189 },
  { day: 'Fri', active: 1380, completed: 112, started: 167 },
  { day: 'Sat', active: 980, completed: 78, started: 123 },
  { day: 'Sun', active: 850, completed: 65, started: 98 },
];

const topInstructorsData = [
  { name: 'Dr. Sarah Johnson', students: 1250, rating: 4.9, courses: 8 },
  { name: 'Prof. Michael Chen', students: 980, rating: 4.8, courses: 6 },
  { name: 'Dr. Emily Rodriguez', students: 875, rating: 4.7, courses: 5 },
  { name: 'Prof. David Kim', students: 720, rating: 4.6, courses: 4 },
  { name: 'Dr. Lisa Thompson', students: 650, rating: 4.8, courses: 3 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EnhancedDashboard({
  stats,
  isLoading,
}: EnhancedDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: '+12.5%',
      changeType: 'positive' as const,
      description: 'Active learners',
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      change: '+8.2%',
      changeType: 'positive' as const,
      description: 'Published courses',
    },
    {
      title: 'Monthly Revenue',
      value: `PKR ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      change: '+23.1%',
      changeType: 'positive' as const,
      description: 'This month',
    },
    {
      title: 'Total Enrollments',
      value: stats.totalEnrollments,
      icon: Award,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      change: '+15.7%',
      changeType: 'positive' as const,
      description: 'Course enrollments',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            className={`${card.color} rounded-xl shadow-lg p-6 text-white relative overflow-hidden`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <card.icon className="h-6 w-6" />
                </div>
                <div className="flex items-center text-sm">
                  {card.changeType === 'positive' ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  <span>{card.change}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium opacity-90">{card.title}</h3>
                <p className="text-2xl font-bold mb-1">{card.value}</p>
                <p className="text-xs opacity-75">{card.description}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
          </motion.div>
        ))}
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
          Analytics Overview
        </h3>
        <div className="flex space-x-2">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue and Enrollment Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              Revenue Trends
            </h4>
            <div className="flex items-center text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">+18.2%</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              Student Engagement
            </h4>
            <div className="flex items-center text-blue-600">
              <Activity className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Daily Active</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={studentEngagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Category Performance and Top Instructors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              Category Performance
            </h4>
            <div className="flex items-center text-purple-600">
              <Target className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Growth Rate</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="students" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              Top Instructors
            </h4>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            {topInstructorsData.map((instructor, index) => (
              <motion.div
                key={instructor.name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    {instructor.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white text-sm">
                      {instructor.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {instructor.students} students • {instructor.courses}{' '}
                      courses
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {instructor.rating}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Enrollment Distribution */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
            Enrollment Distribution
          </h4>
          <div className="flex items-center text-indigo-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Last 30 Days</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPerformanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="students"
                >
                  {categoryPerformanceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-800 dark:text-white">
              Key Metrics
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  94.2%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completion Rate
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  4.8
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg. Rating
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  2.3h
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg. Session
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  87%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Retention Rate
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
