
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-garnet">Garnet</span>
          </Link>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex gap-6">
          <Link to="/dashboard" className="text-sm font-medium hover:text-garnet">Dashboard</Link>
          <Link to="/questionnaire" className="text-sm font-medium hover:text-garnet">Questionnaire</Link>
          <Link to="/trust-portal" className="text-sm font-medium hover:text-garnet">Trust Portal</Link>
          <Link to="/compliance" className="text-sm font-medium hover:text-garnet">Compliance</Link>
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          <Button variant="outline" className="border-garnet text-garnet hover:bg-garnet/5" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button className="bg-garnet hover:bg-garnet-dark text-white" asChild>
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 px-6 bg-white border-b">
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/dashboard" 
              className="text-sm font-medium hover:text-garnet"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/questionnaire" 
              className="text-sm font-medium hover:text-garnet"
              onClick={() => setMobileMenuOpen(false)}
            >
              Questionnaire
            </Link>
            <Link 
              to="/trust-portal" 
              className="text-sm font-medium hover:text-garnet"
              onClick={() => setMobileMenuOpen(false)}
            >
              Trust Portal
            </Link>
            <Link 
              to="/compliance" 
              className="text-sm font-medium hover:text-garnet"
              onClick={() => setMobileMenuOpen(false)}
            >
              Compliance
            </Link>
            <div className="flex flex-col space-y-2 pt-2">
              <Button variant="outline" className="w-full border-garnet text-garnet hover:bg-garnet/5" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button className="w-full bg-garnet hover:bg-garnet-dark text-white" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
