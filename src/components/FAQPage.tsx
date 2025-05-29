import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  ArrowRight, 
  Send,
  Search
} from 'lucide-react';

const FAQPage = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const faqs = [
    {
      question: "How can AI help streamline my compliance process?",
      answer: "GARNET's AI automation reduces questionnaire response time by up to 80%, automatically analyzing your security posture and suggesting accurate responses. Our AI learns from your previous submissions and adapts to different compliance frameworks, transforming weeks of manual work into hours of intelligent automation."
    },
    {
      question: "Is GARNET difficult to integrate with existing systems?",
      answer: "Not at all! GARNET offers seamless integration with popular cloud services like AWS, Google Cloud, and Azure through secure API connectors. Our one-click integration process automatically collects evidence from your connected systems, and our team provides full support throughout the setup process."
    },
    {
      question: "What compliance frameworks does GARNET support?",
      answer: "GARNET supports 25+ major compliance frameworks including ISO 27001, SOC 2, GDPR, HIPAA, CCPA, PCI DSS, and many more. Our platform continuously updates to include new frameworks, ensuring you stay compliant as regulations evolve."
    },
    {
      question: "Do I need technical knowledge to use GARNET?",
      answer: "No technical expertise required! GARNET is designed for compliance professionals, not developers. Our intuitive interface guides you through the process, while our AI handles the complex analysis. We also provide comprehensive training and dedicated support to ensure your success."
    },
    {
      question: "What kind of support do you offer?",
      answer: "We provide comprehensive support including email and chat assistance for all users, priority support for Pro customers, and dedicated account management for Enterprise clients. Our team includes compliance experts who understand the nuances of various frameworks and can provide strategic guidance."
    },
    {
      question: "How secure is my compliance data with GARNET?",
      answer: "Security is our top priority. GARNET is SOC 2 compliant, ISO 27001 certified, and GDPR-ready. We use enterprise-grade encryption, implement strict access controls, and undergo regular security audits. Your compliance data is protected with the same standards you're working to achieve."
    },
    {
      question: "What is the pricing model for GARNET?",
      answer: "GARNET offers flexible pricing tiers to suit businesses of all sizes. Our Starter plan begins at $199/month, while our Pro and Enterprise plans offer advanced features with custom pricing. All plans include a 14-day free trial with no credit card required. Contact our sales team for a customized quote."
    },
    {
      question: "How long does it take to get started with GARNET?",
      answer: "Most customers are up and running with GARNET in just a few hours. Our streamlined onboarding process includes a guided setup wizard, pre-built templates, and optional assisted implementation from our customer success team. You'll start seeing value from day one."
    }
  ];

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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">GARNET</span>
              </a>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="/#features" className="text-gray-600 hover:text-purple-600 transition-colors">Features</a>
              <a href="/#demo" className="text-gray-600 hover:text-purple-600 transition-colors">Demo</a>
              <a href="/#stats" className="text-gray-600 hover:text-purple-600 transition-colors">Impact</a>
              <a href="/#testimonials" className="text-gray-600 hover:text-purple-600 transition-colors">Testimonials</a>
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
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
      <section className="py-10 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full -mr-20 -mt-20 z-0"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full -ml-16 -mb-16 z-0"></div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-6 relative z-10">Ask Us Anything</h2>
            
            <form onSubmit={handleSubmit} className="relative z-10">
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type your question here..."
                  className="w-full px-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
              
              {showSuccessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-green-50 border border-green-100 text-green-800 rounded-lg flex items-center"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                  <span>Thank you! We've received your question and will respond shortly.</span>
                </motion.div>
              )}
              
              <p className="text-gray-500 text-sm mt-4">
                We typically respond to questions within 1 business day. For urgent inquiries, 
                please contact our support team directly at support@garnet.ai
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      {/* FAQ List Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Browse Our 
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Knowledge Base</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore common questions about our AI-powered compliance platform.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
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
                  <span className="text-lg font-semibold text-gray-900 pr-8">{faq.question}</span>
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
                
                <motion.div
                  initial={false}
                  animate={{
                    height: activeFaq === index ? "auto" : 0,
                    opacity: activeFaq === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <div className="w-full h-px bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 mb-4"></div>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-gray-600 mb-6">Need more personalized assistance? Our team is here to help!</p>
            <motion.button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all inline-flex items-center"
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
      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <span className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">GARNET</span>
              </span>
              <p className="text-gray-600 mt-2">AI-Powered Compliance Automation</p>
            </div>
            <div className="flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-purple-600 transition-colors">Home</a>
              <a href="/faq" className="text-gray-600 hover:text-purple-600 transition-colors">FAQ</a>
              <a href="/privacy" className="text-gray-600 hover:text-purple-600 transition-colors">Privacy</a>
              <a href="/terms" className="text-gray-600 hover:text-purple-600 transition-colors">Terms</a>
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

// Missing CheckCircleIcon component
const CheckCircleIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
};

export default FAQPage; 