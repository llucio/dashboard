'use client';

import React, { useState } from 'react';
import { FundingOffice } from '@/lib/types/dashboard';
import { formatCurrency } from '@/lib/utils/formatters';

interface FundingOfficeSelectorProps {
  fundingOffices: FundingOffice[];
  selectedOffice: string | null;
  onChange: (office: string | null) => void;
  // Multiple selection support for stacked timeline
  timelineViewMode?: 'single' | 'stacked';
  selectedFundingOffices?: string[];
  onMultipleToggle?: (office: string) => void;
}

const FundingOfficeSelector: React.FC<FundingOfficeSelectorProps> = ({
  fundingOffices,
  selectedOffice,
  onChange,
  timelineViewMode = 'single',
  selectedFundingOffices = [],
  onMultipleToggle
}) => {
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const isStackedMode = timelineViewMode === 'stacked';

  const handleContextMenu = (e: React.MouseEvent, office: FundingOffice) => {
    e.preventDefault();
    setShowDetails(showDetails === office.name ? null : office.name);
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">
          Funding Offices
        </h4>
        {isStackedMode && (
          <span className="text-xs text-gray-500">
            {selectedFundingOffices.length} selected
          </span>
        )}
      </div>

      {/* All Offices Option - Available in both single and stacked modes */}
      <div
        className={`p-3 rounded-lg cursor-pointer transition-colors ${
          isStackedMode
            ? (selectedFundingOffices.length === fundingOffices.length
                ? 'bg-green-100 border-2 border-green-500'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent')
            : (selectedOffice === null
                ? 'bg-green-100 border-2 border-green-500'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent')
        }`}
        onClick={() => {
          if (isStackedMode && onMultipleToggle) {
            // Toggle all funding offices selection
            if (selectedFundingOffices.length === fundingOffices.length) {
              // If all are selected, deselect all
              fundingOffices.forEach(office => {
                if (selectedFundingOffices.includes(office.name)) {
                  onMultipleToggle(office.name);
                }
              });
            } else {
              // If not all are selected, select all
              fundingOffices.forEach(office => {
                if (!selectedFundingOffices.includes(office.name)) {
                  onMultipleToggle(office.name);
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
              checked={isStackedMode ? selectedFundingOffices.length === fundingOffices.length : selectedOffice === null}
              onChange={() => {}} // Handled by parent onClick
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-900">All Funding Offices</span>
          </div>
          <span className="text-xs text-gray-500">
            {formatCurrency(
              fundingOffices.reduce((sum, office) => sum + office.total_obligation, 0),
              { abbreviate: true }
            )}
          </span>
          </div>
        </div>

      {/* Individual Funding Offices */}
      {fundingOffices.slice(0, 15).map((office) => {
        const isSelected = isStackedMode
          ? selectedFundingOffices.includes(office.name)
          : selectedOffice === office.name;

        const handleClick = () => {
          if (isStackedMode && onMultipleToggle) {
            onMultipleToggle(office.name);
          } else {
            onChange(selectedOffice === office.name ? null : office.name);
          }
        };

        return (
          <div key={office.name} className="relative">
            <div
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
              onClick={handleClick}
              onContextMenu={(e) => handleContextMenu(e, office)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleClick}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                      {office.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[160px]">
                      {office.agency}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(office.total_obligation, { abbreviate: true })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, office);
                  }}
                  className={`text-xs ${showDetails === office.name ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Show details"
                >
                  {showDetails === office.name ? '✕' : 'ⓘ'}
                </button>
              </div>
            </div>

            {/* Details Card */}
            {showDetails === office.name && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-25 z-40"
                onClick={() => setShowDetails(null)}
              />
              {/* Modal */}
              <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{office.name}</h4>
                  <p className="text-sm text-gray-600">{office.agency}</p>
                  <p className="text-xs text-gray-500">{office.toptier_agency}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Obligation:</span>
                    <div className="font-medium">
                      {formatCurrency(office.total_obligation, { abbreviate: true })}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Awards:</span>
                    <div className="font-medium">{office.total_awards}</div>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 text-sm">Recent Awards:</span>
                  <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                    {office.awards.slice(0, 3).map((award, index) => (
                      <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="font-medium truncate">{award.id}</div>
                        <div className="text-gray-600 truncate">{award.recipient}</div>
                        <div className="text-gray-500">
                          {formatCurrency(award.amount, { abbreviate: true })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowDetails(null)}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                >
                  Close
                </button>
              </div>
              </div>
            </>
            )}
          </div>
        );
      })}

      {fundingOffices.length > 15 && (
        <div className="text-xs text-gray-500 text-center py-2">
          Showing top 15 funding offices
        </div>
      )}
    </div>
  );
};

export default FundingOfficeSelector;
