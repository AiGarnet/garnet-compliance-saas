"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import TrustedBy from '../components/TrustedBy';

// Icons
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ChevronUp,
  ArrowRight,
  Star,
  Shield,
  Lock,
  Zap,
  BarChart2,
  Users,
  CheckCircle2
} from 'lucide-react';

const Home = () => {
  // Animation refs
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const pricingRef = useRef(null);
  const faqRef = useRef(null);
  const ctaRef = useRef(null);

  // State variables
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [yearlyBilling, setYearlyBilling] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Scroll animations
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.5]);
  const heroScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  
  // Detect scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle FAQ item
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <main className="flex flex-col min-h-screen overflow-hidden bg-white selection:bg-primary/20 selection:text-primary-900">
      {/* Navbar */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' : 'py-6'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center">
            <motion.span 
              className="font-bold text-2xl text-gray-900 mr-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-primary">Garnet</span>AI
            </motion.span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.a 
              href="#features" 
              className="text-gray-700 hover:text-primary font-medium transition-colors"
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              Features
            </motion.a>
            <motion.a 
              href="#how-it-works" 
              className="text-gray-700 hover:text-primary font-medium transition-colors"
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              How It Works
            </motion.a>
            <motion.a 
              href="#pricing" 
              className="text-gray-700 hover:text-primary font-medium transition-colors"
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              Pricing
            </motion.a>
            <motion.a 
              href="#faq" 
              className="text-gray-700 hover:text-primary font-medium transition-colors"
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              FAQ
            </motion.a>
          </div>
          
          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/dashboard" className="px-5 py-2 text-gray-700 font-medium transition-colors">
                Sign In
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/dashboard" className="px-5 py-2.5 bg-primary text-white rounded-full font-medium shadow-sm hover:shadow-primary/20 hover:shadow-lg hover:bg-primary-dark transition-all">
                Try for Free
              </Link>
            </motion.div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              className="p-2 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className="md:hidden bg-white absolute top-full left-0 right-0 shadow-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="container mx-auto py-4 px-6 flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Features
                </a>
                <a href="#how-it-works" className="text-gray-700 py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  How It Works
                </a>
                <a href="#pricing" className="text-gray-700 py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Pricing
                </a>
                <a href="#faq" className="text-gray-700 py-2 hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  FAQ
                </a>
                <div className="pt-2 flex flex-col space-y-3">
                  <Link href="/dashboard" className="py-2 text-center text-gray-700 hover:text-primary font-medium" onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/dashboard" className="py-2.5 text-center bg-primary text-white rounded-full font-medium" onClick={() => setIsMenuOpen(false)}>
                    Try for Free
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-white"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Background gradient blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
            {/* Left column - Text Content */}
            <motion.div 
              className="flex-1 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6"
              >
                AI-Powered Compliance Solution
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Accelerate Enterprise
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500"> 
                  Vendor Onboarding
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Close deals faster with AI-powered compliance and trust automation. Streamline your vendor assessment process and accelerate your sales cycle.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(14, 165, 233, 0.2)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 bg-primary text-white rounded-full font-medium text-center shadow-sm hover:shadow-primary/30 hover:shadow-lg transition-all">
                    <span>Try for Free</span>
                    <ChevronRight className="ml-2 h-4 w-4 stroke-2" />
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <a href="#how-it-works" className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border border-gray-200 bg-white text-gray-700 rounded-full font-medium text-center hover:border-gray-300 hover:bg-gray-50 transition-colors">
                    <span>How it Works</span>
                    <ArrowRight className="ml-2 h-4 w-4 stroke-2" />
                  </a>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-1.5 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <div className="flex -space-x-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="flex items-center pl-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="font-medium ml-1">From 100+ happy customers</span>
                </span>
              </motion.div>
            </motion.div>
            
            {/* Right column - Hero Image */}
            <motion.div 
              className="flex-1 w-full lg:w-[45%] relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <div className="relative">
                {/* Decorative elements */}
                <motion.div
                  className="absolute -left-10 -top-10 w-32 h-32 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full blur-2xl opacity-80"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 0.9, 0.7] 
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute -right-5 bottom-1/3 w-24 h-24 bg-gradient-to-r from-teal-50 to-blue-50 rounded-full blur-2xl opacity-80"
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.6, 0.8, 0.6] 
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                    delay: 1
                  }}
                />
                <motion.div 
                  className="absolute -right-5 -bottom-5 w-40 h-40 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-full blur-2xl opacity-80"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.7, 0.5] 
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 6,
                    ease: "easeInOut",
                    delay: 2
                  }}
                />
                
                {/* Browser window mockup */}
                <motion.div 
                  className="relative z-10 bg-white rounded-2xl shadow-2xl shadow-gray-300/20 overflow-hidden border border-gray-100"
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Browser header */}
                  <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1 rounded-full bg-white text-gray-400 text-xs flex items-center">
                        <span className="mr-1.5">
                          <Lock className="h-3 w-3" />
                        </span>
                        garnetai.com/dashboard
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard screenshot/mockup */}
                  <div className="relative bg-gradient-to-br from-gray-50 to-white aspect-[16/10] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                      <div className="w-full h-full p-6">
                        {/* Dashboard UI */}
                        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs mr-3">G</div>
                              <div className="font-medium text-gray-800">Garnet AI Dashboard</div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                <Users className="h-4 w-4" />
                              </div>
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                <BarChart2 className="h-4 w-4" />
                              </div>
                              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">A</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-5">
                            <div className="bg-blue-50 rounded-lg p-3.5 flex flex-col">
                              <span className="text-xs text-blue-600 font-medium mb-1">Compliance Score</span>
                              <span className="text-2xl font-bold text-gray-900">87%</span>
                              <div className="w-full h-1.5 bg-blue-100 rounded-full mt-2">
                                <div className="h-full w-[87%] bg-blue-500 rounded-full"></div>
                              </div>
                            </div>
                            <div className="bg-teal-50 rounded-lg p-3.5 flex flex-col">
                              <span className="text-xs text-teal-600 font-medium mb-1">Vendors</span>
                              <span className="text-2xl font-bold text-gray-900">24</span>
                              <span className="text-xs text-teal-500 mt-2 flex items-center">
                                <ArrowRight className="h-3 w-3 mr-1" /> 3 new this month
                              </span>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3.5 flex flex-col">
                              <span className="text-xs text-purple-600 font-medium mb-1">Questionnaires</span>
                              <span className="text-2xl font-bold text-gray-900">16</span>
                              <span className="text-xs text-purple-500 mt-2 flex items-center">
                                <ArrowRight className="h-3 w-3 mr-1" /> 4 awaiting review
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex-1 bg-gray-50 rounded-lg p-4">
                            <div className="text-xs font-medium text-gray-700 mb-3">Recent Activity</div>
                            <div className="space-y-2.5">
                              <div className="flex items-center bg-white p-2.5 rounded-md shadow-sm">
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-800">ISO 27001 assessment completed</div>
                                  <div className="text-xs text-gray-400">2 hours ago</div>
                                </div>
                              </div>
                              <div className="flex items-center bg-white p-2.5 rounded-md shadow-sm">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                  <Users className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-800">New vendor added: Acme Corp</div>
                                  <div className="text-xs text-gray-400">5 hours ago</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Trusted By Logo Strip */}
      <TrustedBy />

      {/* Feature Cards */}
      <section id="features" ref={featuresRef} className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50/60">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI-powered solutions for faster <span className="text-primary">compliance</span>
            </h2>
            <p className="text-xl text-gray-600">
              Our intelligent platform automates and streamlines vendor compliance management,
              saving you time and accelerating deal closure.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
            {/* Feature Card 1 */}
            <motion.div 
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute right-0 top-0 h-32 w-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-500"></div>
              <div className="absolute right-0 bottom-0 h-16 w-16 bg-blue-500/5 rounded-full -mr-8 -mb-8 group-hover:scale-150 transition-all duration-500 delay-100"></div>
              
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 relative">
                <Zap className="h-7 w-7" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative">AI Questionnaire Assistant</h3>
              
              <p className="text-gray-600 mb-6 relative">
                Our AI analyzes and pre-fills compliance questionnaires, reducing response time by up to 80%.
              </p>
              
              <motion.div
                className="relative inline-flex items-center text-primary font-medium text-sm group-hover:translate-x-2 transition-transform"
                whileHover={{ x: 5 }}
              >
                <span>Learn more</span>
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </motion.div>
            </motion.div>
            
            {/* Feature Card 2 */}
            <motion.div 
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute right-0 top-0 h-32 w-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-500"></div>
              <div className="absolute right-0 bottom-0 h-16 w-16 bg-blue-500/5 rounded-full -mr-8 -mb-8 group-hover:scale-150 transition-all duration-500 delay-100"></div>
              
              <div className="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 mb-6 relative">
                <BarChart2 className="h-7 w-7" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative">Unified Compliance Tracker</h3>
              
              <p className="text-gray-600 mb-6 relative">
                Track compliance across multiple frameworks in a single dashboard with real-time gap analysis.
              </p>
              
              <motion.div
                className="relative inline-flex items-center text-teal-500 font-medium text-sm group-hover:translate-x-2 transition-transform"
                whileHover={{ x: 5 }}
              >
                <span>Learn more</span>
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </motion.div>
            </motion.div>
            
            {/* Feature Card 3 */}
            <motion.div 
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute right-0 top-0 h-32 w-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-500"></div>
              <div className="absolute right-0 bottom-0 h-16 w-16 bg-primary/5 rounded-full -mr-8 -mb-8 group-hover:scale-150 transition-all duration-500 delay-100"></div>
              
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 relative">
                <Users className="h-7 w-7" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative">Trust Portal Sharing</h3>
              
              <p className="text-gray-600 mb-6 relative">
                Share your compliance status securely with potential customers through a customizable trust portal.
              </p>
              
              <motion.div
                className="relative inline-flex items-center text-blue-500 font-medium text-sm group-hover:translate-x-2 transition-transform"
                whileHover={{ x: 5 }}
              >
                <span>Learn more</span>
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={howItWorksRef} className="py-20 md:py-28 bg-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How <span className="text-primary">Garnet AI</span> Works
            </h2>
            <p className="text-xl text-gray-600">
              Transform your compliance workflow with our simple yet powerful platform.
            </p>
          </motion.div>
          
          <div className="space-y-24 md:space-y-32">
            {/* Step 1 */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7.5rem] top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-16">
                <motion.div 
                  className="md:w-30 text-center order-1 md:order-1"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-15 h-15 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto relative z-10">
                    1
                  </div>
                  <h3 className="text-lg font-semibold mt-3 text-gray-900">Connect</h3>
                </motion.div>
                
                <motion.div 
                  className="flex-1 order-2 md:order-2"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    <div className="md:w-1/2 p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Systems</h3>
                      <p className="text-gray-600 mb-6">
                        Integrate your existing security tools and documentation repositories with our secure API connectors.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">One-click integration with popular cloud services</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">Secure, encrypted connections to your data</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">Automatic evidence collection from connected systems</span>
                        </li>
                      </ul>
                    </div>
                    <div className="md:w-1/2 bg-gradient-to-br from-gray-50 to-white p-6 flex items-center justify-center">
                      <motion.div 
                        className="relative w-full max-w-xs mx-auto"
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-sm font-medium text-gray-700">Connections</div>
                            <div className="text-xs text-primary">View All</div>
                          </div>
                          
                          <div className="space-y-3">
                            {["AWS", "Google Cloud", "Azure", "GitHub"].map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center text-xs font-medium mr-3">
                                    {item.substring(0, 2)}
                                  </div>
                                  <div className="text-sm font-medium text-gray-700">{item}</div>
                                </div>
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7.5rem] top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>
              
              <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-12 md:gap-16">
                <motion.div 
                  className="md:w-30 text-center order-1 md:order-2"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-15 h-15 rounded-full bg-teal-500 text-white flex items-center justify-center text-xl font-bold mx-auto relative z-10">
                    2
                  </div>
                  <h3 className="text-lg font-semibold mt-3 text-gray-900">Automate</h3>
                </motion.div>
                
                <motion.div 
                  className="flex-1 order-2 md:order-1"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    <div className="md:w-1/2 bg-gradient-to-br from-teal-50 to-white p-6 flex items-center justify-center order-2 md:order-1">
                      <motion.div 
                        className="relative w-full max-w-xs mx-auto"
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-sm font-medium text-gray-700">AI Assistant</div>
                            <div className="text-xs text-teal-500">In Progress</div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="p-3 bg-teal-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Question 5 of 27</div>
                              <div className="text-sm text-gray-800">Describe your password policy requirements...</div>
                            </div>
                            
                            <div className="p-3 bg-gray-50 rounded-lg relative">
                              <div className="text-xs text-gray-600 mb-1">AI Suggested Answer</div>
                              <div className="text-sm text-gray-800">Passwords require minimum 12 characters with complexity requirements...</div>
                              <div className="flex mt-2 space-x-2">
                                <div className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium">Accept</div>
                                <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Edit</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    
                    <div className="md:w-1/2 p-8 order-1 md:order-2">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Automates Your Responses</h3>
                      <p className="text-gray-600 mb-6">
                        Our AI analyzes your security posture and automatically suggests accurate responses to assessment questions.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">80% reduction in questionnaire completion time</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">AI learns from your previous responses</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">Human review workflow ensures accuracy</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-16">
                <motion.div 
                  className="md:w-30 text-center order-1 md:order-1"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-15 h-15 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold mx-auto relative z-10">
                    3
                  </div>
                  <h3 className="text-lg font-semibold mt-3 text-gray-900">Share</h3>
                </motion.div>
                
                <motion.div 
                  className="flex-1 order-2 md:order-2"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    <div className="md:w-1/2 p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Share Your Trust Portal</h3>
                      <p className="text-gray-600 mb-6">
                        Create a secure, branded trust portal to showcase your compliance status to potential customers.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">Customizable branding and access controls</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">Real-time compliance status updates</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">Detailed analytics on portal engagement</span>
                        </li>
                      </ul>
                    </div>
                    <div className="md:w-1/2 bg-gradient-to-br from-blue-50 to-white p-6 flex items-center justify-center">
                      <motion.div 
                        className="relative w-full max-w-xs mx-auto"
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium mr-2 text-blue-800">
                                C
                              </div>
                              <div className="text-sm font-medium text-gray-700">Compliance Portal</div>
                            </div>
                            <div className="text-xs text-blue-500">Published</div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium text-gray-700">ISO 27001</div>
                              <div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Compliant
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium text-gray-700">GDPR</div>
                              <div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Compliant
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium text-gray-700">SOC 2</div>
                              <div className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                In Progress
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" ref={pricingRef} className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent <span className="text-primary">pricing</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Choose the plan that works best for your business needs
            </p>
            
            {/* Pricing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <span className={`text-base ${!yearlyBilling ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Monthly
              </span>
              <motion.div 
                className="mx-4 relative inline-flex h-6 w-12 items-center rounded-full bg-gray-200 cursor-pointer"
                onClick={() => setYearlyBilling(!yearlyBilling)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="absolute h-5 w-5 rounded-full bg-white shadow-md"
                  animate={{ 
                    x: yearlyBilling ? 26 : 2,
                    backgroundColor: yearlyBilling ? "#0EA5E9" : "#FFFFFF" 
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                <motion.div 
                  className="absolute inset-0 rounded-full"
                  animate={{ 
                    backgroundColor: yearlyBilling ? "#0EA5E9" : "#E5E7EB"
                  }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
              <span className={`text-base flex items-center ${yearlyBilling ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Yearly
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  Save 20%
                </span>
              </span>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="p-8 pb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Free Plan</h3>
                <div className="flex items-baseline mb-5">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <p className="text-gray-600 mb-6">
                  Perfect for small teams just getting started with compliance.
                </p>
              </div>
              
              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {[
                    "Up to 5 assessments per year",
                    "Basic AI questionnaire assistant",
                    "Single compliance framework",
                    "Email support"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href="/dashboard" className="block w-full py-3 px-4 bg-white text-primary border-2 border-primary rounded-full text-center font-medium hover:bg-primary/5 transition-colors">
                    Get Started
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Pro Plan */}
            <motion.div 
              className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl overflow-hidden relative transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -5, boxShadow: "0 10px 40px -5px rgba(0, 0, 0, 0.3)" }}
            >
              {/* Popular badge */}
              <div className="absolute top-0 right-0">
                <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              </div>
              
              <div className="p-8 pb-0">
                <h3 className="text-lg font-semibold text-white mb-3">Pro Plan</h3>
                <div className="flex items-baseline mb-5">
                  <span className="text-4xl font-bold text-white">
                    ${yearlyBilling ? '79' : '99'}
                  </span>
                  <span className="text-gray-300 ml-2">/month</span>
                </div>
                <p className="text-gray-300 mb-6">
                  Ideal for growing businesses with multiple compliance needs.
                </p>
              </div>
              
              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {[
                    "Unlimited assessments",
                    "Advanced AI-powered automation",
                    "Multiple compliance frameworks",
                    "Custom trust portal",
                    "Priority support",
                    "API access"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href="/dashboard" className="block w-full py-3 px-4 bg-primary text-white rounded-full text-center font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                    Start Pro Trial
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-16 text-center text-gray-500 max-w-3xl mx-auto text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            Need a custom enterprise plan? <a href="#" className="text-primary font-medium hover:underline">Contact our sales team</a> for a tailored solution.
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" ref={faqRef} className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Garnet AI
            </p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="bg-white shadow-sm rounded-2xl divide-y divide-gray-100 border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {[
                {
                  question: "What compliance frameworks does Garnet AI support?",
                  answer: "Garnet AI supports all major compliance frameworks including ISO 27001, SOC 2, GDPR, HIPAA, PDPA, and more. We constantly update our platform to include new frameworks as they become relevant to our customers."
                },
                {
                  question: "How does the AI questionnaire assistant work?",
                  answer: "Our AI assistant uses machine learning to analyze your existing security documentation and previous responses. When a new questionnaire arrives, it can automatically suggest appropriate answers based on your security posture, saving you hours of manual work."
                },
                {
                  question: "Can I customize my trust portal?",
                  answer: "Yes! The Pro plan includes full customization options for your trust portal. You can add your branding, choose which compliance statuses to display, and set granular access controls for different customers or prospects."
                },
                {
                  question: "Is Garnet AI secure and compliant itself?",
                  answer: "Absolutely. We understand the irony of a compliance platform not being compliant itself. Garnet AI is ISO 27001 certified, SOC 2 compliant, and GDPR-ready. We use enterprise-grade encryption for all data and implement strict access controls."
                },
                {
                  question: "Can I import existing questionnaire responses?",
                  answer: "Yes, you can import your existing questionnaire responses and security documentation. This helps our AI learn your security posture faster and provide more accurate suggestions from day one."
                },
                {
                  question: "Do you offer enterprise-specific solutions?",
                  answer: "Yes, we offer custom enterprise plans for organizations with complex compliance needs. Contact our sales team for a personalized demo and custom pricing based on your specific requirements."
                }
              ].map((faq, index) => (
                <motion.div 
                  key={index}
                  className="overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <motion.button
                    className="flex justify-between items-center w-full px-6 py-5 text-left"
                    onClick={() => toggleFaq(index)}
                    whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: activeFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </motion.div>
                  </motion.button>
                  
                  <AnimatePresence>
                    {activeFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-gray-600">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-20 md:py-28 bg-gradient-to-r from-primary/10 to-blue-500/10 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Ready to accelerate your <span className="text-primary">compliance journey?</span>
            </motion.h2>
            
            <motion.p 
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Join hundreds of companies who are already saving time and closing deals faster with Garnet AI.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(14, 165, 233, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link href="/dashboard" className="px-8 py-4 bg-primary text-white rounded-full font-medium text-center shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
                  Start Your Free Trial
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link href="#" className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-medium text-center hover:bg-gray-50 transition-colors">
                  Schedule a Demo
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 md:px-6 pt-16 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="font-bold text-2xl mb-4">
                <span className="text-primary">Garnet</span>AI
              </div>
              <p className="text-gray-400 mb-4">
                Accelerate vendor onboarding with AI-powered compliance automation.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'linkedin', 'github'].map((social) => (
                  <a 
                    key={social}
                    href="#" 
                    className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Integrations', 'Roadmap', 'Changelog'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                {['About', 'Customers', 'Careers', 'Contact', 'Partners'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-3">
                {['Blog', 'Documentation', 'Help Center', 'Status', 'Security'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Garnet AI. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Home; 