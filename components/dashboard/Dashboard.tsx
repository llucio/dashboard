'use client';

import React, { useState, useEffect } from 'react';
import { Building, Users, MapPin } from 'lucide-react';
import { marketDefinitionService } from '@/lib/services/market-definition';
import { dashboardDataService } from '@/lib/services/dashboard-data';
import { MarketOverview, FundingOfficeAnalysis, DashboardState, TimelineDataPoint } from '@/lib/types/dashboard';
import { formatCurrency } from '@/lib/utils/formatters';
import MarketSelector from './MarketSelector';
import AgencySelector from './AgencySelector';
import FundingOfficeSelector from './FundingOfficeSelector';
import TimelineChart from '../charts/TimelineChart';
import StackedTimelineChart from '../charts/StackedTimelineChart';
import LoadingSpinner from '../ui/LoadingSpinner';
import MetricsCard from './MetricsCard';
import InvestmentSeries from './InvestmentSeries';
import DateRangeSelector from './DateRangeSelector';

const Dashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    selectedMarket: 'Electronic Warfare',
    selectedAgency: null,
    selectedFundingOffice: null,
    selectedAgencies: [],
    selectedFundingOffices: [],
    dateRange: {
      startDate: '2019-10-01',  // Default to Last 5 Years fiscal start
      endDate: '2025-09-30',    // Default to current fiscal end
      isQuickSelection: true,
      quickSelectionType: 'last5years'
    },
    viewMode: 'table'
  });

  const [timelineViewMode, setTimelineViewMode] = useState<'single' | 'stacked'>('single');

  const [marketData, setMarketData] = useState<MarketOverview | null>(null);
  const [fundingOfficeData, setFundingOfficeData] = useState<FundingOfficeAnalysis | null>(null);
  const [filteredTimelineData, setFilteredTimelineData] = useState<{results: TimelineDataPoint[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const markets = marketDefinitionService.getAllMarkets();

  useEffect(() => {
    console.log('🔄 Main data effect triggered:', {
      selectedMarket: state.selectedMarket,
      dateRange: state.dateRange
    });

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🚀 Fetching data for market:', state.selectedMarket);

        const overview = await dashboardDataService.getMarketOverview(
          state.selectedMarket,
          state.dateRange.startDate,
          state.dateRange.endDate,
          state.dateRange.isQuickSelection
        );

        console.log('✅ Market overview data received:', overview);
        setMarketData(overview);

        const officeData = await dashboardDataService.getFundingOfficeAnalysis(
          state.selectedMarket,
          state.dateRange.startDate,
          state.dateRange.endDate,
          state.dateRange.isQuickSelection
        );

        console.log('✅ Funding office data received:', officeData);
        setFundingOfficeData(officeData);

      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state.selectedMarket, state.dateRange]);

  // Initialize selections when data loads - start with all agencies/funding offices selected (only on first load)
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (marketData && fundingOfficeData && !hasInitialized) {
      // Auto-select ALL agencies and funding offices for stacked timeline by default (only on first load)
      const allAgencyNames = marketData.agencyBreakdown.map(agency => agency.name);
      const allFundingOfficeNames = fundingOfficeData.fundingOffices.map(fo => fo.name);

      console.log('🎯 Initializing with all selections (first load only):', {
        agencies: allAgencyNames.length,
        fundingOffices: allFundingOfficeNames.length
      });

      setState(prev => ({
        ...prev,
        selectedAgencies: allAgencyNames,
        selectedFundingOffices: allFundingOfficeNames,
        // Set single selections to "All" for initial load (null = "All")
        selectedAgency: null, // null means "All Agencies"
        selectedFundingOffice: null // null means "All Funding Offices"
      }));

      setHasInitialized(true);
    }
  }, [marketData, fundingOfficeData, hasInitialized]);

  // Filter timeline data when agency/funding office changes (using pre-fetched data)
  useEffect(() => {
    if (!marketData) {
      setFilteredTimelineData(null);
      return;
    }

    // For stacked mode, we don't need filtered data
    if (timelineViewMode !== 'single') {
      setFilteredTimelineData(null);
      return;
    }

    // If no specific agency or funding office is selected, use the full timeline data
    if (!state.selectedAgency && !state.selectedFundingOffice) {
      setFilteredTimelineData({ results: marketData.timelineData });
      return;
    }

    setTimelineLoading(true);

    // Use pre-fetched data if available
    let timelineData: { results: TimelineDataPoint[] } | null = null;

    // Priority logic: Funding office is more specific than agency, so prioritize it when both are selected
    if (state.selectedFundingOffice && marketData.fundingOfficeTimelineData?.[state.selectedFundingOffice]) {
      console.log('📋 Using pre-fetched funding office timeline data for:', state.selectedFundingOffice);
      console.log('📋 Available funding office timeline keys:', Object.keys(marketData.fundingOfficeTimelineData || {}));
      console.log('📋 Timeline data points:', marketData.fundingOfficeTimelineData[state.selectedFundingOffice].length);
      timelineData = { results: marketData.fundingOfficeTimelineData[state.selectedFundingOffice] };
    } else if (state.selectedAgency && marketData.agencyTimelineData?.[state.selectedAgency]) {
      console.log('📋 Using pre-fetched agency timeline data for:', state.selectedAgency);
      timelineData = { results: marketData.agencyTimelineData[state.selectedAgency] };
    }

    if (timelineData) {
      console.log('✅ Setting filtered timeline data with', timelineData.results.length, 'points');
      setFilteredTimelineData(timelineData);
      setTimelineLoading(false);
      return;
    }

    console.log('⚠️ No pre-fetched data found for:', {
      selectedAgency: state.selectedAgency,
      selectedFundingOffice: state.selectedFundingOffice,
      hasAgencyData: !!marketData.agencyTimelineData,
      hasFundingOfficeData: !!marketData.fundingOfficeTimelineData,
      agencyKeys: Object.keys(marketData.agencyTimelineData || {}),
      fundingOfficeKeys: Object.keys(marketData.fundingOfficeTimelineData || {})
    });

    // Fallback: fetch data if not pre-fetched (shouldn't happen with new implementation)
    const fetchFilteredData = async () => {
      try {
        console.log('⚠️ Fallback: Fetching timeline data (not pre-fetched)');

        const filteredData = await dashboardDataService.getFilteredTimelineData(
          state.selectedMarket,
          state.selectedAgency,
          state.selectedFundingOffice,
          state.dateRange.startDate,
          state.dateRange.endDate,
          state.dateRange.isQuickSelection
        );

        setFilteredTimelineData(filteredData);
        console.log('✅ Fallback timeline data fetched');
      } catch (error) {
        console.error('Error fetching filtered timeline data:', error);
        // Fallback to full timeline data if filtering fails
        const fallbackData = { results: marketData.timelineData };
        setFilteredTimelineData(fallbackData);
      } finally {
        setTimelineLoading(false);
      }
    };

    fetchFilteredData();
  }, [state.selectedAgency, state.selectedFundingOffice, marketData, timelineViewMode, state.selectedMarket, state.dateRange]);

  const handleMarketChange = (market: string) => {
    setState(prev => ({
      ...prev,
      selectedMarket: market,
      selectedAgency: null,
      selectedFundingOffice: null,
      selectedAgencies: [],
      selectedFundingOffices: []
    }));
    // Reset initialization flag so new market gets properly initialized
    setHasInitialized(false);
  };

  const handleAgencyChange = (agency: string | null) => {
    setState(prev => ({
      ...prev,
      selectedAgency: agency
    }));
  };

  const handleFundingOfficeChange = (office: string | null) => {
    console.log('🏢 Funding office changed to:', office);
    console.log('🏢 Available funding office timeline data:', Object.keys(marketData?.fundingOfficeTimelineData || {}));
    if (office && marketData?.fundingOfficeTimelineData?.[office]) {
      console.log(`🏢 Pre-fetched data available for ${office}:`, {
        timelinePoints: marketData.fundingOfficeTimelineData[office].length,
        awards: marketData.fundingOfficeAwardsData?.[office]?.length || 0
      });
    }
    setState(prev => ({
      ...prev,
      selectedFundingOffice: office
    }));
  };

  const handleDateRangeChange = (
    startDate: string,
    endDate: string,
    isQuickSelection: boolean,
    quickSelectionType?: 'last5years' | 'last3years' | 'currentyear' | 'previousyear'
  ) => {
    setState(prev => ({
      ...prev,
      dateRange: {
        startDate,
        endDate,
        isQuickSelection,
        quickSelectionType
      }
    }));
  };

  // Get filtered awards using pre-fetched data
  const getFilteredAwards = () => {
    if (!marketData) return [];

    // Priority logic: Funding office is more specific than agency, so prioritize it when both are selected
    if (state.selectedFundingOffice && marketData.fundingOfficeAwardsData?.[state.selectedFundingOffice]) {
      console.log('📋 Using pre-fetched funding office awards data for:', state.selectedFundingOffice);
      return marketData.fundingOfficeAwardsData[state.selectedFundingOffice];
    } else if (state.selectedAgency && marketData.agencyAwardsData?.[state.selectedAgency]) {
      console.log('📋 Using pre-fetched agency awards data for:', state.selectedAgency);
      return marketData.agencyAwardsData[state.selectedAgency];
    }

    // Fallback to full awards data
    return marketData.topAwards;
  };

  // Handle multiple agency selection for stacked timeline with cross-selection
  const handleMultipleAgencyToggle = (agencyName: string) => {
    setState(prev => {
      const isSelected = prev.selectedAgencies.includes(agencyName);
      const newSelectedAgencies = isSelected
        ? prev.selectedAgencies.filter(name => name !== agencyName)
        : [...prev.selectedAgencies, agencyName];

      let newSelectedFundingOffices = [...prev.selectedFundingOffices];

      // Cross-selection logic: when selecting/deselecting an agency,
      // auto-select/deselect its related funding offices
      if (fundingOfficeData?.fundingOffices) {
        if (isSelected) {
          // Deselecting agency - remove related funding offices that aren't connected to other selected agencies
          const relatedFundingOffices = fundingOfficeData.fundingOffices
            .filter(fo => (fo.toptier_agency || fo.agency) === agencyName)
            .map(fo => fo.name);

          relatedFundingOffices.forEach(foName => {
            // Check if this funding office is connected to any other selected agency
            const hasOtherSelectedAgency = fundingOfficeData.fundingOffices
              .filter(fo => fo.name === foName)
              .some(fo => {
                const foAgency = fo.toptier_agency || fo.agency;
                return foAgency !== agencyName && newSelectedAgencies.includes(foAgency);
              });

            if (!hasOtherSelectedAgency) {
              newSelectedFundingOffices = newSelectedFundingOffices.filter(name => name !== foName);
            }
          });
        } else {
          // Selecting agency - add related funding offices
          const relatedFundingOffices = fundingOfficeData.fundingOffices
            .filter(fo => (fo.toptier_agency || fo.agency) === agencyName)
            .map(fo => fo.name);

          relatedFundingOffices.forEach(foName => {
            if (!newSelectedFundingOffices.includes(foName)) {
              newSelectedFundingOffices.push(foName);
            }
          });
        }
      }

      return {
        ...prev,
        selectedAgencies: newSelectedAgencies,
        selectedFundingOffices: newSelectedFundingOffices
      };
    });
  };

  // Handle multiple funding office selection for stacked timeline with cross-selection
  const handleMultipleFundingOfficeToggle = (fundingOfficeName: string) => {
    setState(prev => {
      const isSelected = prev.selectedFundingOffices.includes(fundingOfficeName);
      const newSelectedFundingOffices = isSelected
        ? prev.selectedFundingOffices.filter(name => name !== fundingOfficeName)
        : [...prev.selectedFundingOffices, fundingOfficeName];

      let newSelectedAgencies = [...prev.selectedAgencies];

      // Cross-selection logic: when selecting/deselecting a funding office,
      // auto-select/deselect its parent agency
      if (fundingOfficeData?.fundingOffices) {
        const fundingOffice = fundingOfficeData.fundingOffices.find(fo => fo.name === fundingOfficeName);
        if (fundingOffice) {
          const parentAgency = fundingOffice.toptier_agency || fundingOffice.agency;

          if (isSelected) {
            // Deselecting funding office - check if parent agency should be deselected
            const hasOtherSelectedFundingOffices = fundingOfficeData.fundingOffices
              .filter(fo => (fo.toptier_agency || fo.agency) === parentAgency)
              .some(fo => fo.name !== fundingOfficeName && newSelectedFundingOffices.includes(fo.name));

            if (!hasOtherSelectedFundingOffices) {
              newSelectedAgencies = newSelectedAgencies.filter(name => name !== parentAgency);
            }
          } else {
            // Selecting funding office - auto-select parent agency
            if (!newSelectedAgencies.includes(parentAgency)) {
              newSelectedAgencies.push(parentAgency);
            }
          }
        }
      }

      return {
        ...prev,
        selectedAgencies: newSelectedAgencies,
        selectedFundingOffices: newSelectedFundingOffices
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Federal Spending Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Design Technologies for Platforms and Weapons - {state.selectedMarket}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <MarketSelector
                markets={markets}
                selectedMarket={state.selectedMarket}
                onChange={handleMarketChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metrics Cards */}
        {marketData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <MetricsCard
              title="Total Market Size"
              value={marketData.totalMarketSize}
              subtitle={`${marketData.yoyGrowth > 0 ? '+' : ''}${marketData.yoyGrowth.toFixed(1)}% Year-over-Year`}
              trend={marketData.yoyGrowth > 0 ? 'positive' : marketData.yoyGrowth < 0 ? 'negative' : 'neutral'}
            />
            <MetricsCard
              title="Top Agency"
              value={marketData.agencyBreakdown[0]?.name || 'N/A'}
              subtitle={marketData.agencyBreakdown[0] ? formatCurrency(marketData.agencyBreakdown[0].amount, { abbreviate: true }) : ''}
              icon={<Building />}
            />
            <MetricsCard
              title="Total Agencies"
              value={marketData.agencyBreakdown.length.toString()}
              subtitle="Active agencies"
              icon={<Users />}
            />
            <MetricsCard
              title="Funding Offices"
              value={fundingOfficeData?.fundingOffices.length.toString() || '0'}
              subtitle="Active offices"
              icon={<MapPin />}
            />
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Service Investment (Agency) */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Investment</h3>
              <AgencySelector
                agencies={marketData?.agencyBreakdown || []}
                selectedAgency={state.selectedAgency}
                onChange={handleAgencyChange}
                timelineViewMode={timelineViewMode}
                selectedAgencies={state.selectedAgencies}
                onMultipleToggle={handleMultipleAgencyToggle}
              />
            </div>

            {/* Funding Office */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Office</h3>
              <FundingOfficeSelector
                fundingOffices={fundingOfficeData?.fundingOffices || []}
                selectedOffice={state.selectedFundingOffice}
                onChange={handleFundingOfficeChange}
                timelineViewMode={timelineViewMode}
                selectedFundingOffices={state.selectedFundingOffices}
                onMultipleToggle={handleMultipleFundingOfficeToggle}
              />
            </div>

            {/* Date Range Selector */}
            <DateRangeSelector
              startDate={state.dateRange.startDate}
              endDate={state.dateRange.endDate}
              isQuickSelection={state.dateRange.isQuickSelection}
              quickSelectionType={state.dateRange.quickSelectionType}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* Main Chart Area */}
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Spending Timeline - {state.selectedMarket}
                </h3>
                <div className="flex items-center space-x-4">
                  {/* Timeline View Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setTimelineViewMode('single')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        timelineViewMode === 'single'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Single View
                    </button>
                    <button
                      onClick={() => setTimelineViewMode('stacked')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        timelineViewMode === 'stacked'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Compare Multiple
                    </button>
                  </div>

                  {/* Filter indicator for single view */}
                  {timelineViewMode === 'single' && (state.selectedAgency || state.selectedFundingOffice) && (
                    <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      Filtered: {state.selectedAgency && `Agency: ${state.selectedAgency}`}
                      {state.selectedAgency && state.selectedFundingOffice && ' • '}
                      {state.selectedFundingOffice && `Office: ${state.selectedFundingOffice}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Conditional Chart Rendering */}
              {timelineViewMode === 'single' ? (
                timelineLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading filtered timeline...</p>
                    </div>
                  </div>
                ) : filteredTimelineData ? (
                  <TimelineChart
                    data={filteredTimelineData.results}
                    selectedAgency={state.selectedAgency}
                    selectedFundingOffice={state.selectedFundingOffice}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No timeline data available</p>
                  </div>
                )
              ) : (
                marketData && (
                  <StackedTimelineChart
                    selectedFundingOffices={state.selectedFundingOffices}
                    fundingOfficeTimelineData={marketData.fundingOfficeTimelineData || {}}
                  />
                )
              )}
            </div>

            {/* Investment Series (Bottom Section) */}
            <div className="mt-6">
              {marketData && (
                <InvestmentSeries
                  awards={getFilteredAwards()}
                  fundingOffices={fundingOfficeData?.fundingOffices}
                  selectedAgency={state.selectedAgency}
                  selectedFundingOffice={state.selectedFundingOffice}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
