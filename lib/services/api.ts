import {
  TimelineResponse,
  AgencyBreakdownResponse,
  AwardsResponse,
  AwardDetails,
  PscCode,
  TimelineRequest,
  AgencyBreakdownRequest,
  AwardsRequest
} from '../types/dashboard';
import { generateTimePeriods } from '../utils/formatters';

// Determine the base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're running on the server side
  if (typeof window === 'undefined') {
    // Server-side: use localhost with the port
    return 'http://localhost:3000/api/usaspending';
  }
  // Client-side: use relative URL
  return '/api/usaspending';
};

const API_BASE_URL = getApiBaseUrl();

export class ApiService {
  private requestCache = new Map<string, { promise: Promise<unknown>; timestamp: number }>();
  private readonly CACHE_DURATION = 5000; // 5 seconds

  private getCacheKey(url: string, options?: RequestInit): string {
    return `${url}_${JSON.stringify(options?.body || '')}`;
  }

  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const cacheKey = this.getCacheKey(url, options);
    const now = Date.now();

    // Check if we have a recent request for the same data
    const cached = this.requestCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log('🔄 Returning cached request for:', url);
      return cached.promise as Promise<T>;
    }

    // Clean up old cache entries
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.requestCache.delete(key);
      }
    }

    try {
      console.log('🚀 Making new API request to:', url);
      console.log('Request options:', options);

      const requestPromise = fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options?.headers,
        },
        mode: 'cors', // Explicitly set CORS mode
        ...options,
      }).then(async (response) => {
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ API response data received:', data);
        return data;
      });

      // Cache the promise
      this.requestCache.set(cacheKey, { promise: requestPromise, timestamp: now });

      return await requestPromise;
    } catch (error) {
      // Remove failed request from cache
      this.requestCache.delete(cacheKey);

      console.error('❌ API request failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to API. This might be a CORS issue.');
      }
      throw error;
    }
  }

  async getTimelineData(
    marketPscCodes: PscCode[],
    startDate = '2020-01-01',
    endDate = '2025-09-30',
    isQuickSelection = true
  ): Promise<TimelineResponse> {
    const timePeriods = generateTimePeriods(startDate, endDate, isQuickSelection);
    console.log('Timeline time periods:', timePeriods);

    const requestBody: TimelineRequest = {
      group: "quarter",
      filters: {
        time_period: timePeriods,
        award_type_codes: ["A", "B", "C", "D"],
        psc_codes: {
          require: marketPscCodes
        }
      },
      subawards: false
    };

    return this.makeRequest<TimelineResponse>(
      `${API_BASE_URL}/timeline`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }
    );
  }

  async getAgencyBreakdown(
    marketPscCodes: PscCode[],
    startDate = '2020-01-01',
    endDate = '2025-09-30',
    isQuickSelection = true
  ): Promise<AgencyBreakdownResponse> {
    const requestBody: AgencyBreakdownRequest = {
      filters: {
        time_period: generateTimePeriods(startDate, endDate, isQuickSelection),
        award_type_codes: ["A", "B", "C", "D"],
        psc_codes: {
          require: marketPscCodes
        }
      },
      limit: 10
    };

    return this.makeRequest<AgencyBreakdownResponse>(
      `${API_BASE_URL}/agencies`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }
    );
  }

  async getAwardsList(
    marketPscCodes: PscCode[],
    page = 1,
    limit = 100,
    startDate = '2020-01-01',
    endDate = '2025-09-30',
    isQuickSelection = true
  ): Promise<AwardsResponse> {
    const requestBody: AwardsRequest = {
      filters: {
        time_period: generateTimePeriods(startDate, endDate, isQuickSelection),
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
    };

    return this.makeRequest<AwardsResponse>(
      `${API_BASE_URL}/awards`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }
    );
  }

  async getAwardDetails(generatedInternalId: string): Promise<AwardDetails> {
    return this.makeRequest<AwardDetails>(
      `${API_BASE_URL}/award-details/${generatedInternalId}`
    );
  }
}

// Singleton instance
export const apiService = new ApiService();
