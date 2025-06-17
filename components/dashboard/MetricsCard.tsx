'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils/formatters';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = ''
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'positive':
        return '↗';
      case 'negative':
        return '↘';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? formatCurrency(value, { abbreviate: true }) : value}
            </p>
            {trend && (
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {getTrendIcon()} {subtitle}
              </span>
            )}
          </div>
          {subtitle && !trend && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-8 h-8 text-gray-400">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;
