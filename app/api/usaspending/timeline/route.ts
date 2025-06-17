import { NextRequest, NextResponse } from 'next/server';

// Global request deduplication cache that persists across hot reloads
declare global {
  var timelineRequestCache: Map<string, { promise: Promise<unknown>; timestamp: number }> | undefined;
}

const requestCache = globalThis.timelineRequestCache ?? new Map<string, { promise: Promise<unknown>; timestamp: number }>();
globalThis.timelineRequestCache = requestCache;

const CACHE_DURATION = 5000; // 5 seconds

function getCacheKey(body: unknown): string {
  return JSON.stringify(body);
}

function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cacheKey = getCacheKey(body);
    const now = Date.now();

    // Check if we have a recent request for the same data
    const cached = requestCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('🔄 Returning cached timeline request');
      return NextResponse.json(await cached.promise);
    }

    // Clean up old cache entries
    cleanupCache();

    console.log('🚀 Proxying new timeline request:', body);

    const requestPromise = fetch('https://usaspending.mindsteps.com.mx/api/v2/search/spending_over_time/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        console.error('USASpending API error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Timeline API response:', data.results?.length, 'data points');
      return data;
    });

    // Cache the promise
    requestCache.set(cacheKey, { promise: requestPromise, timestamp: now });

    const data = await requestPromise;
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Timeline proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
