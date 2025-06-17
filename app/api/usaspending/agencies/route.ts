import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Proxying agencies request:', body);

    const response = await fetch('https://usaspending.mindsteps.com.mx/api/v2/search/spending_by_category/awarding_agency/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('USASpending API error:', errorText);
      return NextResponse.json(
        { error: `API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Agencies API response:', data.results?.length, 'agencies');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Agencies proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
