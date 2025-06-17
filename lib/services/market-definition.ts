import { MarketDefinition, PscCode } from '../types/dashboard';

export class MarketDefinitionService {
  private markets: MarketDefinition = {
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

  private pscDescriptions: Record<string, string> = {
    "1040": "Directed Energy Weapons",
    "5840": "Radar Equipment",
    "5865": "Electronic Countermeasures",
    "7010": "Computer Equipment",
    "7030": "Software",
    "D310": "IT Security Services",
    "7035": "AI Hardware",
    "D302": "IT Systems Development",
    "D307": "IT Strategy and Architecture",
    "1000": "Weapons",
    "1550": "Unmanned Aircraft",
    "1710": "Aircraft Components",
    "2355": "Ground Vehicles",
    "1810": "Space Vehicles",
    "5810": "Communications Security Equipment"
  };

  getMarketPscCodes(marketName: string): PscCode[] {
    return this.markets[marketName] || [];
  }

  getAllMarkets(): string[] {
    return Object.keys(this.markets);
  }

  getPscDescription(pscCode: string): string {
    return this.pscDescriptions[pscCode] || "Unknown";
  }

  addMarket(marketName: string, pscCodes: PscCode[]): void {
    this.markets[marketName] = pscCodes;
  }

  removeMarket(marketName: string): void {
    delete this.markets[marketName];
  }

  updateMarket(marketName: string, pscCodes: PscCode[]): void {
    if (this.markets[marketName]) {
      this.markets[marketName] = pscCodes;
    }
  }
}

// Singleton instance
export const marketDefinitionService = new MarketDefinitionService();
