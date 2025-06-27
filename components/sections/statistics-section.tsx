"use client"

import { motion } from "framer-motion"
import { Users, BookOpen, Award, Globe } from "lucide-react"

export default function StatisticsSection() {
  const stats = [
    { icon: Users, value: "10,000+", label: "Active Students", color: "bg-blue-100 text-blue-600" },
    { icon: BookOpen, value: "200+", label: "Courses", color: "bg-green-100 text-green-600" },
    { icon: Award, value: "50+", label: "Expert Instructors", color: "bg-purple-100 text-purple-600" },
    { icon: Globe, value: "15+", label: "Countries", color: "bg-yellow-100 text-yellow-600" },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`${stat.color} w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4`}>
                <stat.icon className="h-10 w-10" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{stat.value}</h3>
              <p className="text-lg text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
