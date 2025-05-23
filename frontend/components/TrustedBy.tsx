"use client";

import React from 'react';
import { motion } from 'framer-motion';

// Dummy logo component with different styles for better visual appeal
const Logo = ({ name, index }: { name: string; index: number }) => {
  // Alternate between different styling for visual variety
  const logoStyle = index % 4;
  
  return (
    <motion.div 
      className="flex items-center justify-center h-12 md:h-16 px-6 md:px-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
      whileHover={{ y: -2, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {logoStyle === 0 && (
        <div className="flex items-center text-gray-700 font-semibold text-sm md:text-base">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold mr-2">
            {name.charAt(0)}
          </div>
          {name}
        </div>
      )}
      
      {logoStyle === 1 && (
        <div className="flex items-center text-gray-700 font-semibold text-sm md:text-base">
          <div className="w-6 h-6 rounded-md bg-blue-500/20 mr-2"></div>
          {name}
        </div>
      )}
      
      {logoStyle === 2 && (
        <div className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 font-medium text-sm md:text-base">
          {name}
        </div>
      )}
      
      {logoStyle === 3 && (
        <div className="flex items-center text-gray-700 font-semibold text-sm md:text-base">
          <span className="bg-gray-100 px-2 py-1 rounded mr-1.5">{name.split(' ')[0]}</span>
          {name.split(' ')[1] || ''}
        </div>
      )}
    </motion.div>
  );
};

const TrustedBy = () => {
  // Add more dummy company logos for variety
  const logos = [
    "Acme Corp",
    "Globex",
    "Soylent",
    "Initech",
    "Umbrella",
    "Stark Ind",
    "Wayne Ent",
    "Cyberdyne",
    "Oscorp",
    "Hooli",
    "Pied Piper",
    "Massive Dyn"
  ];

  return (
    <section className="py-10 md:py-16 bg-gradient-to-b from-white to-gray-50/30">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg md:text-xl font-medium text-gray-700 opacity-90">
            People who trust and use the product seamlessly.
          </h3>
        </motion.div>

        {/* Desktop Infinite Scroll - hidden on mobile */}
        <div className="hidden md:block relative overflow-hidden">
          {/* Gradient overlay on sides for smooth fading effect */}
          <div className="absolute left-0 top-0 h-full w-40 bg-gradient-to-r from-gray-50/30 to-transparent z-10"></div>
          <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-gray-50/30 to-transparent z-10"></div>
          
          {/* First marquee - scrolling left to right */}
          <motion.div
            className="flex gap-6 md:gap-8 py-4"
            animate={{ 
              x: ["calc(-50%)", "0%"] 
            }}
            transition={{ 
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear"
            }}
            whileHover={{ animationPlayState: "paused" }}
          >
            {/* Duplicated logos to create the infinite effect */}
            {[...logos, ...logos].map((logo, index) => (
              <Logo key={`scroll-1-${index}`} name={logo} index={index} />
            ))}
          </motion.div>
          
          {/* Second marquee - scrolling right to left (alternate direction for visual interest) */}
          <motion.div
            className="flex gap-6 md:gap-8 py-4"
            animate={{ 
              x: ["0%", "calc(-50%)"] 
            }}
            transition={{ 
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear"
            }}
            whileHover={{ animationPlayState: "paused" }}
          >
            {/* Duplicated and reversed logos for variety */}
            {[...logos, ...logos].reverse().map((logo, index) => (
              <Logo key={`scroll-2-${index}`} name={logo} index={index} />
            ))}
          </motion.div>
        </div>

        {/* Mobile version - grid layout */}
        <div className="md:hidden">
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            {logos.slice(0, 6).map((logo, index) => (
              <motion.div 
                key={index} 
                className="flex justify-center"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Logo name={logo} index={index} />
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-6"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {logos.slice(6, 12).map((logo, index) => (
              <motion.div 
                key={index} 
                className="flex justify-center"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Logo name={logo} index={index + 6} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy; 