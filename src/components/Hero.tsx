
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="space-y-6 max-w-3xl">
        <h2 className="text-garnet font-bold text-2xl md:text-3xl">Garnet AI</h2>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          Simplify Security Compliance for Your Business
        </h1>
        <p className="mt-6 text-lg text-gray-600 md:text-xl max-w-2xl mx-auto">
          Automated compliance assessment and security posture monitoring to help your business stay secure and compliant.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Button className="bg-garnet hover:bg-garnet-dark text-white" asChild>
            <Link to="/login">Get Started</Link>
          </Button>
          <Button variant="outline" className="border-garnet text-garnet hover:bg-garnet/5">
            Request Demo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
