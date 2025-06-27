"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Code, Database, Palette, LineChart, Globe, Server, Smartphone, Video } from "lucide-react"

export default function CategorySection() {
  const categories = [
    { name: "Web Development", icon: Code, count: 120, color: "bg-blue-100 text-blue-600" },
    { name: "Data Science", icon: Database, count: 87, color: "bg-purple-100 text-purple-600" },
    { name: "Design", icon: Palette, count: 63, color: "bg-pink-100 text-pink-600" },
    { name: "Business", icon: LineChart, count: 92, color: "bg-green-100 text-green-600" },
    { name: "Marketing", icon: Globe, count: 45, color: "bg-yellow-100 text-yellow-600" },
    { name: "DevOps", icon: Server, count: 28, color: "bg-red-100 text-red-600" },
    { name: "Mobile Development", icon: Smartphone, count: 51, color: "bg-indigo-100 text-indigo-600" },
    { name: "Video Production", icon: Video, count: 33, color: "bg-orange-100 text-orange-600" },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Browse Categories</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our wide range of courses across different categories
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -5 }}
            >
              <Link href={`/categories/${category.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="p-6 text-center">
                  <div
                    className={`${category.color} w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4`}
                  >
                    <category.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{category.name}</h3>
                  <p className="text-gray-600">{category.count} courses</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
