
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">Garnet AI</h3>
            <p className="text-gray-600">
              Simplifying security compliance for businesses of all sizes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-garnet">About</a></li>
              <li><a href="#" className="text-gray-600 hover:text-garnet">Careers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-garnet">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-garnet">Documentation</a></li>
              <li><a href="#" className="text-gray-600 hover:text-garnet">Help Center</a></li>
              <li><a href="#" className="text-gray-600 hover:text-garnet">Compliance Guides</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-garnet">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-garnet">Terms of Service</a></li>
              <li><a href="#" className="text-gray-600 hover:text-garnet">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-gray-600">© {new Date().getFullYear()} Garnet AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
