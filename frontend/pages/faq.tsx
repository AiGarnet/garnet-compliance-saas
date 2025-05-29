import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Plus,
  Minus,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';

const FaqPage = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How can AI help streamline my compliance process?",
      answer: "Garnet's AI automation reduces questionnaire response time by up to 80%, automatically analyzing your security posture and suggesting accurate responses. Our AI learns from your previous submissions and adapts to different compliance frameworks, transforming weeks of manual work into hours of intelligent automation."
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
    },
    {
      question: "What kind of support do you offer?",
      answer: "We provide comprehensive support including email and chat assistance for all users, priority support for Pro customers, and dedicated account management for Enterprise clients. Our team includes compliance experts who understand the nuances of various frameworks and can provide strategic guidance."
    },
    {
      question: "How secure is my compliance data with Garnet?",
      answer: "Security is our top priority. Garnet is SOC 2 compliant, ISO 27001 certified, and GDPR-ready. We use enterprise-grade encryption, implement strict access controls, and undergo regular security audits. Your compliance data is protected with the same standards you're working to achieve."
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <>
      <Head>
        <title>Frequently Asked Questions | Garnet</title>
        <meta name="description" content="Find answers to common questions about Garnet's AI-powered compliance platform" />
      </Head>
      
      <div className="min-h-screen bg-white">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Garnet</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Header Section with Background */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Frequently Asked 
                <span className="block sm:inline bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent"> Questions</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                Find answers to common questions about Garnet's AI-powered compliance platform.
              </p>
              <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <button
                    className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => toggleFaq(index)}
                  >
                    <span className="text-base sm:text-lg font-semibold text-gray-900 pr-8">{faq.question}</span>
                    <div className="flex-shrink-0">
                      {activeFaq === index ? (
                        <Minus className="h-6 w-6 text-purple-600" />
                      ) : (
                        <Plus className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {activeFaq === index && (
                    <div className="overflow-hidden">
                      <div className="px-6 pb-6">
                        <div className="w-full h-px bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 mb-4"></div>
                        <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-16 bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl shadow-sm border border-purple-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h3>
              <p className="text-gray-600 mb-6">Our team is here to help with any additional questions you may have.</p>
              <button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transition-all inline-flex items-center group"
              >
                Contact Support
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <footer className="py-10 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-600">© 2023 Garnet AI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default FaqPage; 