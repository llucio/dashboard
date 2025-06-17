'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardDataService } from '@/lib/services/dashboard-data';
import { marketDefinitionService } from '@/lib/services/market-definition';

export default function TestPage() {
  const [testResults, setTestResults] = useState<Array<{test: string; status: string; data: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const results = [];

      try {
        // Test 1: Market Definition Service
        console.log('Testing Market Definition Service...');
        const markets = marketDefinitionService.getAllMarkets();
        results.push({
          test: 'Market Definition Service',
          status: 'PASS',
          data: `Found ${markets.length} markets: ${markets.join(', ')}`
        });

        // Test 2: Get PSC codes for a market
        const pscCodes = marketDefinitionService.getMarketPscCodes('Electronic Warfare');
        results.push({
          test: 'PSC Codes Retrieval',
          status: 'PASS',
          data: `Electronic Warfare PSC codes: ${JSON.stringify(pscCodes)}`
        });

        // Test 3: Dashboard Data Service - Market Overview
        console.log('Testing Dashboard Data Service...');
        const marketOverview = await dashboardDataService.getMarketOverview('Electronic Warfare');
        results.push({
          test: 'Market Overview Data',
          status: 'PASS',
          data: `Market: ${marketOverview.marketName}, Total Size: $${(marketOverview.totalMarketSize / 1000000000).toFixed(2)}B, YoY Growth: ${marketOverview.yoyGrowth.toFixed(1)}%, Timeline Points: ${marketOverview.timelineData.length}, Agencies: ${marketOverview.agencyBreakdown.length}, Awards: ${marketOverview.topAwards.length}`
        });

        // Test 4: Funding Office Analysis
        const fundingOfficeData = await dashboardDataService.getFundingOfficeAnalysis('Electronic Warfare');
        results.push({
          test: 'Funding Office Analysis',
          status: 'PASS',
          data: `Funding Offices: ${fundingOfficeData.fundingOffices.length}, Agencies: ${fundingOfficeData.officesByAgency.length}`
        });

      } catch (error) {
        results.push({
          test: 'Error occurred',
          status: 'FAIL',
          data: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      setTestResults(results);
      setLoading(false);
    };

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Running tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Test Results</h1>
          
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'PASS'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{result.test}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      result.status === 'PASS'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{result.data}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Test Summary</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {testResults.filter(r => r.status === 'PASS').length} of {testResults.length} tests passed
                </p>
              </div>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
