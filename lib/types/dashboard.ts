// Core data types for the federal spending dashboard

export interface TimelineDataPoint {
  time_period: {
    fiscal_year: string;
    quarter: string;
  };
  aggregated_amount: number;
}

export interface TimelineResponse {
  group: string;
  results: TimelineDataPoint[];
}

export interface Agency {
  amount: number;
  name: string;
  code: string;
  id: number;
}

export interface AgencyBreakdownResponse {
  category: string;
  results: Agency[];
}

export interface Award {
  internal_id?: number;
  "Award ID": string;
  "Recipient Name": string;
  "Award Amount": number;
  "Description": string;
  "Start Date": string;
  "End Date": string;
  "Awarding Agency": string;
  "Funding Agency": string;
  "generated_internal_id": string;
}

export interface AwardsResponse {
  limit: number;
  results: Award[];
  page_metadata: {
    page: number;
    hasNext: boolean;
    last_record_unique_id: number;
    last_record_sort_value: string;
  };
}

export interface FundingAgency {
  id: number;
  has_agency_page: boolean;
  toptier_agency: {
    name: string;
    code: string;
    abbreviation: string;
    slug: string;
  };
  subtier_agency: {
    name: string;
    code: string;
    abbreviation: string;
  };
  office_agency_name: string;
}

export interface AwardDetails {
  id: number;
  generated_unique_award_id: string;
  piid: string;
  category: string;
  type: string;
  type_description: string;
  description: string;
  total_obligation: number;
  funding_agency: FundingAgency;
}

export interface FundingOffice {
  name: string;
  agency: string;
  agency_code: string;
  toptier_agency: string;
  total_awards: number;
  total_obligation: number;
  awards: {
    id: string;
    amount: number;
    description: string;
    recipient: string;
  }[];
}

export interface MarketOverview {
  marketName: string;
  totalMarketSize: number;
  yoyGrowth: number;
  timelineData: TimelineDataPoint[];
  agencyBreakdown: Agency[];
  topAwards: Award[];
  // Pre-fetched data for instant filtering (optional for backward compatibility)
  agencyTimelineData?: Record<string, TimelineDataPoint[]>;
  agencyAwardsData?: Record<string, Award[]>;
  fundingOfficeTimelineData?: Record<string, TimelineDataPoint[]>;
  fundingOfficeAwardsData?: Record<string, Award[]>;
  fundingOffices?: FundingOffice[];
}

export interface FundingOfficeAnalysis {
  marketName: string;
  fundingOffices: FundingOffice[];
  officesByAgency: {
    name: string;
    toptier_agency: string;
    total_obligation: number;
    offices: FundingOffice[];
  }[];
}

// Market definition types
export type PscCode = [string, string]; // [type, code]

export interface MarketDefinition {
  [marketName: string]: PscCode[];
}

// Dashboard state types
export interface DashboardState {
  selectedMarket: string;
  selectedAgency: string | null;
  selectedFundingOffice: string | null;
  // Multiple selections for stacked timeline comparison
  selectedAgencies: string[];
  selectedFundingOffices: string[];
  dateRange: {
    startDate: string;
    endDate: string;
    // Track if this is a quick selection (fiscal years) or custom range
    isQuickSelection: boolean;
    quickSelectionType?: 'last5years' | 'last3years' | 'currentyear' | 'previousyear';
  };
  viewMode: 'table' | 'chart';
}

// API request types
export interface TimelineRequest {
  group: "quarter" | "fiscal_year" | "month";
  filters: {
    time_period: Array<{
      start_date: string;
      end_date: string;
    }>;
    award_type_codes: string[];
    psc_codes: {
      require: PscCode[];
    };
  };
  subawards: boolean;
}

export interface AgencyBreakdownRequest {
  filters: {
    time_period: Array<{
      start_date: string;
      end_date: string;
    }>;
    award_type_codes: string[];
    psc_codes: {
      require: PscCode[];
    };
  };
  limit: number;
}

export interface AwardsRequest {
  filters: {
    time_period: Array<{
      start_date: string;
      end_date: string;
    }>;
    award_type_codes: string[];
    psc_codes: {
      require: PscCode[];
    };
  };
  fields: string[];
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
}
