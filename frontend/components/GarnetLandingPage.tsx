"use client";

import React, { useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import WaitlistForm from './WaitlistForm';
import IndustryRequestForm from './IndustryRequestForm';
import { 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Clock,
  TrendingUp,
  FileCheck,
  Globe,
  Lock,
  ChevronRight,
  Quote,
  ChevronDown,
  Plus,
  Minus,
  Building2,
  Heart,
  Code,
  ShoppingCart,
  Settings,
  Briefcase,
  MousePointer2,
  Play,
  Database,
  Cpu,
  CloudCog,
  Activity,
  Eye,
  Server,
  Layers,
  Command,
  Download,
  Upload,
  Sliders,
  Network,
  Gauge,
  Home
} from 'lucide-react';

// Counter component for animated statistics
const AnimatedCounter = ({ end, duration = 2, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Dynamic Navigation Hook
const useDynamicNavbar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when scrolling down past 100px
      if (currentScrollY > 100) {
        // Show navbar when scrolling up or when past threshold
        if (currentScrollY < lastScrollY || currentScrollY > 200) {
          setIsVisible(true);
        }
        // Hide navbar when scrolling down fast
        else if (currentScrollY > lastScrollY && currentScrollY > 300) {
          setIsVisible(false);
        }
      } else {
        // Hide navbar when at top
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  return isVisible;
};

// Security Trust Section
const SecurityTrustSection = () => {
  const securityFeatures = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "GDPR Compliant",
      description: "Get enterprise-grade compliance documentation and audit-ready reports that meet GDPR requirements",
      badge: "Certified"
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "End-to-End Encryption",
      description: "Receive military-grade AES-256 encrypted responses and documentation for maximum data protection",
      badge: "Military Grade"
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Zero Data Retention",
      description: "Enjoy complete privacy with instant processing - your sensitive data is never stored permanently",
      badge: "Privacy First"
    }
  ];

  return (
    <section id="security" className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Enterprise-Grade
            <span className="block sm:inline bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Security</span>
          </h2>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            Your compliance data deserves the highest level of protection. We have built Garnet with security as our foundation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="relative group h-full"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <span className="px-3 py-1 bg-purple-500/30 text-purple-200 text-xs font-medium rounded-full whitespace-nowrap">
                    {feature.badge}
                  </span>
                </div>
                <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-purple-100 leading-relaxed text-base flex-1">{feature.description}</p>
                </div>
              </div>
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </motion.div>
          ))}
        </div>

        {/* Security documentation button removed as requested */}
      </div>
    </section>
  );
};

// Interactive Demo Section Component
const InteractiveDemo = () => {
  /* Commented out to hide this section
  const [activeStep, setActiveStep] = useState(0);
  
  const demoSteps = [
    {
      title: "Upload Your Security Documentation",
      description: "Simply drag and drop your existing security documents, policies, and certifications into Garnet.",
      action: "Upload",
      icon: <Upload className="h-6 w-6" />,
      visual: (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-blue-700 font-medium">Drop files here or click to upload</p>
            <p className="text-blue-500 text-sm mt-2">Supports PDF, DOCX, and more</p>
          </div>
        </div>
      )
    },
    {
      title: "AI Analyzes Your Security Posture", 
      description: "Our advanced AI scans through your documentation and automatically maps your existing controls.",
      action: "Analyze",
      icon: <Cpu className="h-6 w-6" />,
      visual: (
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <div className="flex-1 h-2 bg-purple-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
              </div>
              <span className="text-purple-700 text-sm font-medium">75%</span>
            </div>
            <p className="text-purple-700 text-sm">Analyzing security controls...</p>
            <p className="text-purple-600 text-xs">Identified 47 controls across 12 domains</p>
          </div>
        </div>
      )
    },
    {
      title: "Generate Questionnaire Responses",
      description: "Receive accurate, contextual responses to compliance questionnaires in minutes, not weeks.",
      action: "Generate", 
      icon: <FileCheck className="h-6 w-6" />,
      visual: (
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">SOC 2 Response</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600">95% accuracy achieved</p>
              <div className="mt-2 flex space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Access Controls</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Encryption</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See Garnet in
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Action</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience how our AI transforms your compliance workflow in three simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {demoSteps.map((step, index) => (
              <motion.div
                key={index}
                className={`cursor-pointer transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-white p-6 rounded-2xl shadow-lg border-l-4 border-purple-500'
                    : 'p-6 hover:bg-white hover:rounded-2xl hover:shadow-md'
                }`}
                onClick={() => setActiveStep(index)}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeStep === index
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    {activeStep === index && (
                      <motion.button
                        className="mt-4 inline-flex items-center text-purple-600 font-medium hover:text-purple-700 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {step.action}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="relative">
            <motion.div 
              className="bg-white p-1 rounded-2xl shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {demoSteps.map((step, index) => (
                <div key={index} className={activeStep === index ? 'block' : 'hidden'}>
                  {step.visual}
                </div>
              ))}
            </motion.div>
            
            {/* Decorative elements */}
