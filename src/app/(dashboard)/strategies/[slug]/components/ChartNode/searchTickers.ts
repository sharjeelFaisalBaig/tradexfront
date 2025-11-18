import axiosInstance from "@/services/axios";

export interface TickerSearchResult {
  symbol: string;
  name: string;
  type?: string;
  region?: string;
  market_open?: string;
  market_close?: string;
  timezone?: string;
  currency?: string;
  match_score?: number;
}

export interface TickerSearchResponse {
  status: string;
  data: TickerSearchResult[];
}

export const searchTickers = async (
  keywords: string
): Promise<TickerSearchResult[]> => {
  try {
    if (!keywords.trim()) {
      return [];
    }

    const res = await axiosInstance.get(
      `/search-tickers?keyword=${encodeURIComponent(keywords)}`
    );
    return res.data.data || [];
  } catch (err) {
    console.error("Search Tickers API error:", err);
    return [];
  }
};
