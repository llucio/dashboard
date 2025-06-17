import {
  TimelineResponse,
  AgencyBreakdownResponse,
  AwardsResponse,
  MarketOverview,
  FundingOfficeAnalysis
} from '../types/dashboard';

export class MockDataService {
  getMockTimelineData(): TimelineResponse {
    return {
      group: "quarter",
      results: [
        { time_period: { fiscal_year: "2020", quarter: "1" }, aggregated_amount: 1500000000 },
        { time_period: { fiscal_year: "2020", quarter: "2" }, aggregated_amount: 1800000000 },
        { time_period: { fiscal_year: "2020", quarter: "3" }, aggregated_amount: 2100000000 },
        { time_period: { fiscal_year: "2020", quarter: "4" }, aggregated_amount: 2300000000 },
        { time_period: { fiscal_year: "2021", quarter: "1" }, aggregated_amount: 2500000000 },
        { time_period: { fiscal_year: "2021", quarter: "2" }, aggregated_amount: 2900000000 },
        { time_period: { fiscal_year: "2021", quarter: "3" }, aggregated_amount: 3200000000 },
        { time_period: { fiscal_year: "2021", quarter: "4" }, aggregated_amount: 3500000000 },
        { time_period: { fiscal_year: "2022", quarter: "1" }, aggregated_amount: 3800000000 },
        { time_period: { fiscal_year: "2022", quarter: "2" }, aggregated_amount: 4100000000 },
        { time_period: { fiscal_year: "2022", quarter: "3" }, aggregated_amount: 4400000000 },
        { time_period: { fiscal_year: "2022", quarter: "4" }, aggregated_amount: 4700000000 },
        { time_period: { fiscal_year: "2023", quarter: "1" }, aggregated_amount: 5000000000 },
        { time_period: { fiscal_year: "2023", quarter: "2" }, aggregated_amount: 5300000000 },
        { time_period: { fiscal_year: "2023", quarter: "3" }, aggregated_amount: 5600000000 },
        { time_period: { fiscal_year: "2023", quarter: "4" }, aggregated_amount: 5900000000 },
        { time_period: { fiscal_year: "2024", quarter: "1" }, aggregated_amount: 6200000000 },
        { time_period: { fiscal_year: "2024", quarter: "2" }, aggregated_amount: 6500000000 },
        { time_period: { fiscal_year: "2024", quarter: "3" }, aggregated_amount: 6800000000 },
        { time_period: { fiscal_year: "2024", quarter: "4" }, aggregated_amount: 7100000000 }
      ]
    };
  }

  getMockAgencyData(): AgencyBreakdownResponse {
    return {
      category: "awarding_agency",
      results: [
        { amount: 45000000000, name: "Department of Defense", code: "097", id: 1173 },
        { amount: 12000000000, name: "Department of Homeland Security", code: "070", id: 1456 },
        { amount: 8500000000, name: "Department of the Air Force", code: "057", id: 1234 },
        { amount: 6200000000, name: "Department of the Navy", code: "017", id: 5678 },
        { amount: 4800000000, name: "Department of the Army", code: "021", id: 9012 },
        { amount: 3200000000, name: "National Aeronautics and Space Administration", code: "080", id: 3456 },
        { amount: 2100000000, name: "Department of Energy", code: "089", id: 7890 },
        { amount: 1800000000, name: "Department of Veterans Affairs", code: "036", id: 2345 },
        { amount: 1200000000, name: "Department of Transportation", code: "069", id: 6789 },
        { amount: 900000000, name: "Department of Commerce", code: "013", id: 1357 }
      ]
    };
  }

