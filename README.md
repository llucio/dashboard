This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---------------------------------------------------------------------------------------------------------------------
Comprehensive Dashboard Implementation Strategy
Here's a complete strategy for implementing your federal spending dashboard covering 2020-2025, with all required endpoints, sample requests, and data integration approaches.

1. Dashboard Architecture
Data Flow Architecture
Data Collection Layer: API clients for USASpending endpoints
Data Processing Layer: Aggregation, transformation, and caching
Visualization Layer: Charts, tables, and interactive elements
Key Components
Market definition service
Data fetching services
Caching mechanism
Visualization components
2. Core API Endpoints & Sample Requests
A. Timeline Data (Spending Over Time)
async function getTimelineData(marketPscCodes, startDate = '2020-01-01', endDate = '2025-09-30') {
  const response = await fetch('https://usaspending.mindsteps.com.mx/api/v2/search/spending_over_time/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group: "quarter", // Options: fiscal_year, quarter, month
      filters: {
        time_period: [
          {start_date: startDate, end_date: endDate}
        ],
        award_type_codes: ["A", "B", "C", "D"], // Contract award types
        psc_codes: {
          require: marketPscCodes // Example: [["Product", "5840"], ["Product", "1040"]]
        }
      },
      subawards: false
    })
  });
  
  return await response.json();
}

/* Sample Response:
{
  "group": "quarter",
  "results": [
    {
      "time_period": {
        "fiscal_year": "2020",
        "quarter": "1"
      },
      "aggregated_amount": 1234567890.12
    },
    {
      "time_period": {
        "fiscal_year": "2020",
        "quarter": "2"
      },
      "aggregated_amount": 2345678901.23
    },
    // Additional quarters...
  ]
}
*/

B. Agency Breakdown (Spending by Category)

async function getAgencyBreakdown(marketPscCodes, startDate = '2020-01-01', endDate = '2025-09-30') {
  const response = await fetch('https://usaspending.mindsteps.com.mx/api/v2/search/spending_by_category/awarding_agency/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        time_period: [
          {start_date: startDate, end_date: endDate}
        ],
        award_type_codes: ["A", "B", "C", "D"],
        psc_codes: {
          require: marketPscCodes
        }
      },
      limit: 10
    })
  });
  
  return await response.json();
}

/* Sample Response:
{
  "category": "awarding_agency",
  "results": [
    {
      "amount": 123456789012.34,
      "name": "Department of Defense",
      "code": "097",
      "id": 1173
    },
    {
      "amount": 23456789012.34,
      "name": "Department of Homeland Security",
      "code": "070",
      "id": 1456
    },
    // Additional agencies...
  ]
}
*/

C. Award Listings (Spending by Award)

async function getAwardsList(marketPscCodes, page = 1, limit = 100, startDate = '2020-01-01', endDate = '2025-09-30') {
  const response = await fetch('https://usaspending.mindsteps.com.mx/api/v2/search/spending_by_award/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        time_period: [
          {start_date: startDate, end_date: endDate}
        ],
        award_type_codes: ["A", "B", "C", "D"],
        psc_codes: {
          require: marketPscCodes
        }
      },
      fields: [
        "Award ID", 
        "Recipient Name", 
        "Award Amount", 
        "Description", 
        "Start Date", 
        "End Date", 
        "Awarding Agency", 
        "Funding Agency",
        "generated_internal_id"
      ],
      page: page,
      limit: limit,
      sort: "Award Amount",
      order: "desc"
    })
  });
  
  return await response.json();
}

/* Sample Response:
{
  "limit": 100,
  "results": [
    {
      "internal_id": 168586000,
      "Award ID": "W91ZLK24P0063",
      "Recipient Name": "RAYTHEON COMPANY",
      "Award Amount": 18800000.0,
      "Description": "RADAR EQUIPMENT DEVELOPMENT",
      "Start Date": "2024-08-27",
      "End Date": "2025-08-26",
      "Awarding Agency": "Department of Defense",
      "Funding Agency": "Department of Defense",
      "generated_internal_id": "CONT_AWD_W91ZLK24P0063_9700_-NONE-_-NONE-"
    },
    // Additional awards...
  ],
  "page_metadata": {
    "page": 1,
    "hasNext": true,
    "last_record_unique_id": 168551000,
    "last_record_sort_value": "W91YTZ24F0232"
  }
}
*/

