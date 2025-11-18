import axiosInstance from "@/services/axios";

export interface DealerBandsResponse {
  status: string;
  symbol: string;
  spot_price: number;
  levels: {
    total_gamma_flip: number;
    max_pain: number;
    abs_gex: {
      strike: number;
      gex: string;
    };
    top_positive_gex: {
      p1: { strike: number; gex: string; oi: number };
      p2: { strike: number; gex: string; oi: number };
      p3: { strike: number; gex: string; oi: number };
    };
    top_negative_gex: {
      n1: { strike: number; gex: string; oi: number };
      n2: { strike: number; gex: string; oi: number };
      n3: { strike: number; gex: string; oi: number };
    };
  };
  expected_move: {
    success?: boolean;
    data: {
      daily_zones: {
        daily_expires_end: string;
        daily_expires_time_end: string;
        daily_expires_time_start: string;
        daily_expires_start: string;
        reference_price: number;
        fire_zones: {
          up: {
            center: number;
            high: number;
            low: number;
          };
          down: {
            center: number;
            high: number;
            low: number;
          };
        };
        magnet_zones: {
          up: {
            center: number;
            high: number;
            low: number;
            midpoint_50: number;
          };
          down: {
            center: number;
            high: number;
            low: number;
            midpoint_50: number;
          };
        };
        zone_width: number;
      };
      weekly_zones: {
        weekly_expires_end: string;
        weekly_expires_start: string;
        weekly_expires_start_time: string;
        weekly_expires_end_time: string;
        reference_price: number;
        fire_zones: {
          up: {
            center: number;
            high: number;
            low: number;
          };
          down: {
            center: number;
            high: number;
            low: number;
          };
        };
        magnet_zones: {
          up: {
            center: number;
            high: number;
            low: number;
            midpoint_50: number;
          };
          down: {
            center: number;
            high: number;
            low: number;
            midpoint_50: number;
          };
        };
        zone_width: number;
      };
    };
    cached: boolean;
    timestamp?: string;
    gexVolume?: {
      gex_data: Array<{
        strike: number;
        gex: number;
      }>;
      volume_data: Array<{
        strike: number;
        volume: number;
      }>;
    };
  };
  candle: Array<{
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
    "6. date": string;
    "7. time": string;
    "8. change_val": string | null;
    "9. change_pct": string | null;
  }>;
}

export const fetchDealerBands = async (
  symbol: string,
  interval?: string
): Promise<DealerBandsResponse> => {
  try {
    // const url = interval? `/dealer-bands?symbol=${symbol}&interval=${interval}` : `/dealer-bands?symbol=${symbol}`;
    // const url = "https://iw.isoft-digital.net/api/tradex";
    // const url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&interval=1min&symbol=WOLF&apikey=OBP9YKXLSYLFT773&outputsize=full";
    // const response = await axiosInstance.get(url);

    const url = `/api/stock?symbol=${symbol}&interval=${interval || "1min"}`;
    const response = await axiosInstance.get(url, { baseURL: "" });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch dealer bands:", error);
    throw error;
  }
};
