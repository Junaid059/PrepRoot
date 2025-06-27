"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Web Developer",
      company: "Tech Solutions Inc.",
      image: "/placeholder.svg?height=100&width=100",
      text: "The courses on this platform completely transformed my career. I went from knowing basic HTML to becoming a full-stack developer in just 6 months. The instructors are top-notch and the community support is incredible.",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Data Scientist",
      company: "Analytics Pro",
      image: "/placeholder.svg?height=100&width=100",
      text: "As someone transitioning into data science, I found these courses to be exactly what I needed. The curriculum is well-structured, and the hands-on projects helped me build a portfolio that landed me my dream job.",
    },
    {
      id: 3,
      name: "Emma Wilson",
      role: "UX Designer",
      company: "Creative Studio",
      image: "/placeholder.svg?height=100&width=100",
      text: "The design courses here are exceptional. I've taken courses on other platforms, but none compare to the depth and quality of content offered here. The instructors are industry leaders who provide valuable insights.",
    },
  ]

  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-20 bg-blue-600 text-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Students Say</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Hear from our students who have transformed their careers through our courses
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto relative">
          <motion.div
            className="bg-white text-gray-800 rounded-2xl shadow-xl p-8 md:p-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            key={activeIndex}
          >
            <div className="absolute -top-6 -left-6 bg-yellow-400 text-blue-900 rounded-full p-4">
              <Quote className="h-8 w-8" />
            </div>

            <div className="flex flex-col md:flex-row items-center">
              <div className="mb-6 md:mb-0 md:mr-8">
                <img
                  src={testimonials[activeIndex].image || "/placeholder.svg"}
                  alt={testimonials[activeIndex].name}
                  className="w-24 h-24 rounded-full border-4 border-blue-100"
                />
              </div>

              <div className="flex-1">
                <p className="text-lg md:text-xl italic mb-6">"{testimonials[activeIndex].text}"</p>

                <div>
                  <h4 className="text-xl font-bold">{testimonials[activeIndex].name}</h4>
                  <p className="text-gray-600">
                    {testimonials[activeIndex].role}, {testimonials[activeIndex].company}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center mt-8 space-x-4">
            <motion.button
              onClick={prevTestimonial}
              className="p-2 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="h-6 w-6" />
            </motion.button>

            <div className="flex items-center space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-3 h-3 rounded-full ${index === activeIndex ? "bg-white" : "bg-blue-300"}`}
                />
              ))}
            </div>

            <motion.button
              onClick={nextTestimonial}
              className="p-2 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="h-6 w-6" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