D. Award Details (Including Funding Office)

async function getAwardDetails(generatedInternalId) {
  const response = await fetch(`https://usaspending.mindsteps.com.mx/api/v2/awards/${generatedInternalId}/`);
  return await response.json();
}

/* Sample Response:
{
  "id": 118714000,
  "generated_unique_award_id": "CONT_AWD_FA873021F0070_9700_SPRBL115D0017_9700",
  "piid": "FA873021F0070",
  "category": "contract",
  "type": "C",
  "type_description": "DELIVERY ORDER",
  "description": "LIGHTWEIGHT DEPLOYABLE GROUND CONTROLLED APPROACH REFURB",
  "total_obligation": 51229852.4,
  "funding_agency": {
    "id": 1196,
    "has_agency_page": true,
    "toptier_agency": {
      "name": "Department of Defense",
      "code": "097",
      "abbreviation": "DOD",
      "slug": "department-of-defense"
    },
    "subtier_agency": {
      "name": "Department of the Air Force",
      "code": "5700",
      "abbreviation": "USAF"
    },
    "office_agency_name": "F2BDDL AFLCMC HBAN"
  },
  // Additional fields...
}
*/

E. Funding Office Aggregation

async function getFundingOfficeBreakdown(marketPscCodes, startDate = '2020-01-01', endDate = '2025-09-30', limit = 100) {
  // Step 1: Get awards for the market
  const awardsData = await getAwardsList(marketPscCodes, 1, limit, startDate, endDate);
  
  // Step 2: Get details for each award to extract funding offices
  const fundingOffices = {};
  
  for (const award of awardsData.results) {
    const awardDetails = await getAwardDetails(award.generated_internal_id);
    
    if (awardDetails.funding_agency?.office_agency_name) {
      const officeName = awardDetails.funding_agency.office_agency_name;
      const officeKey = `${awardDetails.funding_agency.subtier_agency.code}_${officeName}`;
      
      if (!fundingOffices[officeKey]) {
        fundingOffices[officeKey] = {
          name: officeName,
          agency: awardDetails.funding_agency.subtier_agency.name,
          agency_code: awardDetails.funding_agency.subtier_agency.code,
          toptier_agency: awardDetails.funding_agency.toptier_agency.name,
          total_awards: 0,
          total_obligation: 0,
          awards: []
        };
      }
      
      fundingOffices[officeKey].total_awards++;
      fundingOffices[officeKey].total_obligation += award["Award Amount"] || 0;
      fundingOffices[officeKey].awards.push({
        id: award["Award ID"],
        amount: award["Award Amount"],
        description: award["Description"],
        recipient: award["Recipient Name"]
      });
    }
  }
  
  return Object.values(fundingOffices).sort((a, b) => b.total_obligation - a.total_obligation);
}

3. Market Definition Service

class MarketDefinitionService {
  constructor() {
    this.markets = {
      "Electronic Warfare": [
        ["Product", "1040"], // Directed Energy Weapons
        ["Product", "5840"], // Radar Equipment
        ["Product", "5865"]  // Electronic Countermeasures
      ],
      "Cybersecurity": [
        ["Product", "7010"], // Computer Equipment
        ["Product", "7030"], // Software
        ["Product", "D310"]  // IT Security Services
      ],
      "Artificial Intelligence": [
        ["Product", "7030"], // Software
        ["Product", "7035"], // AI Hardware
        ["Product", "D302"], // IT Systems Development
        ["Product", "D307"]  // IT Strategy and Architecture
      ],
      "Unmanned Systems": [
        ["Product", "1000"], // Weapons
        ["Product", "1550"], // Unmanned Aircraft
        ["Product", "1710"], // Aircraft Components
        ["Product", "2355"]  // Ground Vehicles
      ],
      "Space Systems": [
        ["Product", "1810"], // Space Vehicles
        ["Product", "5810"], // Communications Security Equipment
        ["Product", "5865"]  // Electronic Countermeasures
      ]
    };
    
    this.pscDescriptions = {
      "1040": "Directed Energy Weapons",
      "5840": "Radar Equipment",
      "5865": "Electronic Countermeasures",
      // Add other PSC descriptions...
    };
  }
  
