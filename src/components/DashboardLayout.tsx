
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Home, FileQuestion, Shield, CheckCircle, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

const SidebarItem = ({ to, icon: Icon, label, active }: SidebarItemProps) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
      active ? 'bg-garnet/10 text-garnet' : 'hover:bg-gray-100'
    }`}
  >
    <Icon size={18} className={active ? "text-garnet" : "text-gray-600"} />
    <span className={active ? "font-medium" : "text-gray-700"}>{label}</span>
  </Link>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const sidebarItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/questionnaire', icon: FileQuestion, label: 'Questionnaire' },
    { to: '/trust-portal', icon: Shield, label: 'Trust Portal' },
    { to: '/compliance', icon: CheckCircle, label: 'Compliance' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white hidden md:block p-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                to={item.to} 
                icon={item.icon} 
                label={item.label} 
                active={currentPath === item.to}
              />
            ))}
          </div>
          
          <div className="pt-6 mt-6 border-t">
            <SidebarItem 
              to="/settings" 
              icon={Settings} 
              label="Settings" 
              active={currentPath === '/settings'} 
            />
            <button className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
              <LogOut size={18} className="text-gray-600" />
              <span>Log out</span>
            </button>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
