import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function SearchBar({
  id,
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  label
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">{label || `Search ${placeholder}`}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none search-icon">
          <Search className="h-4 w-4" />
        </div>
        <input
          id={id}
          type="search"
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-search-bg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 search-icon"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            <X className="h-4 w-4 hover:text-body-text" />
          </button>
        )}
      </div>
    </div>
  );
} 