  getMarketPscCodes(marketName) {
    return this.markets[marketName] || [];
  }
  
  getAllMarkets() {
    return Object.keys(this.markets);
  }
  
  getPscDescription(pscCode) {
    return this.pscDescriptions[pscCode] || "Unknown";
  }
}

4. Dashboard Data Integration Service

class DashboardDataService {
  constructor() {
    this.marketService = new MarketDefinitionService();
    this.cache = new CacheService(24 * 60 * 60 * 1000); // 24-hour cache
  }
  
  async getMarketOverview(marketName, startDate = '2020-01-01', endDate = '2025-09-30') {
    const cacheKey = `market_overview_${marketName}_${startDate}_${endDate}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const pscCodes = this.marketService.getMarketPscCodes(marketName);
    
    // Parallel data fetching for better performance
    const [timelineData, agencyData, topAwardsData] = await Promise.all([
      getTimelineData(pscCodes, startDate, endDate),
      getAgencyBreakdown(pscCodes, startDate, endDate),
      getAwardsList(pscCodes, 1, 10, startDate, endDate)
    ]);
    
    // Calculate total market size
    const totalMarketSize = agencyData.results.reduce((sum, agency) => sum + agency.amount, 0);
    
    // Calculate year-over-year growth
    const yearlyTotals = {};
    timelineData.results.forEach(item => {
      const year = item.time_period.fiscal_year;
      yearlyTotals[year] = (yearlyTotals[year] || 0) + item.aggregated_amount;
    });
    
    const years = Object.keys(yearlyTotals).sort();
    const yoyGrowth = years.length > 1 ? 
      (yearlyTotals[years[years.length-1]] / yearlyTotals[years[years.length-2]] - 1) * 100 : 0;
    
    const result = {
      marketName,
      totalMarketSize,
      yoyGrowth,
      timelineData: timelineData.results,
      agencyBreakdown: agencyData.results,
      topAwards: topAwardsData.results
    };
    
    this.cache.set(cacheKey, result);
    return result;
  }
  
  async getFundingOfficeAnalysis(marketName, startDate = '2020-01-01', endDate = '2025-09-30') {
    const cacheKey = `funding_office_${marketName}_${startDate}_${endDate}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const pscCodes = this.marketService.getMarketPscCodes(marketName);
    const fundingOffices = await getFundingOfficeBreakdown(pscCodes, startDate, endDate, 100);
    
    // Group by agency for hierarchical visualization
    const officesByAgency = {};
    fundingOffices.forEach(office => {
      if (!officesByAgency[office.agency]) {
        officesByAgency[office.agency] = {
          name: office.agency,
          toptier_agency: office.toptier_agency,
          total_obligation: 0,
          offices: []
        };
      }
      
      officesByAgency[office.agency].total_obligation += office.total_obligation;
      officesByAgency[office.agency].offices.push(office);
    });
    
    const result = {
      marketName,
      fundingOffices,
      officesByAgency: Object.values(officesByAgency).sort((a, b) => b.total_obligation - a.total_obligation)
    };
    
    this.cache.set(cacheKey, result);
    return result;
  }
  
