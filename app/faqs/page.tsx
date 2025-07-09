'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "Do you accept Credit/Debit Cards for payments?",
    answer: "Yes, we accept all major credit and debit cards including Visa, Mastercard, American Express, and Discover. All payments are processed securely through our encrypted payment gateway.",
    category: "Payment"
  },
  {
    id: 2,
    question: "Can I pay using PayPal?",
    answer: "Absolutely! PayPal is one of our supported payment methods. You can use your PayPal account or pay with a card through PayPal's secure checkout process.",
    category: "Payment"
  },
  {
    id: 3,
    question: "What is the method to pay directly using Bank Transfer?",
    answer: "For bank transfers, please contact our support team for specific banking details. Bank transfers typically take 1-3 business days to process, and your course access will be activated once payment is confirmed.",
    category: "Payment"
  },
  {
    id: 4,
    question: "Do you accept Jazz Cash?",
    answer: "Yes, we accept Jazz Cash for our Pakistani students. This mobile payment method makes it convenient for local students to enroll in courses using their mobile wallet.",
    category: "Payment"
  },
  {
    id: 5,
    question: "What if I want to freeze my Account?",
    answer: "You can temporarily freeze your account by contacting our support team. During the freeze period, your progress will be saved, and you can reactivate your account at any time without losing your course data.",
    category: "Account"
  },
  {
    id: 6,
    question: "What if I want to continue my access for the next session as well?",
    answer: "Course access varies by enrollment type. Many of our courses offer lifetime access, while others may require renewal. Check your course details or contact support to extend your access period.",
    category: "Account"
  },
  {
    id: 7,
    question: "What if I failed the exam, will I get a refund?",
    answer: "Failing an exam doesn't automatically qualify for a refund, as you still have access to all course materials and can retake the exam. However, each case is reviewed individually based on our refund policy.",
    category: "Refunds"
  },
  {
    id: 8,
    question: "What if I am not satisfied with the course content, will I get a refund?",
    answer: "We offer a 30-day money-back guarantee if you're not satisfied with the course content. To qualify, you must request a refund within 30 days of purchase and have completed less than 30% of the course.",
    category: "Refunds"
  },
  {
    id: 9,
    question: "Do you have any WhatsApp groups where I can get notifications or get in touch with my Instructor?",
    answer: "Yes! We have dedicated WhatsApp groups for each course where you can interact with instructors and fellow students. You'll receive the group link after enrollment, and it's a great way to stay updated and get support.",
    category: "Support"
  }
];

const categories = ["All", "Payment", "Account", "Refunds", "Support"];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Hero Section */}
      <div className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <HelpCircle className="mx-auto h-16 w-16 text-blue-600 mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked <span className="text-blue-600">Questions</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Find answers to common questions about our courses, payments, and platform
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-4 pl-12 pr-6 text-lg rounded-2xl border-2 border-blue-200 focus:border-blue-600 focus:outline-none bg-white/80 backdrop-blur-sm shadow-lg"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            </div>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white/80 text-gray-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-4">
            <AnimatePresence>
              {filteredFAQs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 overflow-hidden">
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-blue-50 transition-colors duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {faq.question}
                        </h3>
                      </div>
                      <motion.div
                        animate={{ rotate: openItems.includes(faq.id) ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="ml-4 flex-shrink-0"
                      >
                        <ChevronDown className="h-6 w-6 text-blue-600" />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {openItems.includes(faq.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-0">
                            <div className="h-px bg-gradient-to-r from-blue-200 to-transparent mb-4"></div>
                            <p className="text-gray-700 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredFAQs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100">
                <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or category filter
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contact Support Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors duration-200 shadow-lg"
              >
                Contact Support
              </a>
              <a
                href="mailto:info@preproots.com"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                Email Us
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}