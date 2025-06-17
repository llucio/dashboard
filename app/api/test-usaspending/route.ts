import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing USASpending API connection...');
    
    const testRequest = {
      group: "quarter",
      filters: {
        time_period: [
          { start_date: "2023-01-01", end_date: "2024-12-31" }
        ],
        award_type_codes: ["A", "B", "C", "D"],
        psc_codes: {
          require: [["Product", "5840"]]
        }
      },
      subawards: false
    };

    const response = await fetch('https://usaspending.mindsteps.com.mx/api/v2/search/spending_over_time/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    console.log('API Response status:', response.status);
    console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('API Response data length:', data.results?.length || 0);

    return NextResponse.json({
      success: true,
      message: 'USASpending API connection successful',
      dataPoints: data.results?.length || 0,
      sampleData: data.results?.slice(0, 2) || [],
      fullResponse: data
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof TypeError ? 'Network/CORS Error' : 'Other Error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET(); // For now, just redirect POST to GET
}