  getMockAwardsData(): AwardsResponse {
    return {
      limit: 100,
      results: [
        {
          "Award ID": "W91ZLK24P0063",
          "Recipient Name": "RAYTHEON COMPANY",
          "Award Amount": 188000000,
          "Description": "RADAR EQUIPMENT DEVELOPMENT",
          "Start Date": "2024-08-27",
          "End Date": "2025-08-26",
          "Awarding Agency": "Department of Defense",
          "Funding Agency": "Department of Defense",
          "generated_internal_id": "CONT_AWD_W91ZLK24P0063_9700_-NONE-_-NONE-"
        },
        {
          "Award ID": "FA8750-24-C-0123",
          "Recipient Name": "LOCKHEED MARTIN CORPORATION",
          "Award Amount": 156000000,
          "Description": "ELECTRONIC WARFARE SYSTEMS",
          "Start Date": "2024-06-15",
          "End Date": "2026-06-14",
          "Awarding Agency": "Department of the Air Force",
          "Funding Agency": "Department of the Air Force",
          "generated_internal_id": "CONT_AWD_FA8750-24-C-0123_5700_-NONE-_-NONE-"
        },
        {
          "Award ID": "N00024-24-C-4567",
          "Recipient Name": "NORTHROP GRUMMAN CORPORATION",
          "Award Amount": 134000000,
          "Description": "CYBERSECURITY INFRASTRUCTURE",
          "Start Date": "2024-05-01",
          "End Date": "2025-04-30",
          "Awarding Agency": "Department of the Navy",
          "Funding Agency": "Department of the Navy",
          "generated_internal_id": "CONT_AWD_N00024-24-C-4567_1700_-NONE-_-NONE-"
        }
      ],
      page_metadata: {
        page: 1,
        hasNext: true,
        last_record_unique_id: 168551000,
        last_record_sort_value: "N00024-24-C-4567"
      }
    };
  }

  getMockMarketOverview(marketName: string): MarketOverview {
    const timelineData = this.getMockTimelineData();
    const agencyData = this.getMockAgencyData();
    const awardsData = this.getMockAwardsData();

    const totalMarketSize = agencyData.results.reduce((sum, agency) => sum + agency.amount, 0);
    const yoyGrowth = 12.5; // Mock 12.5% growth

    return {
      marketName,
      totalMarketSize,
      yoyGrowth,
      timelineData: timelineData.results,
      agencyBreakdown: agencyData.results,
      topAwards: awardsData.results
    };
  }

  getMockFundingOfficeAnalysis(marketName: string): FundingOfficeAnalysis {
    return {
      marketName,
      fundingOffices: [
        {
          name: "AFLCMC/HBAN",
          agency: "Department of the Air Force",
          agency_code: "5700",
          toptier_agency: "Department of Defense",
          total_awards: 45,
          total_obligation: 2500000000,
          awards: [
            { id: "FA8750-24-C-0123", amount: 156000000, description: "Electronic Warfare Systems", recipient: "Lockheed Martin" },
            { id: "FA8750-24-C-0124", amount: 89000000, description: "Radar Development", recipient: "Raytheon" }
          ]
        },
        {
          name: "NAVAIR PMA-265",
          agency: "Department of the Navy",
          agency_code: "1700",
          toptier_agency: "Department of Defense",
          total_awards: 32,
          total_obligation: 1800000000,
          awards: [
            { id: "N00024-24-C-4567", amount: 134000000, description: "Cybersecurity Infrastructure", recipient: "Northrop Grumman" }
          ]
        },
        {
          name: "PEO STRI",
          agency: "Department of the Army",
          agency_code: "2100",
          toptier_agency: "Department of Defense",
          total_awards: 28,
          total_obligation: 1200000000,
          awards: [
            { id: "W91ZLK24P0063", amount: 188000000, description: "Radar Equipment Development", recipient: "Raytheon" }
          ]
        }
      ],
      officesByAgency: [
        {
          name: "Department of the Air Force",
          toptier_agency: "Department of Defense",
          total_obligation: 2500000000,
          offices: [
            {
              name: "AFLCMC/HBAN",
              agency: "Department of the Air Force",
              agency_code: "5700",
              toptier_agency: "Department of Defense",
              total_awards: 45,
              total_obligation: 2500000000,
              awards: []
            }
          ]
        },
        {
          name: "Department of the Navy",
          toptier_agency: "Department of Defense",
          total_obligation: 1800000000,
          offices: [
            {
              name: "NAVAIR PMA-265",
              agency: "Department of the Navy",
              agency_code: "1700",
              toptier_agency: "Department of Defense",
              total_awards: 32,
              total_obligation: 1800000000,
              awards: []
            }
          ]
        }
      ]
    };
  }
}

export const mockDataService = new MockDataService();
