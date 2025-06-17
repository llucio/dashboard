// Utility functions for formatting data in the dashboard

export const formatCurrency = (value: number, options: { abbreviate?: boolean; decimals?: number } = {}): string => {
  const { abbreviate = false, decimals = 2 } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  if (abbreviate) {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(decimals)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(decimals)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(decimals)}K`;
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatFiscalPeriod = (fiscalYear: string, quarter: string): string => {
  return `FY${fiscalYear} Q${quarter}`;
};

export const calculatePercentChange = (current: number, previous: number): number | null => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

export const formatPercentage = (value: number | null, decimals = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals = 0): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getColorByIndex = (index: number): string => {
  const colors = [
    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', 
    '#858796', '#5a5c69', '#2e59d9', '#17a2b8', '#28a745'
  ];
  return colors[index % colors.length];
};

export const formatLargeNumber = (value: number): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Convert date range to fiscal year periods for USASpending API
export const convertToFiscalYearPeriods = (startDate: string, endDate: string): Array<{start_date: string, end_date: string}> => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const periods: Array<{start_date: string, end_date: string}> = [];

  // Get the fiscal year for the start date
  // US Fiscal Year runs from October 1 to September 30
  let currentFiscalYear = start.getMonth() >= 9 ? start.getFullYear() + 1 : start.getFullYear();

  // Get the fiscal year for the end date
  const endFiscalYear = end.getMonth() >= 9 ? end.getFullYear() + 1 : end.getFullYear();

  // Generate fiscal year periods
  while (currentFiscalYear <= endFiscalYear) {
    const fiscalStart = `${currentFiscalYear - 1}-10-01`;
    const fiscalEnd = `${currentFiscalYear}-09-30`;

    periods.push({
      start_date: fiscalStart,
      end_date: fiscalEnd
    });

    currentFiscalYear++;
  }

  return periods;
};

// Generate time periods based on selection type
export const generateTimePeriods = (
  startDate: string,
  endDate: string,
  isQuickSelection: boolean
): Array<{start_date: string, end_date: string}> => {
  if (isQuickSelection) {
    // For quick selections, use fiscal year periods
    return convertToFiscalYearPeriods(startDate, endDate);
  } else {
    // For custom date ranges, use single period
    return [{
      start_date: startDate,
      end_date: endDate
    }];
  }
};

// Generate quick selection date ranges with fiscal year periods
export const getQuickSelectionRange = (type: 'last5years' | 'last3years' | 'currentyear' | 'previousyear'): {
  startDate: string;
  endDate: string;
  isQuickSelection: boolean;
  quickSelectionType: 'last5years' | 'last3years' | 'currentyear' | 'previousyear';
} => {
  const currentYear = new Date().getFullYear();

  switch (type) {
    case 'last5years':
      return {
        startDate: `${currentYear - 5}-10-01`, // Start of FY 5 years ago
        endDate: `${currentYear + 1}-09-30`,   // End of current FY
        isQuickSelection: true,
        quickSelectionType: 'last5years'
      };
    case 'last3years':
      return {
        startDate: `${currentYear - 3}-10-01`, // Start of FY 3 years ago
        endDate: `${currentYear + 1}-09-30`,   // End of current FY
        isQuickSelection: true,
        quickSelectionType: 'last3years'
      };
    case 'currentyear':
      return {
        startDate: `${currentYear}-10-01`,     // Start of current FY
        endDate: `${currentYear + 1}-09-30`,   // End of current FY
        isQuickSelection: true,
        quickSelectionType: 'currentyear'
      };
    case 'previousyear':
      return {
        startDate: `${currentYear - 1}-10-01`, // Start of previous FY
        endDate: `${currentYear}-09-30`,       // End of previous FY
        isQuickSelection: true,
        quickSelectionType: 'previousyear'
      };
    default:
      // Default to last 5 years
      return {
        startDate: `${currentYear - 5}-10-01`,
        endDate: `${currentYear + 1}-09-30`,
        isQuickSelection: true,
        quickSelectionType: 'last5years'
      };
  }
};
