'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as echarts from 'echarts';
import { TimelineDataPoint } from '@/lib/types/dashboard';
import { formatCurrency, formatFiscalPeriod } from '@/lib/utils/formatters';

interface TimelineChartProps {
  data: TimelineDataPoint[];
  selectedAgency?: string | null;
  selectedFundingOffice?: string | null;
}

const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  selectedAgency,
  selectedFundingOffice
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const getChartTitle = useCallback((): string => {
    let title = 'Federal Spending Timeline';

    if (selectedAgency && selectedFundingOffice) {
      title += ` - ${selectedAgency} / ${selectedFundingOffice}`;
    } else if (selectedAgency) {
      title += ` - ${selectedAgency}`;
    } else if (selectedFundingOffice) {
      title += ` - ${selectedFundingOffice}`;
    }

    return title;
  }, [selectedAgency, selectedFundingOffice]);

  const getLineColor = useCallback((): string => {
    if (selectedAgency && selectedFundingOffice) {
      return '#e74a3b'; // Red for both selected
    } else if (selectedAgency) {
      return '#4e73df'; // Blue for agency selected
    } else if (selectedFundingOffice) {
      return '#1cc88a'; // Green for funding office selected
    }
    return '#36b9cc'; // Default teal
  }, [selectedAgency, selectedFundingOffice]);

  const getAreaColor = useCallback((opacity: number): string => {
    const color = getLineColor();
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }, [getLineColor]);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Initialize chart if not already done
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Prepare data for the chart
    const categories = data.map(item => 
      formatFiscalPeriod(item.time_period.fiscal_year, item.time_period.quarter)
    );
    
    const values = data.map(item => item.aggregated_amount);

    // Create the chart option
    const option: echarts.EChartsOption = {
      title: {
        text: getChartTitle(),
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params: unknown) {
          const param = Array.isArray(params) ? params[0] : params;
          return `
            <div>
              <strong>${param.name}</strong><br/>
              Spending: ${formatCurrency(param.value, { abbreviate: true })}
            </div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value: number) {
            return formatCurrency(value, { abbreviate: true });
          }
        }
      },
      series: [
        {
          name: 'Spending',
          type: 'line',
          data: values,
          smooth: false,
          lineStyle: {
            width: 3,
            color: getLineColor()
          },
          itemStyle: {
            color: getLineColor()
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: getAreaColor(0.3)
              },
              {
                offset: 1,
                color: getAreaColor(0.1)
              }
            ])
          },
          emphasis: {
            focus: 'series'
          }
        }
      ],
      animation: true,
      animationDuration: 1000
    };

    // Set the option
    // @ts-expect-error - ECharts type compatibility issue
    chartInstance.current.setOption(option, true);

    // Handle resize
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, selectedAgency, selectedFundingOffice, getAreaColor, getChartTitle, getLineColor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">No timeline data available</div>
          <div className="text-sm">Please select a market to view spending data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        ref={chartRef} 
        className="w-full h-96"
        style={{ minHeight: '400px' }}
      />
      
      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getLineColor() }}
          />
          <span>
            {selectedAgency && selectedFundingOffice 
              ? `${selectedAgency} / ${selectedFundingOffice}`
              : selectedAgency 
                ? selectedAgency
                : selectedFundingOffice
                  ? selectedFundingOffice
                  : 'All Agencies & Offices'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineChart;