  async getMarketTrends(marketName, startDate = '2020-01-01', endDate = '2025-09-30') {
    const cacheKey = `market_trends_${marketName}_${startDate}_${endDate}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const pscCodes = this.marketService.getMarketPscCodes(marketName);
    const timelineData = await getTimelineData(pscCodes, startDate, endDate);
    
    // Calculate quarterly growth rates
    const quarters = timelineData.results;
    const growthRates = [];
    
    for (let i = 1; i < quarters.length; i++) {
      const previousQuarter = quarters[i-1].aggregated_amount;
      const currentQuarter = quarters[i].aggregated_amount;
      
      if (previousQuarter > 0) {
        const growthRate = ((currentQuarter / previousQuarter) - 1) * 100;
        growthRates.push({
          time_period: quarters[i].time_period,
          growth_rate: growthRate
        });
      }
    }
    
    // Calculate moving averages (4-quarter)
    const movingAverages = [];
    for (let i = 3; i < quarters.length; i++) {
      const sum = quarters[i].aggregated_amount + 
                 quarters[i-1].aggregated_amount + 
                 quarters[i-2].aggregated_amount + 
                 quarters[i-3].aggregated_amount;
      
      movingAverages.push({
        time_period: quarters[i].time_period,
        moving_average: sum / 4
      });
    }
    
    const result = {
      marketName,
      rawData: quarters,
      growthRates,
      movingAverages
    };
    
    this.cache.set(cacheKey, result);
    return result;
  }
}

5. Dashboard UI Components
Main Dashboard Layout

import React, { useState, useEffect } from 'react';
import { DashboardDataService } from '../services/dashboard_data_service';
import { MarketDefinitionService } from '../services/market_definition_service';
import TimelineChart from './TimelineChart';
import AgencyBreakdownChart from './AgencyBreakdownChart';
import FundingOfficeTable from './FundingOfficeTable';
import TopAwardsTable from './TopAwardsTable';
import MarketSelector from './MarketSelector';
import DateRangeSelector from './DateRangeSelector';
import MarketMetricsCard from './MarketMetricsCard';
import LoadingSpinner from './LoadingSpinner';

const DashboardLayout = () => {
  const [selectedMarket, setSelectedMarket] = useState('Electronic Warfare');
  const [dateRange, setDateRange] = useState({
    startDate: '2020-01-01',
    endDate: '2025-09-30'
  });
  const [marketData, setMarketData] = useState(null);
  const [fundingOfficeData, setFundingOfficeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const dataService = new DashboardDataService();
  const marketService = new MarketDefinitionService();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const overview = await dataService.getMarketOverview(
          selectedMarket, 
          dateRange.startDate, 
          dateRange.endDate
        );
        setMarketData(overview);
        
        // Only fetch funding office data when on that tab to improve performance
        if (activeTab === 'funding-offices') {
          const officeData = await dataService.getFundingOfficeAnalysis(
            selectedMarket, 
            dateRange.startDate, 
            dateRange.endDate
          );
          setFundingOfficeData(officeData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedMarket, dateRange, activeTab]);
  
  const handleMarketChange = (market) => {
    setSelectedMarket(market);
  };
  
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Federal Spending Dashboard</h1>
        <div className="dashboard-controls">
          <MarketSelector 
            markets={marketService.getAllMarkets()} 
            selectedMarket={selectedMarket} 
            onChange={handleMarketChange} 
          />
          <DateRangeSelector 
            dateRange={dateRange} 
            onChange={handleDateRangeChange} 
          />
        </div>
      </header>
      
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => handleTabChange('overview')}
        >
          Market Overview
        </button>
        <button 
          className={activeTab === 'funding-offices' ? 'active' : ''} 
          onClick={() => handleTabChange('funding-offices')}
        >
          Funding Offices
        </button>
        <button 
          className={activeTab === 'trends' ? 'active' : ''} 
          onClick={() => handleTabChange('trends')}
        >
          Market Trends
        </button>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="dashboard-content">
          {activeTab === 'overview' && marketData && (
            <>
              <div className="metrics-row">
                <MarketMetricsCard 
                  title="Total Market Size" 
                  value={`$${(marketData.totalMarketSize / 1000000000).toFixed(2)}B`} 
                  icon="dollar-sign" 
                />
                <MarketMetricsCard 
                  title="YoY Growth" 
                  value={`${marketData.yoyGrowth.toFixed(1)}%`} 
                  icon="trending-up" 
                  trend={marketData.yoyGrowth > 0 ? 'positive' : 'negative'} 
                />
                <MarketMetricsCard 
                  title="Top Agency" 
                  value={marketData.agencyBreakdown[0]?.name || 'N/A'} 
                  icon="building" 
                />
              </div>
              
              <div className="chart-row">
                <div className="chart-container timeline-chart">
                  <h2>Spending Over Time</h2>
                  <TimelineChart data={marketData.timelineData} />
                </div>
                <div className="chart-container agency-chart">
                  <h2>Agency Breakdown</h2>
                  <AgencyBreakdownChart data={marketData.agencyBreakdown} />
                </div>
              </div>
              
              <div className="table-container">
                <h2>Top Awards</h2>
                <TopAwardsTable awards={marketData.topAwards} />
              </div>
            </>
          )}
          
          {activeTab === 'funding-offices' && fundingOfficeData && (
            <div className="funding-offices-container">
              <h2>Funding Offices Analysis</h2>
              <FundingOfficeTable 
                offices={fundingOfficeData.fundingOffices} 
                agencyGroups={fundingOfficeData.officesByAgency} 
              />
            </div>
          )}
          
          {activeTab === 'trends' && marketData && (
            <div className="trends-container">
              <h2>Market Trends Analysis</h2>
              {/* Trends components would go here */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;

Timeline Chart Component

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TimelineChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Format data for Chart.js
    const labels = data.map(item => {
      const { fiscal_year, quarter } = item.time_period;
      return `FY${fiscal_year} Q${quarter}`;
    });
    
    const amounts = data.map(item => item.aggregated_amount / 1000000); // Convert to millions
    
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Spending ($ Millions)',
          data: amounts,
          borderColor: '#4e73df',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#4e73df',
          pointBorderColor: '#fff',
          pointRadius: 4,
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `$${context.raw.toFixed(2)}M`;
              }
            }
          },
          legend: {
            position: 'top',
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value + 'M';
              }
            },
            title: {
              display: true,
              text: 'Spending ($ Millions)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Fiscal Year & Quarter'
            }
          }
        }
      }
    });
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);
  
  return (
    <div className="chart-wrapper" style={{ height: '400px' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default TimelineChart;

Funding Office Table Component

import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

const FundingOfficeTable = ({ offices, agencyGroups }) => {
  const [expandedAgencies, setExpandedAgencies] = useState({});
  const [sortField, setSortField] = useState('total_obligation');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const toggleAgency = (agencyName) => {
    setExpandedAgencies({
      ...expandedAgencies,
      [agencyName]: !expandedAgencies[agencyName]
    });
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const sortedAgencyGroups = [...agencyGroups].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] - b[sortField];
    } else {
      return b[sortField] - a[sortField];
    }
  });
  
  const filteredAgencyGroups = sortedAgencyGroups.filter(agency => 
    agency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="funding-office-table-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search agencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <table className="funding-office-table">
        <thead>
          <tr>
            <th></th>
            <th onClick={() => handleSort('name')}>
              Agency/Office Name
              {sortField === 'name' && (
                <span className="sort-indicator">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th onClick={() => handleSort('total_obligation')}>
              Total Obligation
              {sortField === 'total_obligation' && (
                <span className="sort-indicator">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th onClick={() => handleSort('total_awards')}>
              Award Count
              {sortField === 'total_awards' && (
                <span className="sort-indicator">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredAgencyGroups.map((agency) => (
            <React.Fragment key={agency.name}>
              <tr className="agency-row">
                <td>
                  <button 
                    className="expand-button"
                    onClick={() => toggleAgency(agency.name)}
                  >
                    {expandedAgencies[agency.name] ? '−' : '+'}
                  </button>
                </td>
                <td>{agency.name}</td>
                <td>{formatCurrency(agency.total_obligation)}</td>
                <td>{agency.offices.reduce((sum, office) => sum + office.total_awards, 0)}</td>
              </tr>
              
              {expandedAgencies[agency.name] && agency.offices.map((office) => (
                <tr key={office.name} className="office-row">
                  <td></td>
                  <td className="office-name">{office.name}</td>
                  <td>{formatCurrency(office.total_obligation)}</td>
                  <td>{office.total_awards}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FundingOfficeTable;

6. Caching Strategy

class CacheService {
  constructor(defaultTtl = 3600000) { // Default TTL: 1 hour in milliseconds
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
  }
  
  set(key, value, ttl = this.defaultTtl) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt
    });
    
    // Schedule cleanup
    setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    return true;
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  has(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key) {
    return this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  // Utility method to refresh an item's TTL
  touch(key, ttl = this.defaultTtl) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    item.expiresAt = Date.now() + ttl;
    return true;
  }
}

7. Data Fetching Optimization

class ApiOptimizationService {
  constructor() {
    this.pendingRequests = new Map();
    this.batchSize = 10; // Maximum number of awards to process in parallel
    this.requestDelay = 100; // Milliseconds between batches to avoid rate limiting
  }
  
  // De-duplicate identical API requests
  async dedupRequest(url, options) {
    const requestKey = `${url}:${JSON.stringify(options)}`;
    
    if (this.pendingRequests.has(requestKey)) {
      // Return the existing promise for this request
      return this.pendingRequests.get(requestKey);
    }
    
    // Create a new request promise
    const requestPromise = fetch(url, options).then(response => response.json());
    
    // Store the promise
    this.pendingRequests.set(requestKey, requestPromise);
    
    // Remove from pending requests once completed
    requestPromise.finally(() => {
      this.pendingRequests.delete(requestKey);
    });
    
    return requestPromise;
  }
  
  // Process award details in batches to avoid overwhelming the API
  async batchProcessAwards(awards, processFn) {
    const results = [];
    
    // Process awards in batches
    for (let i = 0; i < awards.length; i += this.batchSize) {
      const batch = awards.slice(i, i + this.batchSize);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(award => processFn(award))
      );
      
      results.push(...batchResults);
      
      // Add delay between batches if not the last batch
      if (i + this.batchSize < awards.length) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
    }
    
    return results;
  }
  
  // Optimized version of funding office breakdown
  async getOptimizedFundingOfficeBreakdown(marketPscCodes, startDate, endDate, limit = 100) {
    // Get awards for the market
    const awardsResponse = await this.dedupRequest(
      'https://usaspending.mindsteps.com.mx/api/v2/search/spending_by_award/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            time_period: [
              {start_date: startDate, end_date: endDate}
            ],
            award_type_codes: ["A", "B", "C", "D"],
            psc_codes: {
              require: marketPscCodes
            }
          },
          fields: [
            "Award ID", 
            "Award Amount", 
            "generated_internal_id"
          ],
          page: 1,
          limit: limit
        })
      }
    );
    
    const fundingOffices = {};
    
    // Process awards in batches
    await this.batchProcessAwards(
      awardsResponse.results,
      async (award) => {
        const awardDetails = await this.dedupRequest(
          `https://usaspending.mindsteps.com.mx/api/v2/awards/${award.generated_internal_id}/`,
          {}
        );
        
