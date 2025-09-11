'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatDateLocalized } from '@/lib/date';

interface DatePickerProps {
  mountainId: string;
  mountainName: string;
  currentDate: string | null;
  onSave: (date: string | null) => void;
  onCancel: () => void;
}

export default function DatePicker({ mountainId, mountainName, currentDate, onSave, onCancel }: DatePickerProps) {
  const t = useTranslations();
  const [selectedDate, setSelectedDate] = useState(currentDate || '');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsLoading(true);
    try {
      await onSave(selectedDate || null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsLoading(true);
    try {
      await onSave(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div 
      ref={pickerRef}
      className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-64"
      onClick={(e) => e.stopPropagation()} // Prevent event bubbling
    >
      <div className="space-y-3">
        <div>
          <label 
            htmlFor={`hiked_on_${mountainId}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('hikedOn')} {mountainName}
          </label>
          <input
            ref={inputRef}
            id={`hiked_on_${mountainId}`}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            max={new Date().toISOString().slice(0, 10)} // Prevent future dates
          />
        </div>
        
        <div className="flex gap-2">
          <span
            onClick={handleSave}
            className={`flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 cursor-pointer text-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`${t('save')} ${t('hikedOn')} ${mountainName}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isLoading) handleSave(e as any);
              }
            }}
          >
            {isLoading ? '...' : t('save')}
          </span>
          
          <span
            onClick={handleClear}
            className={`px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 cursor-pointer text-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`${t('clear')} ${t('hikedOn')} ${mountainName}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isLoading) handleClear(e as any);
              }
            }}
          >
            {t('clear')}
          </span>
          
          <span
            onClick={handleCancel}
            className={`px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 cursor-pointer text-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Cancel date picker"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isLoading) handleCancel(e as any);
              }
            }}
          >
            Cancel
          </span>
        </div>
      </div>
    </div>
  );
}
