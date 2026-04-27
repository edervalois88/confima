export interface BudgetAllocation {
  category: string;
  allocated: number;
  spent: number;
}

export interface IBudgetOptimizationService {
  calculateOptimalAllocation(totalBudget: number, priorities: string): Promise<BudgetAllocation[]>;
  updateAllocation(tenantId: string, allocation: BudgetAllocation): Promise<void>;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  priceRange: string;
  rating: number;
  aestheticScore?: number;
}

export interface IAestheticMatchingService {
  findVendorsByAesthetic(moodboardVectors: number[]): Promise<Vendor[]>;
}

export interface LegalRisk {
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  mitigationSuggestion: string;
}

export interface ILegalComplianceService {
  auditVendorContract(contractText: string): Promise<LegalRisk[]>;
}

// IMessagingProvider moved to its own port file for SRP.


export interface IDocumentExtractionService {
  extractTextFromBuffer(buffer: ArrayBuffer, mimeType: string): Promise<string>;
}

export interface SentimentResult {
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  score: number; // 0.0 a 1.0
  category: "CATERING" | "MUSIC" | "WEATHER" | "LOGISTICS" | "OTHER";
  evidence: string;
}

export interface ISentimentAnalysisService {
  analyze(text: string): Promise<SentimentResult>;
}

export interface IVendorRatingService {
  updateRating(vendorId: string, sentiment: SentimentResult): Promise<void>;
}



export interface IVendorRepository {
  searchVendors(filters: { category?: string; maxPrice?: number }): Promise<Vendor[]>;
  getContractText(vendorId: string): Promise<string>;
}

