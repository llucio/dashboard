'use client';

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { formatCurrency } from '@/lib/utils/formatters';

export interface SandChartSeries {
  name: string;
  type: 'line';
  stack: string;
  areaStyle: object;
  emphasis: {
    focus: 'series';
  };
  data: number[];
}

interface SandChartProps {
  height?: string;
  series: SandChartSeries[];
  programLegends: string[];
  title?: string;
}

const SandChart: React.FC<SandChartProps> = ({
  height = '400px',
  series,
  programLegends,
  title = 'Stacked Timeline Comparison'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !series || series.length === 0) return;

    // Initialize chart if not already done
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Generate colors for each series
    const colors = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#ff9f7f',
      '#87ceeb', '#dda0dd', '#98fb98', '#f0e68c', '#ff6347'
    ];

    // Create the chart option
    const option: echarts.EChartsOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params: unknown) {
          if (!Array.isArray(params)) return '';

          let result = `<strong>${params[0].name}</strong><br/>`;
          let total = 0;

          params.forEach((param: unknown) => {
            const p = param as { marker: string; seriesName: string; value: number };
            result += `${p.marker} ${p.seriesName}: ${formatCurrency(p.value, { abbreviate: true })}<br/>`;
            total += p.value || 0;
          });

          result += `<hr style="margin: 4px 0;"/><strong>Total: ${formatCurrency(total, { abbreviate: true })}</strong>`;
          return result;
        }
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        left: 'center',
        top: 'bottom',
        data: series.map(s => s.name)
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: programLegends,
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
      color: colors,
      series: series.map((s) => ({
        ...s,
        smooth: false,
        lineStyle: {
          width: 2
        },
        areaStyle: {
          opacity: 0.6
        },
        emphasis: {
          focus: 'series',
          areaStyle: {
            opacity: 0.8
          }
        }
      })),
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };

    // Set the option
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartInstance.current.setOption(option as any, true);

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
  }, [series, programLegends, title]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (!series || series.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-lg mb-2">No data available</div>
          <div className="text-sm">Select agencies or funding offices to compare</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        ref={chartRef} 
        className="w-full"
        style={{ height }}
      />
    </div>
  );
};

export default SandChart;
