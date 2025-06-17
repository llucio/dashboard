import Dashboard from '@/components/dashboard/Dashboard';
import { dashboardDataService } from '@/lib/services/dashboard-data';

export default async function Home() {
  const defaultMarket = 'Electronic Warfare';
  const startDate = '2019-10-01';
  const endDate = '2025-09-30';
  const isQuickSelection = true;

  const [marketData, fundingOfficeData] = await Promise.all([
    dashboardDataService.getMarketOverview(
      defaultMarket,
      startDate,
      endDate,
      isQuickSelection
    ),
    dashboardDataService.getFundingOfficeAnalysis(
      defaultMarket,
      startDate,
      endDate,
      isQuickSelection
    )
  ]);

  return (
    <Dashboard
      initialMarketData={marketData}
      initialFundingOfficeData={fundingOfficeData}
    />
  );
}
