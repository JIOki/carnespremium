'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown,
  Minus,
  LucideIcon
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  prefix?: string;
  suffix?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500',
    text: 'text-blue-600',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-500',
    text: 'text-green-600',
    trend: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'bg-yellow-500',
    text: 'text-yellow-600',
    trend: 'text-yellow-600'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-500',
    text: 'text-red-600',
    trend: 'text-red-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-500',
    text: 'text-purple-600',
    trend: 'text-purple-600'
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'bg-indigo-500',
    text: 'text-indigo-600',
    trend: 'text-indigo-600'
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  trend,
  color = 'blue',
  prefix = '',
  suffix = ''
}) => {
  const colors = colorClasses[color];

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUp className="w-4 h-4" />;
    if (trend === 'down') return <ArrowDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 bg-green-50';
    if (trend === 'down') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          
          {(change !== undefined || changeLabel) && (
            <div className="mt-2 flex items-center gap-1">
              {change !== undefined && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTrendColor()}`}>
                  {getTrendIcon()}
                  {Math.abs(change)}%
                </span>
              )}
              {changeLabel && (
                <span className="text-xs text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`${colors.bg} p-3 rounded-full`}>
            <Icon className={`w-6 h-6 text-white ${colors.icon.replace('bg-', 'text-')}`} />
          </div>
        )}
      </div>
    </div>
  );
};

interface MiniStatCardProps {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  prefix?: string;
  suffix?: string;
}

export const MiniStatCard: React.FC<MiniStatCardProps> = ({
  label,
  value,
  color = 'blue',
  prefix = '',
  suffix = ''
}) => {
  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} rounded-lg p-4`}>
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors.text}`}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
    </div>
  );
};

interface ProgressCardProps {
  title: string;
  value: number;
  max: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  showPercentage?: boolean;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  value,
  max,
  color = 'blue',
  showPercentage = true
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const colors = colorClasses[color];

  const getProgressColor = () => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-sm font-bold text-gray-900">
          {value.toLocaleString()} / {max.toLocaleString()}
        </p>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${getProgressColor()} h-2.5 rounded-full transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      
      {showPercentage && (
        <p className="text-xs text-gray-500 mt-1 text-right">
          {percentage.toFixed(1)}%
        </p>
      )}
    </div>
  );
};

interface ComparisonCardProps {
  title: string;
  current: number;
  previous: number;
  label?: string;
  prefix?: string;
  suffix?: string;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  title,
  current,
  previous,
  label = 'vs período anterior',
  prefix = '',
  suffix = ''
}) => {
  const difference = current - previous;
  const percentageChange = previous > 0 ? ((difference / previous) * 100) : 0;
  const isPositive = difference >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-sm font-medium text-gray-600 mb-3">{title}</p>
      
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Actual</p>
          <p className="text-2xl font-bold text-gray-900">
            {prefix}{current.toLocaleString()}{suffix}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Anterior</p>
          <p className="text-lg font-semibold text-gray-600">
            {prefix}{previous.toLocaleString()}{suffix}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-500">{label}</span>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(percentageChange).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
