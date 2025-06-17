import { apiService } from './api';
import { marketDefinitionService } from './market-definition';
import { mockDataService } from './mock-data';
import {
  MarketOverview,
  FundingOfficeAnalysis,
  FundingOffice,
  PscCode,
  TimelineDataPoint
} from '../types/dashboard';

// Type for award data from API
interface AwardData {
  "Award ID": string;
  "Recipient Name": string;
  "Award Amount": number;
  "Description": string;
  "Start Date": string;
  "End Date": string;
  "Awarding Agency": string;
  "Funding Agency": string;
  generated_internal_id: string;
}

export class DashboardDataService {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private defaultTtl = 24 * 60 * 60 * 1000; // 24 hours
  private useMockData = false; // Switch to real API

  private getCacheKey(prefix: string, ...args: string[]): string {
    return `${prefix}_${args.join('_')}`;
  }

  private setCache(key: string, data: unknown, ttl = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  private async getAllAwardsPaginated(
    pscCodes: PscCode[],
    startDate: string,
    endDate: string,
    isQuickSelection = true
  ) {
    console.log('=== PAGINATION START ===');
    console.log('PSC Codes:', pscCodes);
    console.log('Date range:', startDate, 'to', endDate);

    const allAwards: unknown[] = [];
    let page = 1;
    const limit = 100; // API maximum
    let hasMoreData = true;

    while (hasMoreData) {
      try {
        console.log(`Fetching awards page ${page} (limit: ${limit})`);
        const response = await apiService.getAwardsList(pscCodes, page, limit, startDate, endDate, isQuickSelection);

        if (response.results && response.results.length > 0) {
          allAwards.push(...response.results);
          console.log(`Page ${page}: Got ${response.results.length} awards, total: ${allAwards.length}`);

          // Check if we got fewer results than the limit, indicating we've reached the end
          if (response.results.length < limit) {
            hasMoreData = false;
          } else {
            page++;
          }
        } else {
          hasMoreData = false;
        }
      } catch (error) {
        console.error(`Error fetching awards page ${page}:`, error);
        hasMoreData = false;
      }
    }

    console.log(`Total awards fetched: ${allAwards.length}`);
    return { results: allAwards };
  }

  async getFilteredTimelineData(
    marketName: string,
    selectedAgency?: string | null,
    selectedFundingOffice?: string | null,
    startDate = '2020-01-01',
    endDate = '2025-09-30',
    isQuickSelection = true
  ) {
    console.log('=== TIMELINE FILTERING START ===');
    console.log('Market:', marketName);
    console.log('Selected Agency:', selectedAgency);
    console.log('Selected Funding Office:', selectedFundingOffice);

    const pscCodes = marketDefinitionService.getMarketPscCodes(marketName);

    // Get the full timeline data first (for structure reference) - already uses fiscal year periods
    const fullTimelineData = await apiService.getTimelineData(pscCodes, startDate, endDate, isQuickSelection);
    console.log('Full timeline data points:', fullTimelineData.results.length);

    // Log the total from API timeline for comparison
    const apiTimelineTotal = fullTimelineData.results.reduce((sum, item) => sum + item.aggregated_amount, 0);
    console.log('API Timeline total amount:', apiTimelineTotal);

    // Always use individual awards for consistency between "All Agencies" and specific agency selections
    // This ensures the timeline chart matches the investment series totals

    // Get all awards to calculate filtered timeline (paginated due to API limit of 100)
    console.log('Fetching all awards for filtering...');
    const allAwards = await this.getAllAwardsPaginated(pscCodes, startDate, endDate, isQuickSelection);
    console.log('Total awards fetched:', allAwards.results.length);

    // Log total amount from all awards for debugging
    const totalAmount = allAwards.results.reduce((sum: number, award) => sum + (award as AwardData)["Award Amount"], 0);
    console.log('Total amount from all awards:', totalAmount);

    // Filter awards based on selections
    let filteredAwards = allAwards.results;
    console.log('Starting with all awards:', filteredAwards.length);

    if (selectedAgency) {
      console.log('Filtering by agency:', selectedAgency);
      const beforeAgencyFilter = filteredAwards.length;
      filteredAwards = filteredAwards.filter(award =>
        (award as AwardData)["Awarding Agency"] === selectedAgency
      );
      console.log(`After agency filter: ${filteredAwards.length} (was ${beforeAgencyFilter})`);
    }

    if (selectedFundingOffice) {
      console.log('Filtering by funding office:', selectedFundingOffice);
      const beforeOfficeFilter = filteredAwards.length;

      // Filter awards by funding office using award details API
      const fundingOfficeFilteredAwards = [];

      for (const award of filteredAwards) {
        try {
          const awardDetails = await apiService.getAwardDetails((award as AwardData).generated_internal_id);

          // Check if this award belongs to the selected funding office
          if (awardDetails.funding_agency?.office_agency_name === selectedFundingOffice) {
            fundingOfficeFilteredAwards.push(award);
            console.log(`✅ Award ${(award as AwardData)["Award ID"]} belongs to ${selectedFundingOffice}`);
          } else {
            console.log(`❌ Award ${(award as AwardData)["Award ID"]} belongs to ${awardDetails.funding_agency?.office_agency_name || 'Unknown'}, not ${selectedFundingOffice}`);
          }
        } catch (error) {
          console.error(`Error fetching award details for filtering:`, error);
          // If we can't get details, skip this award for funding office filtering
        }
      }

      filteredAwards = fundingOfficeFilteredAwards;
      console.log(`After funding office filter: ${filteredAwards.length} (was ${beforeOfficeFilter})`);
    }

    // Calculate timeline data from filtered awards
    const timelineMap: Record<string, number> = {};

    console.log('=== PROCESSING FILTERED AWARDS FOR TIMELINE ===');
    filteredAwards.forEach((award, index) => {
      const startDate = new Date((award as AwardData)["Start Date"]);

      // US Government Fiscal Year: Oct 1 - Sep 30
      // September 19, 2019 should be FY2020 (since FY2020 starts Oct 1, 2019)
      const month = startDate.getMonth(); // 0-11 (0=Jan, 8=Sep, 9=Oct)
      const year = startDate.getFullYear();

      let fiscalYear, fiscalQuarter;

      if (month >= 9) { // Oct, Nov, Dec (months 9, 10, 11)
        fiscalYear = year + 1; // FY starts in October of current year
        fiscalQuarter = Math.ceil((month - 8) / 3); // Oct=Q1, Nov=Q1, Dec=Q1
      } else { // Jan-Sep (months 0-8)
        fiscalYear = year; // FY continues into next calendar year
        fiscalQuarter = Math.ceil((month + 4) / 3); // Jan=Q2, Apr=Q3, Jul=Q4
      }

      const key = `${fiscalYear}-Q${fiscalQuarter}`;

      console.log(`Award ${index + 1}:`, {
        id: (award as AwardData)["Award ID"],
        amount: (award as AwardData)["Award Amount"],
        startDate: (award as AwardData)["Start Date"],
        parsedDate: startDate,
        month: month,
        fiscalYear,
        fiscalQuarter,
        key
      });

      // Check if this key exists in the timeline data
      const timelineEntry = fullTimelineData.results.find(item =>
        `${item.time_period.fiscal_year}-Q${item.time_period.quarter}` === key
      );

      if (timelineEntry) {
        // Award falls within timeline range
        timelineMap[key] = (timelineMap[key] || 0) + (award as AwardData)["Award Amount"];
      } else {
        // Award falls outside timeline range - map to closest available period
        console.log(`Award ${(award as AwardData)["Award ID"]} (${key}) falls outside timeline range. Mapping to closest period.`);

        // Find the earliest available timeline period
        const earliestPeriod = fullTimelineData.results[0];
        if (earliestPeriod) {
          const fallbackKey = `${earliestPeriod.time_period.fiscal_year}-Q${earliestPeriod.time_period.quarter}`;
          console.log(`Mapping to earliest period: ${fallbackKey}`);
          timelineMap[fallbackKey] = (timelineMap[fallbackKey] || 0) + (award as AwardData)["Award Amount"];
        }
      }
    });
    console.log('Final timeline map:', timelineMap);

    console.log('=== TIMELINE CALCULATION ===');
    console.log('Filtered awards count:', filteredAwards.length);
    console.log('Timeline map:', timelineMap);

    // Calculate total filtered amount for comparison
    const totalFilteredAmount = filteredAwards.reduce((sum: number, award) => sum + (award as AwardData)["Award Amount"], 0);
    console.log('Total filtered amount:', totalFilteredAmount);
    console.log('Total timeline amount:', Object.values(timelineMap).reduce((sum: number, amount) => sum + amount, 0));

    console.log('Sample filtered awards:', filteredAwards.slice(0, 3).map(a => ({
      id: (a as AwardData)["Award ID"],
      amount: (a as AwardData)["Award Amount"],
      startDate: (a as AwardData)["Start Date"]
    })));
    console.log('=== END TIMELINE FILTERING ===');

    // Convert to timeline format matching the original structure
    const filteredResults = fullTimelineData.results.map(item => {
      const key = `${item.time_period.fiscal_year}-Q${item.time_period.quarter}`;
      const filteredAmount = timelineMap[key] || 0;

      return {
        time_period: item.time_period,
        aggregated_amount: filteredAmount
      };
    });

    return {
      group: fullTimelineData.group,
      results: filteredResults
    };
  }

  async getFilteredAwardsData(
    marketName: string,
    selectedAgency?: string | null,
    selectedFundingOffice?: string | null,
    startDate = '2020-01-01',
    endDate = '2025-09-30',
    isQuickSelection = true
  ) {
    console.log('=== AWARDS FILTERING START ===');
    console.log('Market:', marketName);
    console.log('Selected Agency:', selectedAgency);
    console.log('Selected Funding Office:', selectedFundingOffice);

    const pscCodes = marketDefinitionService.getMarketPscCodes(marketName);

    // Get all awards for filtering
    console.log('Fetching all awards for filtering...');
    const allAwards = await this.getAllAwardsPaginated(pscCodes, startDate, endDate, isQuickSelection);
    console.log('Total awards fetched:', allAwards.results.length);

    // Filter awards based on selections
    let filteredAwards = allAwards.results;
    console.log('Starting with all awards:', filteredAwards.length);

    if (selectedAgency) {
      console.log('Filtering by agency:', selectedAgency);
      const beforeAgencyFilter = filteredAwards.length;
      filteredAwards = filteredAwards.filter(award =>
        (award as AwardData)["Awarding Agency"] === selectedAgency
      );
      console.log(`After agency filter: ${filteredAwards.length} (was ${beforeAgencyFilter})`);
    }

    if (selectedFundingOffice) {
      console.log('Filtering by funding office:', selectedFundingOffice);
      const beforeOfficeFilter = filteredAwards.length;

      // Filter awards by funding office using award details API
      const fundingOfficeFilteredAwards = [];

      for (const award of filteredAwards) {
        try {
          const awardDetails = await apiService.getAwardDetails((award as AwardData).generated_internal_id);

          // Check if this award belongs to the selected funding office
          if (awardDetails.funding_agency?.office_agency_name === selectedFundingOffice) {
            fundingOfficeFilteredAwards.push(award);
            console.log(`✅ Award ${(award as AwardData)["Award ID"]} belongs to ${selectedFundingOffice}`);
          } else {
            console.log(`❌ Award ${(award as AwardData)["Award ID"]} belongs to ${awardDetails.funding_agency?.office_agency_name || 'Unknown'}, not ${selectedFundingOffice}`);
          }
        } catch (error) {
          console.error(`Error fetching award details for filtering:`, error);
          // If we can't get details, skip this award for funding office filtering
        }
      }

      filteredAwards = fundingOfficeFilteredAwards;
      console.log(`After funding office filter: ${filteredAwards.length} (was ${beforeOfficeFilter})`);
    }

    console.log('=== END AWARDS FILTERING ===');

    return {
      results: filteredAwards as AwardData[]
    };
  }

  async getMarketOverview(
    marketName: string,
    startDate = '2020-01-01',
    endDate = '2025-09-30',
    isQuickSelection = true
  ): Promise<MarketOverview> {
    console.log('🚀 getMarketOverview called for:', marketName);
    const cacheKey = this.getCacheKey('market_overview', marketName, startDate, endDate, isQuickSelection.toString());
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('📦 Returning cached market overview for:', marketName);
      return cached as MarketOverview;
    }

    try {
      console.log(`🚀 Fetching comprehensive market data for: ${marketName}`);
      console.log(`Date range: ${startDate} to ${endDate}`);
      const pscCodes = marketDefinitionService.getMarketPscCodes(marketName);
      console.log(`PSC codes for ${marketName}:`, pscCodes);

      // Step 1: Fetch base market data
      console.log('📊 Fetching base timeline, agency, and awards data...');
      const [timelineData, agencyData] = await Promise.all([
        apiService.getTimelineData(pscCodes, startDate, endDate, isQuickSelection),
        apiService.getAgencyBreakdown(pscCodes, startDate, endDate, isQuickSelection)
      ]);

      // Get ALL awards for Investment Series
      console.log('🎯 Fetching all awards for Investment Series...');
      const allAwardsData = await this.getAllAwardsPaginated(pscCodes, startDate, endDate, isQuickSelection);

      console.log('✅ Base data fetched:', {
        timelinePoints: timelineData.results.length,
        agencies: agencyData.results.length,
        awards: allAwardsData.results.length
      });

      // Step 2: Pre-fetch timeline and awards data for each agency
      console.log('🔄 Pre-fetching data for all agencies...');
      console.log('🔄 Agency data results:', agencyData.results.map(a => ({ name: a.name, amount: a.amount })));
      const agencyTimelineData: Record<string, TimelineDataPoint[]> = {};
      const agencyAwardsData: Record<string, AwardData[]> = {};

      await Promise.all(
        agencyData.results.map(async (agency) => {
          try {
            console.log(
              `📈 Fetching timeline and awards for agency: "${agency.name}"`
            );

            const [agencyTimeline, agencyAwards] = await Promise.all([
              this.getFilteredTimelineData(
                marketName,
                agency.name,
                null,
                startDate,
                endDate,
                isQuickSelection
              ),
              this.getFilteredAwardsData(
                marketName,
                agency.name,
                null,
                startDate,
                endDate,
                isQuickSelection
              )
            ]);

            agencyTimelineData[agency.name] = agencyTimeline.results;
            agencyAwardsData[agency.name] = agencyAwards.results;

            console.log(
              `✅ "${agency.name}": ${agencyTimeline.results.length} timeline points, ${agencyAwards.results.length} awards`
            );
          } catch (error) {
            console.error(
              `❌ Error fetching data for agency ${agency.name}:`,
              error
            );
            agencyTimelineData[agency.name] = [];
            agencyAwardsData[agency.name] = [];
          }
        })
      );

      console.log('🎯 Final agency timeline data keys:', Object.keys(agencyTimelineData));
      console.log('🎯 Final agency timeline data structure:', agencyTimelineData);

      // Step 3: Get funding office data and efficiently pre-fetch their timeline/awards
      console.log('🏢 Fetching funding office data...');
      const fundingOffices = await this.getFundingOfficeBreakdown(pscCodes, startDate, endDate, 100, isQuickSelection);

      console.log('🚀 Smart pre-fetching timeline and awards for all funding offices...');
      const fundingOfficeTimelineData: Record<string, TimelineDataPoint[]> = {};
      const fundingOfficeAwardsData: Record<string, AwardData[]> = {};

      // Smart approach: Group awards by funding office during the breakdown process
      // This way we already know which awards belong to which funding office
      for (const fundingOffice of fundingOffices) {
        try {
          console.log(`📈 Pre-calculating timeline for funding office: ${fundingOffice.name} (${fundingOffice.awards.length} awards)`);

          // Use the awards we already identified for this funding office
          const officeAwards = fundingOffice.awards.map(award => {
            // Find the full award data from our main awards list
            const fullAward = allAwardsData.results.find(a =>
              (a as AwardData)["Award ID"] === award.id
            );
            return fullAward;
          }).filter(Boolean) as AwardData[];

          // Calculate timeline from these specific awards
          const timelineMap: Record<string, number> = {};

          officeAwards.forEach(award => {
            const startDate = new Date(award["Start Date"]);
            const month = startDate.getMonth();
            const year = startDate.getFullYear();

            let fiscalYear, fiscalQuarter;
            if (month >= 9) {
              fiscalYear = year + 1;
              fiscalQuarter = Math.ceil((month - 8) / 3);
            } else {
              fiscalYear = year;
              fiscalQuarter = Math.ceil((month + 4) / 3);
            }

            const key = `${fiscalYear}-Q${fiscalQuarter}`;
            timelineMap[key] = (timelineMap[key] || 0) + award["Award Amount"];
          });

          // Convert to timeline format
          const officeTimelineResults = timelineData.results.map(item => {
            const key = `${item.time_period.fiscal_year}-Q${item.time_period.quarter}`;
            const amount = timelineMap[key] || 0;
            return {
              time_period: item.time_period,
              aggregated_amount: amount
            };
          });

          fundingOfficeTimelineData[fundingOffice.name] = officeTimelineResults;
          fundingOfficeAwardsData[fundingOffice.name] = officeAwards;

          console.log(`✅ ${fundingOffice.name}: ${officeTimelineResults.length} timeline points, ${officeAwards.length} awards`);
        } catch (error) {
          console.error(`❌ Error pre-calculating data for funding office ${fundingOffice.name}:`, error);
          fundingOfficeTimelineData[fundingOffice.name] = [];
          fundingOfficeAwardsData[fundingOffice.name] = [];
        }
      }

      // Calculate market metrics
      const totalMarketSize = agencyData.results.reduce((sum, agency) => sum + agency.amount, 0);
      const yearlyTotals: Record<string, number> = {};
      timelineData.results.forEach(item => {
        const year = item.time_period.fiscal_year;
        yearlyTotals[year] = (yearlyTotals[year] || 0) + item.aggregated_amount;
      });

      const years = Object.keys(yearlyTotals).sort();
      const yoyGrowth = years.length > 1 ?
        (yearlyTotals[years[years.length - 1]] / yearlyTotals[years[years.length - 2]] - 1) * 100 : 0;

      const result: MarketOverview = {
        marketName,
        totalMarketSize,
        yoyGrowth,
        timelineData: timelineData.results,
        agencyBreakdown: agencyData.results,
        topAwards: allAwardsData.results as AwardData[],
        // Pre-fetched data for instant filtering
        agencyTimelineData,
        agencyAwardsData,
        fundingOfficeTimelineData,
        fundingOfficeAwardsData,
        fundingOffices
      };

      console.log('🎉 Market overview with pre-fetched data complete!');
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching real data, falling back to mock data:', error);
      const result = mockDataService.getMockMarketOverview(marketName);
      this.setCache(cacheKey, result);
      return result;
    }
  }