        if (awardDetails.funding_agency?.office_agency_name) {
          const officeName = awardDetails.funding_agency.office_agency_name;
          const officeKey = `${awardDetails.funding_agency.subtier_agency.code}_${officeName}`;
          
          if (!fundingOffices[officeKey]) {
            fundingOffices[officeKey] = {
              name: officeName,
              agency: awardDetails.funding_agency.subtier_agency.name,
              agency_code: awardDetails.funding_agency.subtier_agency.code,
              toptier_agency: awardDetails.funding_agency.toptier_agency.name,
              total_awards: 0,
              total_obligation: 0,
              awards: []
            };
          }
          
          fundingOffices[officeKey].total_awards++;
          fundingOffices[officeKey].total_obligation += award["Award Amount"] || 0;
          fundingOffices[officeKey].awards.push({
            id: award["Award ID"],
            amount: award["Award Amount"]
          });
        }
      }
    );
    
    return Object.values(fundingOffices).sort((a, b) => b.total_obligation - a.total_obligation);
  }
}


8. Data Transformation Utilities

// Format currency values
export const formatCurrency = (value, options = {}) => {
  const { abbreviate = false, decimals = 2 } = options;
  
  if (value === null || value === undefined) {
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

// Format dates
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Format fiscal year and quarter
export const formatFiscalPeriod = (fiscalYear, quarter) => {
  return `FY${fiscalYear} Q${quarter}`;
};

// Calculate percentage change
export const calculatePercentChange = (current, previous) => {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  return `${value.toFixed(decimals)}%`;
};

// Transform timeline data for charts
export const transformTimelineData = (data) => {
  if (!data || !data.length) return { labels: [], values: [] };
  
  const labels = data.map(item => {
    const { fiscal_year, quarter } = item.time_period;
    return `FY${fiscal_year} Q${quarter}`;
  });
  
  const values = data.map(item => item.aggregated_amount);
  
  return { labels, values };
};

// Group data by fiscal year
export const groupByFiscalYear = (timelineData) => {
  const yearlyTotals = {};
  
  timelineData.forEach(item => {
    const year = item.time_period.fiscal_year;
    yearlyTotals[year] = (yearlyTotals[year] || 0) + item.aggregated_amount;
  });
  
  return Object.entries(yearlyTotals).map(([year, amount]) => ({
    fiscal_year: year,
    amount
  })).sort((a, b) => a.fiscal_year - b.fiscal_year);
};

// Calculate year-over-year growth rates
export const calculateYearlyGrowthRates = (yearlyData) => {
  const growthRates = [];
  
  for (let i = 1; i < yearlyData.length; i++) {
    const previousYear = yearlyData[i-1].amount;
    const currentYear = yearlyData[i].amount;
    
    if (previousYear > 0) {
      const growthRate = ((currentYear / previousYear) - 1) * 100;
      growthRates.push({
        fiscal_year: yearlyData[i].fiscal_year,
        growth_rate: growthRate
      });
    }
  }
  
  return growthRates;
};

9. Agency Breakdown Chart Component
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatCurrency } from '../utils/formatters';

const AgencyBreakdownChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Limit to top 5 agencies for better visualization
    const topAgencies = data.slice(0, 5);
    const otherAgencies = data.slice(5);
    
    let chartData = [...topAgencies];
    
    // Add "Other" category if there are more than 5 agencies
    if (otherAgencies.length > 0) {
      const otherTotal = otherAgencies.reduce((sum, agency) => sum + agency.amount, 0);
      chartData.push({
        name: 'Other Agencies',
        amount: otherTotal
      });
    }
    
    // Format data for Chart.js
    const labels = chartData.map(agency => agency.name);
    const amounts = chartData.map(agency => agency.amount);
    
    // Generate colors
    const backgroundColors = [
      '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'
    ];
    
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: amounts,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: backgroundColors.map(color => color + 'dd'),
          hoverBorderColor: 'rgba(234, 236, 244, 1)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${formatCurrency(value, { abbreviate: true })} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);
  
  return (
    <div className="chart-wrapper" style={{ height: '400px' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default AgencyBreakdownChart;

10. Top Awards Table Component

import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

const TopAwardsTable = ({ awards }) => {
  const [expandedAwards, setExpandedAwards] = useState({});
  
  const toggleAward = (awardId) => {
    setExpandedAwards({
      ...expandedAwards,
      [awardId]: !expandedAwards[awardId]
    });
  };
  
  if (!awards || awards.length === 0) {
    return <div className="no-data">No awards data available</div>;
  }
  
  return (
    <div className="top-awards-table-container">
      <table className="top-awards-table">
        <thead>
          <tr>
            <th></th>
            <th>Award ID</th>
            <th>Recipient</th>
            <th>Amount</th>
            <th>Award Date</th>
            <th>Awarding Agency</th>
          </tr>
        </thead>
        <tbody>
          {awards.map((award) => (
            <React.Fragment key={award["Award ID"]}>
              <tr className="award-row">
                <td>
                  <button 
                    className="expand-button"
                    onClick={() => toggleAward(award["Award ID"])}
                  >
                    {expandedAwards[award["Award ID"]] ? '−' : '+'}
                  </button>
                </td>
                <td>{award["Award ID"]}</td>
                <td>{award["Recipient Name"]}</td>
                <td>{formatCurrency(award["Award Amount"])}</td>
                <td>{formatDate(award["Start Date"])}</td>
                <td>{award["Awarding Agency"]}</td>
              </tr>
              
              {expandedAwards[award["Award ID"]] && (
                <tr className="award-details-row">
                  <td colSpan="6" className="award-details">
                    <div className="award-description">
                      <h4>Description</h4>
                      <p>{award["Description"] || "No description available"}</p>
                    </div>
                    <div className="award-metadata">
                      <div className="metadata-item">
                        <span className="metadata-label">Period of Performance:</span>
                        <span className="metadata-value">
                          {formatDate(award["Start Date"])} to {formatDate(award["End Date"])}
                        </span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label">Funding Agency:</span>
                        <span className="metadata-value">{award["Funding Agency"]}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopAwardsTable;

11. Market Metrics Card Component

import React from 'react';

const MarketMetricsCard = ({ title, value, icon, trend }) => {
  const getIconClass = (iconName) => {
    const iconMap = {
      'dollar-sign': 'fas fa-dollar-sign',
      'trending-up': 'fas fa-chart-line',
      'building': 'fas fa-building',
      'award': 'fas fa-award',
      'calendar': 'fas fa-calendar',
      'users': 'fas fa-users'
    };
    
    return iconMap[iconName] || 'fas fa-chart-bar';
  };
  
  const getTrendClass = (trendValue) => {
    if (!trendValue) return '';
    return trendValue === 'positive' ? 'trend-positive' : 'trend-negative';
  };
  
  return (
    <div className="metrics-card">
      <div className="metrics-card-icon">
        <i className={getIconClass(icon)}></i>
      </div>
      <div className="metrics-card-content">
        <h3 className="metrics-card-title">{title}</h3>
        <div className={`metrics-card-value ${getTrendClass(trend)}`}>
          {value}
          {trend && (
            <span className="trend-indicator">
              <i className={trend === 'positive' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'}></i>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketMetricsCard;

12. Market Selector Component

import React from 'react';

const MarketSelector = ({ markets, selectedMarket, onChange }) => {
  return (
    <div className="market-selector">
      <label htmlFor="market-select">Market:</label>
      <select 
        id="market-select" 
        value={selectedMarket} 
        onChange={(e) => onChange(e.target.value)}
      >
        {markets.map(market => (
          <option key={market} value={market}>
            {market}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MarketSelector;

13. Date Range Selector Component

import React from 'react';

const DateRangeSelector = ({ dateRange, onChange }) => {
  const handleStartDateChange = (e) => {
    onChange({
      ...dateRange,
      startDate: e.target.value
    });
  };
  
  const handleEndDateChange = (e) => {
    onChange({
      ...dateRange,
      endDate: e.target.value
    });
  };
  
  // Predefined date ranges
  const predefinedRanges = [
    { label: 'Last 5 Years', start: '2020-01-01', end: '2025-09-30' },
    { label: 'Last 3 Years', start: '2022-01-01', end: '2025-09-30' },
    { label: 'Current Year', start: '2024-01-01', end: '2025-09-30' },
    { label: 'Previous Year', start: '2023-01-01', end: '2023-12-31' }
  ];
  
  const handlePredefinedRange = (start, end) => {
    onChange({
      startDate: start,
      endDate: end
    });
  };
  
  return (
    <div className="date-range-selector">
      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">Start Date:</label>
          <input
            id="start-date"
            type="date"
            value={dateRange.startDate}
            onChange={handleStartDateChange}
            min="2020-01-01"
            max={dateRange.endDate}
          />
        </div>
        <div className="date-input-group">
          <label htmlFor="end-date">End Date:</label>
          <input
            id="end-date"
            type="date"
            value={dateRange.endDate}
            onChange={handleEndDateChange}
            min={dateRange.startDate}
            max="2025-09-30"
          />
        </div>
      </div>
      
      <div className="predefined-ranges">
        {predefinedRanges.map(range => (
          <button
            key={range.label}
            className="range-button"
            onClick={() => handlePredefinedRange(range.start, range.end)}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateRangeSelector;

