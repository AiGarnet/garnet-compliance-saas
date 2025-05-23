"use client";

import React, { useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import WaitlistForm from './WaitlistForm';
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
  Gauge
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

// Floating Scroll Indicator Component
const FloatingScrollIndicator = () => {
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((latest) => {
      setIsVisible(latest < 0.1);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: 2 }}
    >
      <div className="flex flex-col items-center space-y-2 text-gray-600">
        <MousePointer2 className="h-5 w-5" />
        <motion.div
          className="text-sm font-mono tracking-wider"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          scroll to explore
          <motion.span
            className="inline-block ml-1"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          >
            |
          </motion.span>
        </motion.div>
        <motion.div
          className="w-6 h-10 border-2 border-gray-300 rounded-full p-1"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-3 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

// Interactive Demo Section Component
const InteractiveDemo = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  const demoSteps = [
    {
      title: "Upload Your Security Documentation",
      description: "Simply drag and drop your existing security documents, policies, and certifications into GARNET.",
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
            See GARNET in
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

          <div className="lg:pl-8">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {demoSteps[activeStep].visual}
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl -z-10"
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Security Trust Section
const SecurityTrustSection = () => {
  const securityFeatures = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "SOC 2 Type II Compliant",
      description: "Enterprise-grade security controls audited by third-party firms",
      badge: "Certified"
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "End-to-End Encryption",
      description: "AES-256 encryption for data at rest and in transit",
      badge: "Military Grade"
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Zero Data Retention",
      description: "Your sensitive data is processed and never stored permanently",
      badge: "Privacy First"
    },
    {
      icon: <Server className="h-8 w-8" />,
      title: "Infrastructure Security",
      description: "Hosted on AWS with advanced DDoS protection and monitoring",
      badge: "Enterprise"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
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
          <p className="text-lg sm:text-xl text-purple-100 max-w-3xl mx-auto">
            Your compliance data deserves the highest level of protection. We've built GARNET with security as our foundation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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
                  <p className="text-purple-100 leading-relaxed text-sm sm:text-base flex-1">{feature.description}</p>
                </div>
              </div>
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-purple-200 mb-6 text-sm sm:text-base">
            Trusted by security teams at Fortune 500 companies
          </p>
          <motion.button 
            className="inline-flex items-center bg-white text-purple-900 px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-all group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Security Documentation
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// Integration Showcase Section
const IntegrationShowcase = () => {
  const integrations = [
    { name: "AWS", logo: "🔗", category: "Cloud" },
    { name: "Azure", logo: "☁️", category: "Cloud" },
    { name: "Google Cloud", logo: "🌐", category: "Cloud" },
    { name: "Slack", logo: "💬", category: "Communication" },
    { name: "Jira", logo: "📋", category: "Project Management" },
    { name: "GitHub", logo: "🐙", category: "Development" },
    { name: "Office 365", logo: "📄", category: "Productivity" },
    { name: "Salesforce", logo: "⚡", category: "CRM" },
    { name: "Okta", logo: "🔐", category: "Identity" },
    { name: "DocuSign", logo: "✍️", category: "Documents" },
    { name: "Zoom", logo: "📹", category: "Communication" },
    { name: "Kubernetes", logo: "⚙️", category: "Infrastructure" },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Seamless
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Integrations</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with your existing tools and automatically sync evidence from across your tech stack.
          </p>
        </motion.div>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.05 }}
            >
              <div className="bg-gray-50 rounded-2xl p-6 text-center hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="text-3xl mb-3">{integration.logo}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{integration.name}</h3>
                <p className="text-xs text-gray-500">{integration.category}</p>
              </div>
              
              {/* Connection line effect */}
              <motion.div
                className="absolute inset-0 border-2 border-purple-500 rounded-2xl opacity-0 group-hover:opacity-100"
                initial={{ scale: 0.8 }}
                whileHover={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          ))}
        </div>

        {/* API Documentation CTA */}
        <motion.div 
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center border border-purple-100"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Don't see your tool? No problem.
            </h3>
            <p className="text-gray-600 mb-6">
              Use our REST API to build custom integrations or request new connectors from our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all inline-flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Code className="mr-2 h-4 w-4" />
                API Documentation
              </motion.button>
              <motion.button 
                className="border-2 border-purple-200 text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-purple-50 transition-all inline-flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Request Integration
                <ArrowRight className="ml-2 h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const GarnetLandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const openWaitlist = () => {
    setIsWaitlistOpen(true);
  };

  const closeWaitlist = () => {
    setIsWaitlistOpen(false);
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
    }
  ];

  const testimonials = [
    {
      quote: "GARNET reduced our questionnaire response time from weeks to hours. The AI accuracy is incredible.",
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
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Floating Scroll Indicator */}
      <FloatingScrollIndicator />

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
              <span className="text-xl sm:text-2xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">GARNET</span>
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a href="#features" className="text-gray-600 hover:text-purple-600 transition-colors text-sm lg:text-base">Features</a>
              <a href="#demo" className="text-gray-600 hover:text-purple-600 transition-colors text-sm lg:text-base">Demo</a>
              <a href="#stats" className="text-gray-600 hover:text-purple-600 transition-colors text-sm lg:text-base">Impact</a>
              <a href="#testimonials" className="text-gray-600 hover:text-purple-600 transition-colors text-sm lg:text-base">Testimonials</a>
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
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <span className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6">
                AI-Powered Compliance Platform
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Accelerate Your
                <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent">
                  Compliance Journey
                </span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed">
                Transform weeks of manual work into hours with AI-powered compliance automation. 
                Close deals faster and build trust with automated questionnaire responses.
              </p>
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
              <motion.button 
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-purple-300 hover:text-purple-600 transition-all flex items-center justify-center group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </motion.button>
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
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Compliance Dashboard</h3>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Live</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <FileCheck className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600" />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">24</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Active Assessments</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Shield className="h-6 sm:h-8 w-6 sm:w-8 text-purple-600" />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">95%</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Compliance Score</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center justify-between">
                        <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-pink-600" />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">2.5h</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Avg. Response Time</p>
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
              Powerful Features for 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Modern Compliance</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to streamline compliance, build trust, and accelerate your business growth.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onHoverStart={() => setActiveFeature(index)}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{feature.description}</p>
                <div className="flex items-center text-purple-600 group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm font-medium">Learn more</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <div id="demo">
        <InteractiveDemo />
      </div>

      {/* Integration Showcase */}
      <IntegrationShowcase />

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
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered compliance platform adapts to various industries and regulatory requirements.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
              }
            ].map((industry, index) => (
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
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
          </div>

          {/* Bottom CTA */}
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className="text-gray-600 mb-6 text-lg">
              Don't see your industry? GARNET adapts to any compliance framework.
            </p>
            <motion.button 
              className="bg-white text-purple-600 border-2 border-purple-200 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all inline-flex items-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore All Use Cases
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Security Trust Section */}
      <SecurityTrustSection />

      {/* Interactive Statistics Section */}
      <section id="stats" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Proven Results That 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Drive Growth</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              See how GARNET transforms compliance workflows and accelerates business outcomes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-gray-600 font-medium text-sm sm:text-base">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
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
              Hear from compliance professionals who've transformed their workflows with GARNET.
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
                transition={{ duration: 0.6, delay: index * 0.1 }}
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
              We've Got the Answers 
              <span className="block sm:inline bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> You're Looking For</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
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
            <p className="text-gray-600 mb-6">Still have questions? We're here to help!</p>
            <motion.button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all inline-flex items-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Support
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
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
            <p className="text-lg sm:text-xl text-purple-100 max-w-3xl mx-auto mb-10">
              Join hundreds of companies already saving time and closing deals faster with GARNET's AI-powered compliance platform.
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
              <motion.button 
                className="border-2 border-white text-white px-6 sm:px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Schedule Demo
              </motion.button>
            </div>
            <p className="text-purple-200 text-sm mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Waitlist Form Modal */}
      <WaitlistForm isOpen={isWaitlistOpen} onClose={closeWaitlist} />
    </div>
  );
};

export default GarnetLandingPage; 