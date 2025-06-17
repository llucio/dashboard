'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  isQuickSelection: boolean;
  quickSelectionType?: 'last5years' | 'last3years' | 'currentyear' | 'previousyear';
  onChange: (startDate: string, endDate: string, isQuickSelection: boolean, quickSelectionType?: 'last5years' | 'last3years' | 'currentyear' | 'previousyear') => void;
}

import { getQuickSelectionRange } from '@/lib/utils/formatters';

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  isQuickSelection,
  quickSelectionType,
  onChange
}) => {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Custom date selection
    onChange(e.target.value, endDate, false);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Custom date selection
    onChange(startDate, e.target.value, false);
  };

  const predefinedRanges: Array<{ label: string; type: 'last5years' | 'last3years' | 'currentyear' | 'previousyear' }> = [
    { label: 'Last 5 Years', type: 'last5years' },
    { label: 'Last 3 Years', type: 'last3years' },
    { label: 'Current Fiscal Year', type: 'currentyear' },
    { label: 'Previous Fiscal Year', type: 'previousyear' }
  ];

  const handlePredefinedRange = (type: 'last5years' | 'last3years' | 'currentyear' | 'previousyear') => {
    const range = getQuickSelectionRange(type);
    onChange(range.startDate, range.endDate, range.isQuickSelection, range.quickSelectionType);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Date Range</h3>
      </div>
      
      <div className="space-y-4">
        {/* Selection Type Indicator */}
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Current Selection:</strong> {isQuickSelection ? 'Fiscal Year Periods' : 'Custom Date Range'}
          {isQuickSelection && quickSelectionType && (
            <span className="ml-1">({predefinedRanges.find(r => r.type === quickSelectionType)?.label})</span>
          )}
        </div>

        {/* Quick Select */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Quick Select (Fiscal Years)
          </label>
          <div className="grid grid-cols-1 gap-1">
            {predefinedRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => handlePredefinedRange(range.type)}
                className={`text-left px-2 py-1 text-xs rounded transition-colors ${
                  isQuickSelection && quickSelectionType === range.type
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Inputs */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Custom Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="start-date" className="block text-xs font-medium text-gray-500 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                max={endDate}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !isQuickSelection ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs font-medium text-gray-500 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !isQuickSelection ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          {!isQuickSelection && (
            <div className="text-xs text-blue-600 mt-1">
              Custom range will use single time period: {startDate} to {endDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector;
