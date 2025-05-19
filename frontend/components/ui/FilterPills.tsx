import React from 'react';
import { cn } from '@/lib/utils';

interface FilterPillsProps<T extends string> {
  options: T[];
  selectedOption: T;
  onChange: (option: T) => void;
  className?: string;
  label?: string;
}

export function FilterPills<T extends string>({
  options,
  selectedOption,
  onChange,
  className = '',
  label = 'Filter options'
}: FilterPillsProps<T>) {
  return (
    <div 
      className={cn("flex flex-wrap gap-2", className)} 
      role="group" 
      aria-label={label}
    >
      {options.map(option => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "px-3 py-1 text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
            selectedOption === option
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
          aria-pressed={selectedOption === option}
        >
          {option}
        </button>
      ))}
    </div>
  );
} 