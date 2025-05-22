import React from 'react';
import { cn } from '@/lib/utils';

// Define option shape for label/value pairs
export interface FilterOption<T extends string> {
  label: string;
  value: T;
}

// Props with generic T for the option type
interface FilterPillsProps<T extends string> {
  options: T[] | FilterOption<T>[];
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
  // Helper to determine if options are plain strings or label/value objects
  const isLabelValueOption = (option: T | FilterOption<T>): option is FilterOption<T> => {
    return typeof option === 'object' && 'label' in option && 'value' in option;
  };
  
  // Helper to get display text for an option
  const getOptionLabel = (option: T | FilterOption<T>): string => {
    return isLabelValueOption(option) ? option.label : String(option);
  };
  
  // Helper to get option value
  const getOptionValue = (option: T | FilterOption<T>): T => {
    return isLabelValueOption(option) ? option.value : option;
  };
  
  return (
    <div 
      className={cn("flex flex-wrap gap-2", className)} 
      role="group" 
      aria-label={label}
    >
      {options.map((option, index) => {
        const optionValue = getOptionValue(option);
        const optionLabel = getOptionLabel(option);
        
        return (
          <button
            key={index}
            onClick={() => onChange(optionValue)}
            className={cn(
              "px-3 py-1 text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
              selectedOption === optionValue
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            aria-pressed={selectedOption === optionValue}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
} 