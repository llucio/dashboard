'use client';

import React, { useState } from 'react';
import { Award, FundingOffice } from '@/lib/types/dashboard';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Table, BarChart3 } from 'lucide-react';

interface InvestmentSeriesProps {
  awards: Award[];
  fundingOffices?: FundingOffice[];
  selectedAgency?: string | null;
  selectedFundingOffice?: string | null;
}

const InvestmentSeries: React.FC<InvestmentSeriesProps> = ({
  awards,
  fundingOffices = [],
  selectedAgency,
  selectedFundingOffice
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Get awards for the selected funding office
  const getFilteredAwards = () => {
    let filteredAwards = awards;

    // Filter by agency if selected
    if (selectedAgency) {
      filteredAwards = filteredAwards.filter(award =>
        award["Awarding Agency"] === selectedAgency
      );
    }

    // Filter by funding office if selected
    if (selectedFundingOffice) {
      const selectedOffice = fundingOffices.find(office => office.name === selectedFundingOffice);
      if (selectedOffice) {
        // Get award IDs from the selected funding office
        const officeAwardIds = selectedOffice.awards.map(award => award.id);
        console.log(`Filtering by funding office: ${selectedFundingOffice}`);
        console.log(`Office award IDs:`, officeAwardIds);
        console.log(`Available awards:`, filteredAwards.map(a => a["Award ID"]));

        filteredAwards = filteredAwards.filter(award =>
          officeAwardIds.includes(award["Award ID"])
        );

        console.log(`Filtered awards count:`, filteredAwards.length);
      } else {
        console.log(`Funding office not found: ${selectedFundingOffice}`);
        // If funding office not found, return empty array
        filteredAwards = [];
      }
    }

    return filteredAwards;
  };

  const filteredAwards = getFilteredAwards();

  const getContractCategories = () => {
    const categories: Record<string, { count: number; total: number; awards: Award[] }> = {};
    
    filteredAwards.forEach(award => {
      const category = award["Awarding Agency"];
      if (!categories[category]) {
        categories[category] = { count: 0, total: 0, awards: [] };
      }
      categories[category].count++;
      categories[category].total += award["Award Amount"];
      categories[category].awards.push(award);
    });

    return Object.entries(categories)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  };

  const contractCategories = getContractCategories();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Investment Series</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAwards.length} contracts • Total: {formatCurrency(
              filteredAwards.reduce((sum, award) => sum + award["Award Amount"], 0),
              { abbreviate: true }
            )}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Table className="w-4 h-4 inline mr-1" />
            Table
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'chart'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            Chart
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Award ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAwards.slice(0, 10).map((award, index) => (
                <tr key={award["Award ID"]} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {award["Award ID"]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {award["Recipient Name"]}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatCurrency(award["Award Amount"], { abbreviate: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {award["Awarding Agency"]}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(award["Start Date"])}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-md truncate">
                      {award["Description"]}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAwards.length > 10 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing 10 of {filteredAwards.length} contracts
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 mb-4">Contract Categories by Agency</h4>
          {contractCategories.slice(0, 8).map((category) => {
            const percentage = (category.total / filteredAwards.reduce((sum, award) => sum + award["Award Amount"], 0)) * 100;
            return (
              <div key={category.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                    {category.name}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(category.total, { abbreviate: true })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.count} contracts
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {percentage.toFixed(1)}% of total
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvestmentSeries;