//             <motion.div 
//               className="absolute -top-6 -right-6 w-12 h-12 bg-purple-200 rounded-full opacity-70"
//               animate={{ 
//                 y: [0, -8, 0],
//                 scale: [1, 1.1, 1]
//               }}
//               transition={{ duration: 5, repeat: Infinity }}
//             />
//             <motion.div 
//               className="absolute -bottom-8 -left-8 w-16 h-16 bg-pink-200 rounded-full opacity-70"
//               animate={{ 
//                 y: [0, 8, 0],
//                 scale: [1, 1.15, 1]
//               }}
//               transition={{ duration: 6, repeat: Infinity }}
//             />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
//   */
  
//   // Return an empty fragment instead
//   return <></>;
// };

const GarnetLandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isIndustryFormOpen, setIsIndustryFormOpen] = useState(false);
  
  // Use the dynamic navbar hook
  const isNavVisible = useDynamicNavbar();

  const openWaitlist = () => {
    setIsWaitlistOpen(true);
  };

  const closeWaitlist = () => {
    setIsWaitlistOpen(false);
  };
  
  const openIndustryForm = () => {
    setIsIndustryFormOpen(true);
  };
  
  const closeIndustryForm = () => {
    setIsIndustryFormOpen(false);
  };

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "AI-Powered Automation",
      description: "Automatically complete compliance questionnaires with 95% accuracy using advanced AI models.",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Multi-Framework Support", 
      description: "Support for ISO 27001, SOC 2, GDPR, HIPAA, and 20+ other compliance frameworks.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-Time Analytics",
      description: "Track compliance status, identify gaps, and monitor progress with comprehensive dashboards.",
      color: "from-pink-500 to-red-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Trust Portal Sharing",
      description: "Share your compliance status securely with customers through branded trust portals.",
      color: "from-teal-500 to-blue-600"
    },
    {
      icon: <Briefcase className="h-8 w-8" />,
      title: "Vendor Onboarding Workflows",
      description: "Streamline vendor assessments with automated workflows designed for sales teams.",
      color: "from-indigo-500 to-purple-600"
    }
  ];

  const testimonials = [
    {
      quote: "Garnet reduced our questionnaire response time from weeks to hours. The AI accuracy is incredible.",
      author: "Sarah Chen",
      title: "CISO, TechCorp Inc.",
      avatar: "SC",
      rating: 5
    },
    {
      quote: "We closed 3 enterprise deals faster thanks to our professional trust portal. Game changer for sales.",
      author: "Michael Rodriguez", 
      title: "VP Sales, DataFlow Solutions",
      avatar: "MR",
      rating: 5
    },
    {
      quote: "The multi-framework support means we manage all our compliance requirements in one place.",
      author: "Emily Watson",
      title: "Compliance Manager, FinSecure",
      avatar: "EW", 
      rating: 5
    }
  ];

  const stats = [
    { value: 95, suffix: '%', label: 'Accuracy Rate' },
    { value: 80, suffix: '%', label: 'Time Reduction' },
    { value: 500, suffix: '+', label: 'Companies Trust Us' },
    { value: 25, suffix: '+', label: 'Frameworks Supported' }
  ];

  const faqs = [
    {
      question: "How can Garnet help streamline my compliance process?",
      answer: "Garnet AI automation reduces questionnaire response time by up to 80%, automatically analyzing your security posture and suggesting accurate responses. Our AI learns from your previous submissions and adapts to different compliance frameworks, transforming weeks of manual work into hours of intelligent automation."
    },
    {
      question: "Is Garnet difficult to integrate with existing systems?",
      answer: "Not at all! Garnet offers seamless integration with popular cloud services like AWS, Google Cloud, and Azure through secure API connectors. Our one-click integration process automatically collects evidence from your connected systems, and our team provides full support throughout the setup process."
    },
    {
      question: "What compliance frameworks does Garnet support?",
      answer: "Garnet supports 25+ major compliance frameworks including ISO 27001, SOC 2, GDPR, HIPAA, CCPA, PCI DSS, and many more. Our platform continuously updates to include new frameworks, ensuring you stay compliant as regulations evolve."
    },
    {
      question: "Do I need technical knowledge to use Garnet?",
      answer: "No technical expertise required! Garnet is designed for compliance professionals, not developers. Our intuitive interface guides you through the process, while our AI handles the complex analysis. We also provide comprehensive training and dedicated support to ensure your success."
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-shadow duration-300 ${
          isNavVisible ? 'shadow-lg' : ''
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isNavVisible ? 0 : -100, 
          opacity: isNavVisible ? 1 : 0 
        }}
        transition={{ 
          duration: 0.3, 
          ease: "easeInOut" 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <img 
                  src="/IconOnly_Transparent_NoBuffer.png" 
                  alt="Garnet Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Fallback to gradient logo if image fails to load
                    const img = e.currentTarget;
                    const fallback = img.nextElementSibling as HTMLElement;
                    if (fallback) {
                      img.style.display = 'none';
                      fallback.style.display = 'flex';
                    }
                  }}
                />
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg items-center justify-center hidden">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
              <span className="text-xl sm:text-2xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Garnet</span>
              </span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {/* <a href="#demo" className="text-gray-600 hover:text-purple-600 transition-colors text-sm lg:text-base">Demo</a> */}
              {/* <a href="#testimonials" className="text-gray-600 hover:text-purple-600 transition-colors text-sm lg:text-base">Testimonials</a> */}
              <motion.button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 lg:px-6 py-2 rounded-full hover:shadow-lg transition-all text-sm lg:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openWaitlist}
              >
                Join Waitlist
              </motion.button>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <motion.button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full hover:shadow-lg transition-all text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openWaitlist}
              >
                Join Waitlist
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-8 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-blue-300/15 to-purple-300/15 rounded-full blur-3xl"
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-pink-300/20 to-purple-300/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, 60, 0],
              y: [0, -40, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            {/* Global Compliance Banner */}
            <motion.div 
              className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 mb-8 shadow-lg border border-purple-100"
              whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Globe className="h-5 w-5 text-purple-600" />
              </motion.div>
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Built for US, EU, UK, Canada, Asia, Latin America, Australia, and NZ
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
                AI-Powered Vendor Onboarding
              </span>
              <motion.span 
                className="block bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                for Sales Teams
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Transform weeks of vendor compliance questionnaires into hours with{" "}
              <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI-powered automation
              </span>
              . Close deals 50% faster and eliminate back-and-forth with automated, accurate responses that build trust.
            </motion.p>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all flex items-center justify-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                onClick={openWaitlist}
            >
                Join Waitlist
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            {/* <motion.button 
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-purple-300 hover:text-purple-600 transition-all flex items-center justify-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </motion.button> */}
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
              className="relative max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 sm:p-8 shadow-2xl border border-purple-100">
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Vendor Onboarding Dashboard</h3>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Live</span>
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <FileCheck className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600" />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">24</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Active Vendor Assessments</p>
                    <p className="text-xs text-blue-600 mt-1">→ No more waiting on legal teams</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <Shield className="h-6 sm:h-8 w-6 sm:w-8 text-purple-600" />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">95%</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Response Accuracy</p>
                    <p className="text-xs text-purple-600 mt-1">→ Stay audit-ready, reduce back-and-forth</p>
                  </div>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-pink-600" />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">2.5h</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Avg. Response Time</p>
                    <p className="text-xs text-pink-600 mt-1">→ Close deals 50% faster</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything Sales Teams Need for 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Faster Vendor Onboarding</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Streamline compliance, build trust, and accelerate deal closure with AI-powered automation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-purple-200 ${
                  index === 4 ? 'md:col-span-2 xl:col-span-1' : ''
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                onHoverStart={() => setActiveFeature(index)}
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative p-6 h-full flex flex-col">
                  {/* Icon with animated background */}
                  <div className="relative mb-6">
                    <motion.div 
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg`}
                      whileHover={{ 
                        scale: 1.1, 
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                  {feature.icon}
                    </motion.div>
                    {/* Animated ring */}
                    <motion.div 
                      className={`absolute inset-0 w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} opacity-20`}
                      initial={{ scale: 1 }}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.1, 0.2]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    />
                </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-base text-gray-600 leading-relaxed mb-6 flex-grow">
                    {feature.description}
                  </p>
                  
                  {/* Learn more link with animated arrow */}
                  <motion.div 
                    className="flex items-center text-purple-600 font-medium text-sm"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <span>Learn more</span>
                    <motion.div
                      animate={{ x: activeFeature === index ? 4 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                  <ChevronRight className="h-4 w-4 ml-1" />
                    </motion.div>
                  </motion.div>
                </div>
                
                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Region Compliance Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-32 right-20 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.8, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-xl"
            animate={{ 
              x: [0, 60, 0],
              y: [0, -40, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-block px-4 py-2 bg-white/80 backdrop-blur-sm text-purple-700 rounded-full text-sm font-semibold mb-6 shadow-lg">
                🌍 Global Coverage
              </span>
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Worldwide Compliance 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent"> Coverage</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Built to handle compliance requirements across all major regions and frameworks with real-time updates and local expertise.
            </p>
          </motion.div>

          {/* Interactive world map style layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              { 
                region: "United States", 
                frameworks: ["SOC 2", "CCPA", "NIST"], 
                flag: "🇺🇸",
                color: "from-blue-500 to-blue-600",
                description: "Comprehensive US compliance frameworks"
              },
              { 
                region: "European Union", 
                frameworks: ["GDPR", "ISO 27001", "NIS2"], 
                flag: "🇪🇺",
                color: "from-purple-500 to-purple-600",
                description: "Complete EU regulatory compliance"
              },
              { 
                region: "Asia Pacific", 
                frameworks: ["PDPA", "PIPEDA", "Privacy Act"], 
                flag: "🌏",
                color: "from-green-500 to-green-600",
                description: "APAC data protection standards"
              },
              { 
                region: "Latin America", 
                frameworks: ["LGPD", "Local Privacy Laws"], 
                flag: "🌎",
                color: "from-pink-500 to-pink-600",
                description: "LATAM privacy regulations"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 50, rotateY: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -10,
                  scale: 1.05,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
              >
                {/* Card */}
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 overflow-hidden h-full">
                  {/* Animated background gradient */}
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    initial={{ scale: 0, rotate: 45 }}
                    whileHover={{ scale: 1.5, rotate: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                  
                  {/* Flag with floating animation */}
                  <motion.div 
                    className="text-5xl mb-4 inline-block"
                    animate={{ 
                      y: [0, -8, 0],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      delay: index * 0.5,
                      ease: "easeInOut"
                    }}
                    whileHover={{ 
                      scale: 1.2,
                      rotate: [0, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    {item.flag}
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors duration-300">
                    {item.region}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Frameworks with staggered animation */}
                  <div className="space-y-2">
                    {item.frameworks.map((framework, fIndex) => (
                      <motion.span 
                        key={fIndex}
                        className={`inline-block bg-gradient-to-r ${item.color} text-white px-3 py-1.5 rounded-full text-xs font-semibold mr-2 mb-2 shadow-md`}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ 
                          duration: 0.5, 
                          delay: index * 0.2 + fIndex * 0.1 
                        }}
                        whileHover={{ 
                          scale: 1.1
                        }}
                      >
                        {framework}
                      </motion.span>
                    ))}
                  </div>
                  
                  {/* Hover indicator */}
                  <motion.div 
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1 }}
                  >
                    <ChevronRight className="h-5 w-5 text-purple-600" />
                  </motion.div>
                </div>
                
                {/* Glow effect */}
                <motion.div 
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`}
                  initial={{ scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                />
              </motion.div>
            ))}
          </div>

          {/* Bottom stats with animated counters - REMOVED as requested */}
        </div>
      </section>

      {/* All in One Solution Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Optimized to Serve Every Use Case 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Across Industries</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our AI-powered compliance platform adapts to various industries and regulatory requirements.
            </p>
          </motion.div>

          {/* Horizontal scrolling animation container */}
          <div className="relative overflow-hidden py-4">
            {/* Row 1 */}
            <div className="mb-8 relative">
              <motion.div 
                className="flex space-x-6"
                animate={{ 
                  x: [0, -1800],
                }}
                transition={{
                  x: {
                    duration: 40,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "linear"
                  }
                }}
              >
                {/* First set of cards */}
                {[
                  {
                    name: "FinTech",
                    icon: <Building2 className="h-8 w-8" />,
                    description: "Banking, payments, and financial services compliance",
                    frameworks: ["PCI DSS", "SOX", "GDPR"]
                  },
                  {
                    name: "Healthcare",
                    icon: <Heart className="h-8 w-8" />,
                    description: "Medical data protection and patient privacy",
                    frameworks: ["HIPAA", "HITECH", "FDA"]
                  },
                  {
                    name: "SaaS/Tech",
                    icon: <Code className="h-8 w-8" />,
                    description: "Technology companies and software platforms",
                    frameworks: ["SOC 2", "ISO 27001", "GDPR"]
                  },
                  {
                    name: "E-Commerce",
                    icon: <ShoppingCart className="h-8 w-8" />,
                    description: "Online retail and payment processing",
                    frameworks: ["PCI DSS", "CCPA", "GDPR"]
                  },
                  {
                    name: "Manufacturing",
                    icon: <Settings className="h-8 w-8" />,
                    description: "Industrial and manufacturing operations",
                    frameworks: ["ISO 27001", "NIST", "SOC 2"]
                  },
                  {
                    name: "Consulting",
                    icon: <Briefcase className="h-8 w-8" />,
                    description: "Professional services and client data handling",
                    frameworks: ["SOC 2", "GDPR", "ISO 27001"]
                  },
                  // Duplicate the first set to create continuous loop
                  {
                    name: "FinTech",
                    icon: <Building2 className="h-8 w-8" />,
                    description: "Banking, payments, and financial services compliance",
                    frameworks: ["PCI DSS", "SOX", "GDPR"]
                  },
                  {
                    name: "Healthcare",
                    icon: <Heart className="h-8 w-8" />,
                    description: "Medical data protection and patient privacy",
                    frameworks: ["HIPAA", "HITECH", "FDA"]
                  },
                  {
                    name: "SaaS/Tech",
                    icon: <Code className="h-8 w-8" />,
                    description: "Technology companies and software platforms",
                    frameworks: ["SOC 2", "ISO 27001", "GDPR"]
                  },
                  {
                    name: "E-Commerce",
                    icon: <ShoppingCart className="h-8 w-8" />,
                    description: "Online retail and payment processing",
                    frameworks: ["PCI DSS", "CCPA", "GDPR"]
                  }
                ].map((industry, index) => (
                  <motion.div
                    key={index}
                    className="group relative w-64 flex-shrink-0"
                    whileHover={{ 
                      y: -15,
                      scale: 1.05,
                      zIndex: 10,
                      transition: { type: "spring", stiffness: 300, damping: 15 }
                    }}
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center relative overflow-hidden border border-gray-100 h-full">
                      {/* Background gradient blob */}
                      <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                      
                      {/* Icon container */}
                      <motion.div 
                        className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white relative z-10"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {industry.icon}
                      </motion.div>
                      
                      {/* Industry name */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">
                        {industry.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed relative z-10">
                        {industry.description}
                      </p>
                      
                      {/* Frameworks */}
                      <div className="flex flex-wrap justify-center gap-1 relative z-10">
                        {industry.frameworks.map((framework, fIndex) => (
                          <span 
                            key={fIndex}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                          >
                            {framework}
                          </span>
                        ))}
                      </div>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Row 2 - moves in opposite direction */}
            <div className="relative">
              <motion.div 
                className="flex space-x-6"
                animate={{ 
                  x: [-1800, 0],
                }}
                transition={{
                  x: {
                    duration: 45, // Slightly different speed for visual interest
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "linear"
                  }
                }}
              >
                {/* Second set of cards */}
                {[
                  {
                    name: "Government",
                    icon: <Building2 className="h-8 w-8" />,
                    description: "Ensuring compliance for public institutions and government agencies",
                    frameworks: ["FISMA", "FedRAMP", "NIST 800-53"]
                  },
                  {
                    name: "Education",
                    icon: <Layers className="h-8 w-8" />,
                    description: "Compliance with data privacy laws for students and academic institutions",
                    frameworks: ["FERPA", "COPPA", "ISO 27001"]
                  },
                  {
                    name: "Legal",
                    icon: <FileCheck className="h-8 w-8" />,
                    description: "Securing sensitive client data and adhering to confidentiality regulations",
                    frameworks: ["GDPR", "ABA Model Rules", "ISO 27701"]
                  },
                  {
                    name: "Real Estate",
                    icon: <Home className="h-8 w-8" />,
                    description: "Handling of sensitive financial and identity data in property transactions",
                    frameworks: ["AML", "GDPR", "CCPA"]
                  },
                  {
                    name: "Energy & Utilities",
                    icon: <Gauge className="h-8 w-8" />,
                    description: "Protecting infrastructure and operational data in critical industries",
                    frameworks: ["NERC CIP", "ISO 27001", "NIST"]
                  },
                  {
                    name: "Insurance",
                    icon: <Shield className="h-8 w-8" />,
                    description: "Compliance with financial, fraud, and customer data protection laws",
                    frameworks: ["GLBA", "GDPR", "SOC 2"]
                  },
                  // Duplicate the second set to create continuous loop
                  {
                    name: "Government",
                    icon: <Building2 className="h-8 w-8" />,
                    description: "Ensuring compliance for public institutions and government agencies",
                    frameworks: ["FISMA", "FedRAMP", "NIST 800-53"]
                  },
                  {
                    name: "Education",
                    icon: <Layers className="h-8 w-8" />,
                    description: "Compliance with data privacy laws for students and academic institutions",
                    frameworks: ["FERPA", "COPPA", "ISO 27001"]
                  },
                  {
                    name: "Legal",
                    icon: <FileCheck className="h-8 w-8" />,
                    description: "Securing sensitive client data and adhering to confidentiality regulations",
                    frameworks: ["GDPR", "ABA Model Rules", "ISO 27701"]
                  },
                  {
                    name: "Real Estate",
                    icon: <Home className="h-8 w-8" />,
                    description: "Handling of sensitive financial and identity data in property transactions",
                    frameworks: ["AML", "GDPR", "CCPA"]
                  }
                ].map((industry, index) => (
                  <motion.div
                    key={index}
                    className="group relative w-64 flex-shrink-0"
                    whileHover={{ 
                      y: -15,
                      scale: 1.05,
                      zIndex: 10,
                      transition: { type: "spring", stiffness: 300, damping: 15 }
                    }}
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center relative overflow-hidden border border-gray-100 h-full">
                      {/* Background gradient blob */}
                      <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                      
                      {/* Icon container */}
                      <motion.div 
                        className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white relative z-10"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {industry.icon}
                      </motion.div>
                      
                      {/* Industry name */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">
                        {industry.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed relative z-10">
                        {industry.description}
                      </p>
                      
                      {/* Frameworks */}
                      <div className="flex flex-wrap justify-center gap-1 relative z-10">
                        {industry.frameworks.map((framework, fIndex) => (
                          <span 
                            key={fIndex}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                          >
                            {framework}
                          </span>
                        ))}
                      </div>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Gradient overlay on edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>
          </div>

          {/* Bottom CTA */}
          {/* <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className="text-gray-600 mb-6 text-lg">
              Don't see your industry? Garnet adapts to any compliance framework.
            </p>
            <motion.button 
              className="bg-white text-purple-600 border-2 border-purple-200 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all inline-flex items-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openIndustryForm}
            >
              Add yours
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div> */}
        </div>
      </section>

      {/* Security Trust Section */}
      <SecurityTrustSection />

      {/* Testimonials Section - Commented Out */}
      {/* 
      <section id="testimonials" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Industry 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Leaders</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from compliance professionals who've transformed their workflows with Garnet.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-purple-300 mb-4" />
                <p className="text-gray-700 mb-6 leading-relaxed italic text-sm sm:text-base">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{testimonial.author}</div>
                    <div className="text-gray-600 text-sm truncate">{testimonial.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              We Have Got the Answers 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> You Are Looking For</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Quick answers to your AI-powered compliance automation questions.
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
                  className="w-full px-4 sm:px-6 py-4 sm:py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleFaq(index)}
                  whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                >
                  <span className="text-base sm:text-lg font-semibold text-gray-900 pr-4 sm:pr-8">{faq.question}</span>
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
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="w-full h-px bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 mb-4"></div>
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
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
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className="text-gray-600 mb-6">Still have questions? We are here to help!</p>
            <motion.a 
              href="mailto:rusha@garnetai.net"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all inline-flex items-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Support
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your 
              <span className="block">Compliance Process?</span>
            </h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto mb-10 leading-relaxed">
              Join hundreds of companies already saving time and closing deals faster with Garnet AI-powered compliance platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                className="bg-white text-purple-600 px-6 sm:px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all flex items-center justify-center group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openWaitlist}
              >
                Join Waitlist
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              {/* <motion.button 
                className="border-2 border-white text-white px-6 sm:px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Schedule Demo
              </motion.button> */}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Waitlist Form Modal */}
      <WaitlistForm isOpen={isWaitlistOpen} onClose={closeWaitlist} />

      {/* Industry Request Form Modal */}
      <IndustryRequestForm isOpen={isIndustryFormOpen} onClose={closeIndustryForm} />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-4 space-x-3">
                <img 
                  src="/IconOnly_Transparent_NoBuffer.png" 
                  alt="Garnet Logo" 
                  className="w-8 h-8 object-contain filter brightness-0 invert"
                />
                <span className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Garnet</span>
                </span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                AI-powered vendor onboarding platform that helps sales teams close deals 50% faster with automated compliance responses.
              </p>
            </div>

            {/* Support */}
            <div className="md:justify-self-end md:text-right">
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="mailto:rusha@garnetai.net" 
                    className="text-gray-300 hover:text-purple-400 transition-colors flex items-center md:justify-end"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Us
                  </a>
                </li>
                <li className="md:text-right"><a href="/privacy-policy" className="text-gray-300 hover:text-purple-400 transition-colors">Privacy Policy</a></li>
                <li className="md:text-right"><a href="/terms-of-service" className="text-gray-300 hover:text-purple-400 transition-colors">Terms and Conditions</a></li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-purple-400 transition-colors flex items-center md:justify-end">
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Garnet AI, Inc. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GarnetLandingPage; 