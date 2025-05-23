"use client";

import React from 'react';
import { motion } from 'framer-motion';

const MinimalFooter = () => {
  return (
    <section className="relative w-full min-h-screen bg-white overflow-hidden flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Custom CSS for blinking animation */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s steps(2, start) infinite;
        }
      `}</style>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-6xl mx-auto">
        {/* Main GARNET text with glow effect */}
        <div className="relative">
          {/* Blurred duplicate for glow effect - positioned behind */}
          <motion.h1
            className="absolute inset-0 text-[15vw] sm:text-[18vw] lg:text-[20vw] font-black tracking-tight leading-none select-none pointer-events-none"
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #EF4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'blur(40px)',
              opacity: 0.3,
              zIndex: -1,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            GARNET
          </motion.h1>

          {/* Main visible text */}
          <motion.h1
            className="text-[15vw] sm:text-[18vw] lg:text-[20vw] font-black tracking-tight leading-none select-none"
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #EF4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.2))',
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 1, 
              ease: "easeOut",
              delay: 0.2 
            }}
            whileHover={{
              scale: 1.02,
              filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.4))',
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
              }
            }}
          >
            GARNET
          </motion.h1>

          {/* Additional soft glow layer for extra depth */}
          <motion.div
            className="absolute inset-0 text-[15vw] sm:text-[18vw] lg:text-[20vw] font-black tracking-tight leading-none pointer-events-none"
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #EF4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'blur(60px)',
              opacity: 0.15,
              zIndex: -2,
            }}
            animate={{
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            GARNET
          </motion.div>
        </div>
        
        {/* Subtitle */}
        <motion.p
          className="mt-6 sm:mt-8 text-gray-500 text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium tracking-wide text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.8,
            ease: "easeOut" 
          }}
        >
          AI-Powered Compliance Platform
        </motion.p>
      </div>

      {/* Cursor Prompt inspired by Cawar */}
      <motion.div 
        className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm text-gray-400 font-mono tracking-widest z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 1.5,
          ease: "easeOut" 
        }}
      >
        <span>scroll to explore</span>
        <span className="animate-blink">|</span>
      </motion.div>
      
      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
      
      {/* Optional subtle ambient light effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, rgba(236, 72, 153, 0.02) 50%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.02) 0%, rgba(239, 68, 68, 0.01) 50%, transparent 70%)',
          }}
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>
    </section>
  );
};

export default MinimalFooter; 