import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  ArrowRight, 
  Send,
  Search,
  CheckCircle,
  MessageSquare,
  HelpCircle,
  Book,
  FileQuestion
} from 'lucide-react';
import Link from 'next/link';

const FAQPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: "all", name: "All Questions" },
    { id: "product", name: "Product" },
    { id: "pricing", name: "Pricing" },
    { id: "security", name: "Security" },
    { id: "integration", name: "Integration" }
  ];

  const faqs = [
    {
      question: "How can AI help streamline my compliance process?",
      answer: "GARNET's AI automation reduces questionnaire response time by up to 80%, automatically analyzing your security posture and suggesting accurate responses. Our AI learns from your previous submissions and adapts to different compliance frameworks, transforming weeks of manual work into hours of intelligent automation.",
      category: "product"
    },
    {
      question: "Is GARNET difficult to integrate with existing systems?",
      answer: "Not at all! GARNET offers seamless integration with popular cloud services like AWS, Google Cloud, and Azure through secure API connectors. Our one-click integration process automatically collects evidence from your connected systems, and our team provides full support throughout the setup process.",
      category: "integration"
    },
    {
      question: "What compliance frameworks does GARNET support?",
      answer: "GARNET supports 25+ major compliance frameworks including ISO 27001, SOC 2, GDPR, HIPAA, CCPA, PCI DSS, and many more. Our platform continuously updates to include new frameworks, ensuring you stay compliant as regulations evolve.",
      category: "product"
    },
    {
      question: "Do I need technical knowledge to use GARNET?",
      answer: "No technical expertise required! GARNET is designed for compliance professionals, not developers. Our intuitive interface guides you through the process, while our AI handles the complex analysis. We also provide comprehensive training and dedicated support to ensure your success.",
      category: "product"
    },
    {
      question: "What kind of support do you offer?",
      answer: "We provide comprehensive support including email and chat assistance for all users, priority support for Pro customers, and dedicated account management for Enterprise clients. Our team includes compliance experts who understand the nuances of various frameworks and can provide strategic guidance.",
      category: "product"
    },
    {
      question: "How secure is my compliance data with GARNET?",
      answer: "Security is our top priority. GARNET is SOC 2 compliant, ISO 27001 certified, and GDPR-ready. We use enterprise-grade encryption, implement strict access controls, and undergo regular security audits. Your compliance data is protected with the same standards you're working to achieve.",
      category: "security"
    },
    {
      question: "What is the pricing model for GARNET?",
      answer: "GARNET offers flexible pricing tiers to suit businesses of all sizes. Our Starter plan begins at $199/month, while our Pro and Enterprise plans offer advanced features with custom pricing. All plans include a 14-day free trial with no credit card required. Contact our sales team for a customized quote.",
      category: "pricing"
    },
    {
      question: "How long does it take to get started with GARNET?",
      answer: "Most customers are up and running with GARNET in just a few hours. Our streamlined onboarding process includes a guided setup wizard, pre-built templates, and optional assisted implementation from our customer success team. You'll start seeing value from day one.",
      category: "product"
    }
  ];

  const filteredFaqs = activeCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessMessage(true);
      setQuery('');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">GARNET</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="text-gray-600 hover:text-purple-600 transition-colors">
                Features
              </Link>
              <Link href="/#demo" className="text-gray-600 hover:text-purple-600 transition-colors">
                Demo
              </Link>
              <Link href="/#stats" className="text-gray-600 hover:text-purple-600 transition-colors">
                Impact
              </Link>
              <Link href="/#testimonials" className="text-gray-600 hover:text-purple-600 transition-colors">
                Testimonials
              </Link>
              <motion.button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-24 right-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -z-10"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -z-10"></div>
        
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6">
              Knowledge Base
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Frequently Asked
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent">
                Questions
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Find answers to common questions about GARNET's AI-powered compliance platform.
              Can't find what you're looking for? Ask us directly below.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-xl relative overflow-hidden border border-purple-100"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full -mr-20 -mt-20 z-0"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full -ml-16 -mb-16 z-0"></div>
            
            <div className="flex items-center mb-6 relative z-10">
              <MessageSquare className="h-6 w-6 text-purple-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Ask Us Anything</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="relative z-10">
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type your question here..."
                  className="w-full px-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-700"
                />
                <motion.button
                  type="submit"
                  className="absolute right-3 top-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-70"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!query.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span>Submit</span>
                      <Send className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </motion.button>
              </div>
              
              <AnimatePresence>
                {showSuccessMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-green-50 border border-green-100 text-green-800 rounded-lg flex items-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    <span>Thank you! We've received your question and will respond shortly.</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <p className="text-gray-500 text-sm mt-4">
                We typically respond to questions within 1 business day. For urgent inquiries, 
                please contact our support team directly at <span className="text-purple-600 font-medium">support@garnet.ai</span>
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      {/* FAQ List Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Book className="h-6 w-6 text-purple-500 mr-2" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Browse Our 
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent ml-2">Knowledge Base</span>
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore common questions about our AI-powered compliance platform.
            </p>
          </motion.div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center mb-12 gap-2">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:text-purple-600'
                }`}
                onClick={() => setActiveCategory(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category.name}
              </motion.button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <FileQuestion className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600">No questions found in this category</h3>
                <p className="text-gray-500 mt-2">Try selecting a different category or ask us directly.</p>
              </motion.div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <motion.button
                    className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => toggleFaq(index)}
                    whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                  >
                    <div className="flex items-start">
                      <HelpCircle className={`h-5 w-5 mt-0.5 mr-3 ${
                        activeFaq === index ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <span className="text-lg font-semibold text-gray-900 pr-8">{faq.question}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: activeFaq === index ? 45 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="flex-shrink-0"
                    >
                      {activeFaq === index ? (
                        <Minus className="h-6 w-6 text-purple-600" />
                      ) : (
                        <Plus className="h-6 w-6 text-gray-400" />
                      )}
                    </motion.div>
                  </motion.button>
                  
                  <AnimatePresence>
                    {activeFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pl-14">
                          <div className="w-full h-px bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 mb-4"></div>
                          <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>

          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-gray-600 mb-6">Need more personalized assistance? Our team is here to help!</p>
            <motion.button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all inline-flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Support
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <span className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">GARNET</span>
              </span>
              <p className="text-gray-600 mt-2">AI-Powered Compliance Automation</p>
            </div>
            <div className="flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-purple-600 transition-colors">
                Home
              </Link>
              <Link href="/faq" className="text-gray-600 hover:text-purple-600 transition-colors">
                FAQ
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-purple-600 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-purple-600 transition-colors">
                Terms
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} GARNET Technologies, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FAQPage; 