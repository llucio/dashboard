'use client';

import React from 'react';
import { Agency } from '@/lib/types/dashboard';
import { formatCurrency } from '@/lib/utils/formatters';

interface AgencySelectorProps {
  agencies: Agency[];
  selectedAgency: string | null;
  onChange: (agency: string | null) => void;
  // Multiple selection support for stacked timeline
  timelineViewMode?: 'single' | 'stacked';
  selectedAgencies?: string[];
  onMultipleToggle?: (agency: string) => void;
}

const AgencySelector: React.FC<AgencySelectorProps> = ({
  agencies,
  selectedAgency,
  onChange,
  timelineViewMode = 'single',
  selectedAgencies = [],
  onMultipleToggle
}) => {
  const isStackedMode = timelineViewMode === 'stacked';
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">
          Service Investment (Agencies)
        </h4>
        {isStackedMode && (
          <span className="text-xs text-gray-500">
            {selectedAgencies.length} selected
          </span>
        )}
      </div>

      {/* All Agencies Option - Available in both single and stacked modes */}
      <div
        className={`p-3 rounded-lg cursor-pointer transition-colors ${
          isStackedMode
            ? (selectedAgencies.length === agencies.length
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent')
            : (selectedAgency === null
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent')
        }`}
        onClick={() => {
          if (isStackedMode && onMultipleToggle) {
            // Toggle all agencies selection
            if (selectedAgencies.length === agencies.length) {
              // If all are selected, deselect all
              agencies.forEach(agency => {
                if (selectedAgencies.includes(agency.name)) {
                  onMultipleToggle(agency.name);
                }
              });
            } else {
              // If not all are selected, select all
              agencies.forEach(agency => {
                if (!selectedAgencies.includes(agency.name)) {
                  onMultipleToggle(agency.name);
                }
              });
            }
          } else {
            onChange(null);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isStackedMode ? (selectedAgencies.length === agencies.length) : selectedAgency === null}
              onChange={() => {}} // Handled by parent onClick
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-900">All Agencies</span>
          </div>
          <span className="text-xs text-gray-500">
            {formatCurrency(
              agencies.reduce((sum, agency) => sum + agency.amount, 0),
              { abbreviate: true }
            )}
          </span>
        </div>
      </div>

      {/* Individual Agencies */}
      {agencies.slice(0, 10).map((agency) => {
        const isSelected = isStackedMode
          ? selectedAgencies.includes(agency.name)
          : selectedAgency === agency.name;

        const handleClick = () => {
          if (isStackedMode && onMultipleToggle) {
            onMultipleToggle(agency.name);
          } else {
            onChange(selectedAgency === agency.name ? null : agency.name);
          }
        };

        return (
          <div
            key={agency.id}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              isSelected
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
            onClick={handleClick}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleClick}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                    {agency.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(agency.amount, { abbreviate: true })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {agencies.length > 10 && (
        <div className="text-xs text-gray-500 text-center py-2">
          Showing top 10 agencies
        </div>
      )}
    </div>
  );
};

export default AgencySelector;
