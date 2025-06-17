'use client';

import React, { useState, useEffect } from 'react';
import SandChart, { SandChartSeries } from './SandChart';
import { TimelineDataPoint } from '@/lib/types/dashboard';
import { formatFiscalPeriod } from '@/lib/utils/formatters';

interface StackedTimelineChartProps {
  selectedFundingOffices: string[];
  fundingOfficeTimelineData: Record<string, TimelineDataPoint[]>;
}

const StackedTimelineChart: React.FC<StackedTimelineChartProps> = ({
  selectedFundingOffices,
  fundingOfficeTimelineData
}) => {
  const [chartData, setChartData] = useState<Map<string, TimelineDataPoint[]>>(new Map());

  // Generate chart data based on selected funding offices
  useEffect(() => {
    const newChartData = new Map<string, TimelineDataPoint[]>();

    // Show timeline data for each selected funding office
    selectedFundingOffices.forEach(fundingOfficeName => {
      if (fundingOfficeTimelineData[fundingOfficeName]) {
        console.log(`📊 Adding timeline data for: ${fundingOfficeName}`);
        newChartData.set(fundingOfficeName, fundingOfficeTimelineData[fundingOfficeName]);
      }
    });

    console.log(`📊 Chart showing ${newChartData.size} funding offices`);
    setChartData(newChartData);
  }, [selectedFundingOffices, fundingOfficeTimelineData]);

  // Generate chart data for rendering
  const generateChartData = () => {
    if (chartData.size === 0) {
      return { series: [], legends: [] };
    }

    // Get all unique time periods from the chart data
    const allTimePeriods = new Set<string>();
    chartData.forEach(data => {
      data.forEach(point => {
        const period = formatFiscalPeriod(point.time_period.fiscal_year, point.time_period.quarter);
        allTimePeriods.add(period);
      });
    });

    const sortedPeriods = Array.from(allTimePeriods).sort();

    // Create series for each selected funding office
    const series: SandChartSeries[] = Array.from(chartData.entries())
      .map(([name, data]) => {
        const seriesData = sortedPeriods.map(period => {
          const dataPoint = data.find(point =>
            formatFiscalPeriod(point.time_period.fiscal_year, point.time_period.quarter) === period
          );
          return dataPoint ? dataPoint.aggregated_amount : 0;
        });

        return {
          name,
          type: 'line' as const,
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series' as const
          },
          data: seriesData
        };
      });

    return {
      series,
      legends: sortedPeriods
    };
  };

  const { series, legends } = generateChartData();

  return (
    <div className="w-full space-y-4">
      {/* Chart Header */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">
          Stacked Timeline Comparison
        </h3>

        {/* Selection Summary */}
        <div className="p-3 bg-blue-50 rounded-md">
          <div className="text-sm text-blue-800">
            <strong>Selected:</strong> {selectedFundingOffices.length} funding offices
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Use the sidebar controls to select multiple funding offices for comparison.
          </div>
          {selectedFundingOffices.length > 0 && (
            <div className="text-xs text-gray-600 mt-2">
              <strong>Funding Offices:</strong> {selectedFundingOffices.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-lg border">
        {series.length > 0 ? (
          <>
            <div className="mb-2 text-xs text-gray-500 text-center">
              📊 <strong>Stacked Timeline:</strong> Each funding office&apos;s spending over time
            </div>
            <SandChart
              height="500px"
              series={series}
              programLegends={legends}
              title={`Timeline Comparison - ${selectedFundingOffices.length} Funding Offices`}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No timeline data available</p>
            <p className="text-sm text-gray-400">
              Select funding offices from the sidebar to view their timeline comparison.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StackedTimelineChart;