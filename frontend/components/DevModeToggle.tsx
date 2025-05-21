import { useState, useEffect } from 'react';
import { Bug } from 'lucide-react';
import { isDevModeEnabled, toggleDevMode } from '@/lib/env-config';
import { cn } from '@/lib/utils';

export function DevModeToggle({ className }: { className?: string }) {
  const [isEnabled, setIsEnabled] = useState(false);
  
  useEffect(() => {
    // Initialize state from environment config
    setIsEnabled(isDevModeEnabled());
  }, []);
  
  const handleToggle = () => {
    const newValue = toggleDevMode();
    setIsEnabled(newValue);
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={handleToggle}
        className={cn(
          "px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors",
          isEnabled
            ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        )}
        aria-label={isEnabled ? "Disable developer mode" : "Enable developer mode"}
      >
        <Bug size={14} />
        <span>Dev Mode: {isEnabled ? "ON" : "OFF"}</span>
      </button>
    </div>
  );
} 