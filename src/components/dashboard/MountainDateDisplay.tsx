'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatDateLocalized } from '@/lib/date';
import DatePicker from './DatePicker';

interface MountainDateDisplayProps {
  mountainId: string;
  mountainName: string;
  hikedOn: string | null;
  onDateChange: (date: string | null) => Promise<void>;
}

export default function MountainDateDisplay({ 
  mountainId, 
  mountainName, 
  hikedOn, 
  onDateChange 
}: MountainDateDisplayProps) {
  const t = useTranslations();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = async (date: string | null) => {
    await onDateChange(date);
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    setShowDatePicker(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent mountain card toggle
    setShowDatePicker(true);
  };

  if (showDatePicker) {
    return (
      <div className="relative z-50">
        <DatePicker
          mountainId={mountainId}
          mountainName={mountainName}
          currentDate={hikedOn}
          onSave={handleDateChange}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-500 mt-1">
      {hikedOn ? (
        <span>
          {t('hikedOn')} {formatDateLocalized(hikedOn, 'en')} •{' '}
          <span
            onClick={handleEditClick}
            className="text-indigo-600 hover:text-indigo-500 underline cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`${t('editDate')} ${mountainName}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleEditClick(e as any);
              }
            }}
          >
            {t('editDate')}
          </span>
        </span>
      ) : (
        <span
          onClick={handleEditClick}
          className="text-indigo-600 hover:text-indigo-500 underline cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label={`${t('addDate')} ${mountainName}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleEditClick(e as any);
            }
          }}
        >
          {t('addDate')}
        </span>
      )}
    </div>
  );
}
