'use client';

import React from 'react';

interface MarketSelectorProps {
  markets: string[];
  selectedMarket: string;
  onChange: (market: string) => void;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({
  markets,
  selectedMarket,
  onChange
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="market-select" className="text-sm font-medium text-gray-700">
        Market:
      </label>
      <select
        id="market-select"
        value={selectedMarket}
        onChange={(e) => onChange(e.target.value)}
        className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {markets.map((market) => (
          <option key={market} value={market}>
            {market}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MarketSelector;