  async getFundingOfficeBreakdown(
    marketPscCodes: PscCode[],
    startDate = '2020-01-01',
    endDate = '2025-09-30',
    limit = 100,
    isQuickSelection = true
  ): Promise<FundingOffice[]> {
    // Step 1: Get awards for the market
    const awardsData = await apiService.getAwardsList(marketPscCodes, 1, limit, startDate, endDate, isQuickSelection);

    // Step 2: Get details for each award to extract funding offices
    const fundingOffices: Record<string, FundingOffice> = {};

    for (const award of awardsData.results) {
      try {
        const awardDetails = await apiService.getAwardDetails((award as AwardData).generated_internal_id);

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
          fundingOffices[officeKey].total_obligation += (award as AwardData)["Award Amount"] || 0;
          fundingOffices[officeKey].awards.push({
            id: (award as AwardData)["Award ID"],
            amount: (award as AwardData)["Award Amount"],
            description: (award as AwardData)["Description"],
            recipient: (award as AwardData)["Recipient Name"]
          });
        }
      } catch (error) {
        console.error(`Error fetching award details for ${(award as AwardData).generated_internal_id}:`, error);
      }
    }

    return Object.values(fundingOffices).sort((a, b) => b.total_obligation - a.total_obligation);
  }

  async getFundingOfficeAnalysis(
    marketName: string,
    startDate = '2020-01-01',
    endDate = '2025-09-30',
    isQuickSelection = true
  ): Promise<FundingOfficeAnalysis> {
    const cacheKey = this.getCacheKey('funding_office', marketName, startDate, endDate, isQuickSelection.toString());
    const cached = this.getCache(cacheKey);
    if (cached) return cached as FundingOfficeAnalysis;

    try {
      console.log(`Fetching funding office data for market: ${marketName}`);
      const pscCodes = marketDefinitionService.getMarketPscCodes(marketName);
      const fundingOffices = await this.getFundingOfficeBreakdown(pscCodes, startDate, endDate, 100, isQuickSelection);

      // Group by agency for hierarchical visualization
      const officesByAgency: Record<string, {
        name: string;
        toptier_agency: string;
        total_obligation: number;
        offices: FundingOffice[];
      }> = {};
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

      const result: FundingOfficeAnalysis = {
        marketName,
        fundingOffices,
        officesByAgency: Object.values(officesByAgency).sort((a, b) => b.total_obligation - a.total_obligation)
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching funding office data, falling back to mock data:', error);
      const result = mockDataService.getMockFundingOfficeAnalysis(marketName);
      this.setCache(cacheKey, result);
      return result;
    }
  }
}

// Singleton instance
export const dashboardDataService = new DashboardDataService();
