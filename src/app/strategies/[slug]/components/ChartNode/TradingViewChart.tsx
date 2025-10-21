"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type CandlestickData,
  type HistogramData,
  type Time,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import { fetchDealerBands, type DealerBandsResponse } from "./fetchDealerBands";
import { searchTickers, type TickerSearchResult } from "./searchTickers";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Search, X } from "lucide-react";

interface PriceLevel {
  price: number;
  label: string;
  color: string;
}

type ZoneKind = "daily" | "weekly";
type ZoneType = "fire" | "magnet";
interface Zone {
  id: string;
  kind: ZoneKind;
  ztype: ZoneType;
  from: Time; // unix seconds
  to: Time; // unix seconds
  top: number;
  bottom: number;
  center: number;
  color: string;
}

type PriceLevelKey =
  | "max_pain"
  | "total_gamma_flip"
  | "abs_gex"
  | "p1"
  | "p2"
  | "p3"
  | "n1"
  | "n2"
  | "n3";

type ExpectedKey =
  | "daily_fire"
  | "daily_magnet"
  | "weekly_fire"
  | "weekly_magnet";

interface TradingViewChartProps {
  symbol?: string;
  className?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = "SPY",
  className = "",
}) => {
  const { isLoggedIn } = useAuth();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const priceLinesRef = useRef<Record<string, any>>({});
  const zonePriceLinesRef = useRef<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chartData, setChartData] = useState<DealerBandsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [selectedInterval, setSelectedInterval] = useState<string>("5min");

  const [showWeekly, setShowWeekly] = useState(true);
  const [showDaily, setShowDaily] = useState(true);
  const [showFire, setShowFire] = useState(true);
  const [showMagnet, setShowMagnet] = useState(true);

  const togglesRef = useRef({ showWeekly, showDaily, showFire, showMagnet });
  useEffect(() => {
    togglesRef.current = { showWeekly, showDaily, showFire, showMagnet };
  }, [showWeekly, showDaily, showFire, showMagnet]);

  const allLevelKeys: PriceLevelKey[] = [
    "max_pain",
    "total_gamma_flip",
    "abs_gex",
    "p1",
    "p2",
    "p3",
    "n1",
    "n2",
    "n3",
  ];
  const [selectedLevels, setSelectedLevels] = useState<PriceLevelKey[]>([]);
  const selectedLevelsRef = useRef<PriceLevelKey[]>([]);
  useEffect(() => {
    selectedLevelsRef.current = selectedLevels;
  }, [selectedLevels]);

  const allExpectedKeys: ExpectedKey[] = [
    "daily_fire",
    "daily_magnet",
    "weekly_fire",
    "weekly_magnet",
  ];
  const defaultExpected: ExpectedKey[] = ["daily_magnet", "weekly_magnet"];
  const [selectedExpected, setSelectedExpected] =
    useState<ExpectedKey[]>(defaultExpected);
  const selectedExpectedRef = useRef<ExpectedKey[]>(defaultExpected);
  useEffect(() => {
    selectedExpectedRef.current = selectedExpected;
  }, [selectedExpected]);

  const [openLevelsDD, setOpenLevelsDD] = useState(false);
  const [openExpectedDD, setOpenExpectedDD] = useState(false);
  const levelsDDRef = useRef<HTMLDivElement>(null);
  const expectedDDRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TickerSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [currentHoverData, setCurrentHoverData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
  } | null>(null);

  const [ltpData, setLtpData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
  } | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkTheme = () => {
      const darkMode = document.documentElement.classList.contains("dark");
      setIsDarkMode(darkMode);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        levelsDDRef.current &&
        !levelsDDRef.current.contains(e.target as Node)
      )
        setOpenLevelsDD(false);
      if (
        expectedDDRef.current &&
        !expectedDDRef.current.contains(e.target as Node)
      )
        setOpenExpectedDD(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = async (query: string) => {
    if (!isLoggedIn) {
      toast({
        description: "Please login to search tickers.",
        variant: "destructive",
      });
      return;
    }
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await searchTickers(query);
      setSearchResults(results);
      setShowDropdown(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        description: "Failed to search tickers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTickerSelect = (ticker: TickerSearchResult) => {
    setCurrentSymbol(ticker.symbol);
    setSearchQuery("");
    setShowDropdown(false);
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleTickerSelect(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchDealerBands(currentSymbol, selectedInterval);

        if (
          !data ||
          !data.candle ||
          !Array.isArray(data.candle) ||
          data.candle.length === 0
        ) {
          console.error("Invalid data received from API:", data);
          setError("Invalid data received from API");
          return;
        }

        setChartData(data);
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
        setError("Failed to load chart data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentSymbol, selectedInterval]);

  useEffect(() => {
    if (
      chartRef.current &&
      candlestickSeriesRef.current &&
      chartData &&
      chartData.candle
    ) {
      const candlestickData = convertCandleData(chartData.candle);
      const lastValidCandle = findLastValidCandle(candlestickData);
      if (lastValidCandle) {
        createLTPPriceLine(
          lastValidCandle.close,
          chartRef.current,
          candlestickSeriesRef.current
        );
      }
    }
  }, [chartData]);

  useEffect(() => {
    if (chartData && chartData.candle) {
      const candlestickData = convertCandleData(chartData.candle);
      const lastValidCandle = findLastValidCandle(candlestickData);
      if (lastValidCandle) {
        // Find the corresponding API candle data based on the timestamp of lastValidCandle
        const lastValidTimestamp = lastValidCandle.time as number;
        const correspondingApiCandle = chartData.candle.find((candle) => {
          const candleDateTime = `${candle["6. date"]} ${candle["7. time"]}`;
          const candleDate = new Date(candleDateTime + " UTC");
          const candleTimestamp = Math.floor(candleDate.getTime() / 1000);
          return candleTimestamp === lastValidTimestamp;
        });

        // Use API change values - no fallback to local calculation
        let change = 0;
        let changePercent = 0;

        if (
          correspondingApiCandle &&
          (correspondingApiCandle as any)["8. change_val"] !== null &&
          (correspondingApiCandle as any)["9. change_pct"] !== null
        ) {
          change = parseFloat((correspondingApiCandle as any)["8. change_val"]);
          // Remove % sign if present and convert to number
          const changePercentStr = (correspondingApiCandle as any)[
            "9. change_pct"
          ]
            .toString()
            .replace("%", "");
          changePercent = parseFloat(changePercentStr);
        }

        const lastCandleTime = lastValidCandle.time;
        const volumeData = convertVolumeData(chartData.candle);
        const lastVolume =
          volumeData.find((v) => v.time === lastCandleTime)?.value || 0;

        const ltpDate = new Date((lastValidCandle.time as number) * 1000);
        setLtpData({
          time: `${ltpDate.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
          })}, ${ltpDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "UTC",
          })}`,
          open: lastValidCandle.open,
          high: lastValidCandle.high,
          low: lastValidCandle.low,
          close: lastValidCandle.close,
          volume: lastVolume,
          change: change,
          changePercent: changePercent,
        });
      }
    }
  }, [chartData]);

  const generatePriceLevels = (data: DealerBandsResponse): PriceLevel[] => {
    const levels: PriceLevel[] = [];
    if (data.levels.max_pain) {
      levels.push({
        price: data.levels.max_pain,
        label: "max pain",
        color: "#3b82f6",
      });
    }
    if (data.levels.total_gamma_flip) {
      levels.push({
        price: data.levels.total_gamma_flip,
        label: "total gamma flip",
        color: "#06b6d4",
      });
    }
    if (data.levels.abs_gex?.strike) {
      levels.push({
        price: data.levels.abs_gex.strike,
        label: `abs GEX: ${data.levels.abs_gex.gex}`,
        color: "#a855f7",
      });
    }
    if (data.levels.top_positive_gex) {
      const { p1, p2, p3 } = data.levels.top_positive_gex;
      if (p1)
        levels.push({
          price: p1.strike,
          label: `c1: GEX +${p1.gex} | OI ${p1.oi.toLocaleString()}`,
          color: "#22c55e",
        });
      if (p2)
        levels.push({
          price: p2.strike,
          label: `c2: GEX +${p2.gex} | OI ${p2.oi.toLocaleString()}`,
          color: "#22c55e",
        });
      if (p3)
        levels.push({
          price: p3.strike,
          label: `c3: GEX +${p3.gex} | OI ${p3.oi.toLocaleString()}`,
          color: "#22c55e",
        });
    }
    if (data.levels.top_negative_gex) {
      const { n1, n2, n3 } = data.levels.top_negative_gex;
      if (n1)
        levels.push({
          price: n1.strike,
          label: `p1: GEX ${n1.gex} | OI ${n1.oi.toLocaleString()}`,
          color: "#ef4444",
        });
      if (n2)
        levels.push({
          price: n2.strike,
          label: `p2: GEX ${n2.gex} | OI ${n2.oi.toLocaleString()}`,
          color: "#ef4444",
        });
      if (n3)
        levels.push({
          price: n3.strike,
          label: `p3: GEX ${n3.gex} | OI ${n3.oi.toLocaleString()}`,
          color: "#ef4444",
        });
    }
    return levels;
  };

  const getLevelEntries = (
    data: DealerBandsResponse
  ): Array<{ key: PriceLevelKey; lvl: PriceLevel }> => {
    const entries: Array<{ key: PriceLevelKey; lvl: PriceLevel }> = [];
    if (data.levels.max_pain)
      entries.push({
        key: "max_pain",
        lvl: {
          price: data.levels.max_pain,
          label: "max pain",
          color: "#3b82f6",
        },
      });
    if (data.levels.total_gamma_flip)
      entries.push({
        key: "total_gamma_flip",
        lvl: {
          price: data.levels.total_gamma_flip,
          label: "total gamma flip",
          color: "#06b6d4",
        },
      });
    if (data.levels.abs_gex?.strike)
      entries.push({
        key: "abs_gex",
        lvl: {
          price: data.levels.abs_gex.strike,
          label: `abs GEX: ${data.levels.abs_gex.gex}`,
          color: "#a855f7",
        },
      });
    const tp = data.levels.top_positive_gex;
    if (tp?.p1)
      entries.push({
        key: "p1",
        lvl: {
          price: tp.p1.strike,
          label: `c1: GEX +${tp.p1.gex} | OI ${tp.p1.oi.toLocaleString()}`,
          color: "#22c55e",
        },
      });
    if (tp?.p2)
      entries.push({
        key: "p2",
        lvl: {
          price: tp.p2.strike,
          label: `c2: GEX +${tp.p2.gex} | OI ${tp.p2.oi.toLocaleString()}`,
          color: "#22c55e",
        },
      });
    if (tp?.p3)
      entries.push({
        key: "p3",
        lvl: {
          price: tp.p3.strike,
          label: `c3: GEX +${tp.p3.gex} | OI ${tp.p3.oi.toLocaleString()}`,
          color: "#22c55e",
        },
      });
    const tn = data.levels.top_negative_gex;
    if (tn?.n1)
      entries.push({
        key: "n1",
        lvl: {
          price: tn.n1.strike,
          label: `p1: GEX ${tn.n1.gex} | OI ${tn.n1.oi.toLocaleString()}`,
          color: "#ef4444",
        },
      });
    if (tn?.n2)
      entries.push({
        key: "n2",
        lvl: {
          price: tn.n2.strike,
          label: `p2: GEX ${tn.n2.gex} | OI ${tn.n2.oi.toLocaleString()}`,
          color: "#ef4444",
        },
      });
    if (tn?.n3)
      entries.push({
        key: "n3",
        lvl: {
          price: tn.n3.strike,
          label: `p3: GEX ${tn.n3.gex} | OI ${tn.n3.oi.toLocaleString()}`,
          color: "#ef4444",
        },
      });
    return entries;
  };

  const convertCandleData = (
    candleData: DealerBandsResponse["candle"]
  ): CandlestickData[] => {
    // Validate input
    if (!candleData || !Array.isArray(candleData)) {
      return [];
    }

    const result = candleData
      .map((candle, index) => {
        if (!candle || typeof candle !== "object") {
          return null;
        }

        const dateTimeStr = `${candle["6. date"]} ${candle["7. time"]}`;
        const date = new Date(dateTimeStr + " UTC");

        if (isNaN(date.getTime())) {
          return null;
        }

        const open = parseFloat(candle["1. open"]);
        const high = parseFloat(candle["2. high"]);
        const low = parseFloat(candle["3. low"]);
        const close = parseFloat(candle["4. close"]);

        if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
          return null;
        }

        const minValue = -90071992547409.91;
        const maxValue = 90071992547409.91;

        if (
          open < minValue ||
          open > maxValue ||
          high < minValue ||
          high > maxValue ||
          low < minValue ||
          low > maxValue ||
          close < minValue ||
          close > maxValue
        ) {
          return null;
        }

        return {
          time: (date.getTime() / 1000) as Time,
          open,
          high,
          low,
          close,
        };
      })
      .filter((item): item is CandlestickData => item !== null)
      .sort((a, b) => (a.time as number) - (b.time as number));

    return result;
  };

  const convertVolumeData = (
    candleData: DealerBandsResponse["candle"]
  ): HistogramData[] => {
    // Validate input
    if (!candleData || !Array.isArray(candleData)) {
      return [];
    }

    const result = candleData
      .map((candle, index) => {
        const dateTimeStr = `${candle["6. date"]} ${candle["7. time"]}`;
        const date = new Date(dateTimeStr + " UTC");

        if (isNaN(date.getTime())) {
          return null;
        }

        let volume = 0;

        if (candle && typeof candle === "object" && candle["5. volume"]) {
          volume = parseInt(candle["5. volume"]);
          if (isNaN(volume) || volume < 0) {
            volume = 0;
          }
        } else if (candle && typeof candle === "object") {
          const possibleVolumeKeys = [
            "5. volume",
            "volume",
            "Volume",
            "VOLUME",
          ];
          for (const key of possibleVolumeKeys) {
            if (candle[key as keyof typeof candle] !== undefined) {
              const vol = parseInt(
                candle[key as keyof typeof candle] as string
              );
              if (!isNaN(vol) && vol >= 0) {
                volume = vol;
                break;
              }
            }
          }
        }

        return {
          time: (date.getTime() / 1000) as Time,
          value: volume,
          color: volume === 0 ? "#f0f0f0" : "#c0c0c0",
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => (a.time as number) - (b.time as number));

    return result;
  };

  const ensureCompleteVolumeData = (
    candleData: DealerBandsResponse["candle"],
    volumeData: HistogramData[]
  ): HistogramData[] => {
    if (!candleData || !volumeData) return volumeData;

    const allDates = candleData
      .map((candle) => {
        const dateTimeStr = `${candle["6. date"]} ${candle["7. time"]}`;
        const date = new Date(dateTimeStr + " UTC");
        const timestamp = (date.getTime() / 1000) as Time;
        return timestamp;
      })
      .sort((a, b) => (a as number) - (b as number));

    const volumeDates = new Set(volumeData.map((v) => v.time));
    const missingDates: HistogramData[] = [];

    allDates.forEach((date) => {
      if (!volumeDates.has(date)) {
        missingDates.push({
          time: date,
          value: 0,
          color: "#f0f0f0",
        });
      }
    });

    return [...volumeData, ...missingDates].sort(
      (a, b) => (a.time as number) - (b.time as number)
    );
  };

  const findLastValidCandle = (
    candles: CandlestickData[]
  ): CandlestickData | null => {
    if (!candles || candles.length === 0) return null;

    for (let i = candles.length - 1; i >= 0; i--) {
      const candle = candles[i];
      if (
        candle &&
        typeof candle.close === "number" &&
        !isNaN(candle.close) &&
        typeof candle.open === "number" &&
        !isNaN(candle.open) &&
        typeof candle.high === "number" &&
        !isNaN(candle.high) &&
        typeof candle.low === "number" &&
        !isNaN(candle.low)
      ) {
        return candle;
      }
    }
    return null;
  };

  const getScaleMarginsForInterval = (interval: string) => {
    // Always use dynamic calculation based on available data
    const zones = memoZones;

    // If no zones, try to get price range from candlestick data
    if (zones.length === 0 && chartData?.candle) {
      const candlestickData = convertCandleData(chartData.candle);
      if (candlestickData.length > 0) {
        const prices = candlestickData.flatMap((candle) => [
          candle.open,
          candle.high,
          candle.low,
          candle.close,
        ]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;

        // Calculate margins based on candlestick price range
        const baseMargin = 0.15;
        const rangeFactor = Math.min(priceRange / 100, 0.25);
        const dynamicMargin = baseMargin + rangeFactor;

        return {
          top: Math.min(dynamicMargin, 0.4),
          bottom: Math.min(dynamicMargin, 0.4),
        };
      }
    }

    // Use zones data if available
    if (zones.length > 0) {
      const allPrices = zones.flatMap((zone) => [
        zone.top,
        zone.bottom,
        zone.center,
      ]);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const priceRange = maxPrice - minPrice;

      const baseMargin = 0.15;
      const rangeFactor = Math.min(priceRange / 80, 0.3);
      const dynamicMargin = baseMargin + rangeFactor;

      return {
        top: Math.min(dynamicMargin, 0.4),
        bottom: Math.min(dynamicMargin, 0.4),
      };
    }

    // Fallback based on interval
    const intervalMargins = {
      "1min": { top: 0.2, bottom: 0.2 },
      "5min": { top: 0.25, bottom: 0.25 },
      "15min": { top: 0.3, bottom: 0.3 },
      "1DAY": { top: 0.35, bottom: 0.35 },
    };

    return (
      intervalMargins[interval as keyof typeof intervalMargins] || {
        top: 0.3,
        bottom: 0.3,
      }
    );
  };

  const createLTPPriceLine = (
    price: number,
    chart: IChartApi,
    candlestickSeries: any
  ) => {
    try {
      if (priceLinesRef.current.ltp) {
        candlestickSeries.removePriceLine(priceLinesRef.current.ltp);
      }

      const ltpLine = candlestickSeries.createPriceLine({
        price: price,
        color: "#00FBC7",
        lineWidth: 2,
        lineStyle: 1, // Dashed line
        axisLabelVisible: true,
        title: `LTP: $${price.toFixed(2)}`,
        lineVisible: true,
        extendToVolume: true,
      });

      priceLinesRef.current.ltp = ltpLine;
    } catch (error) {
      console.error("Error creating LTP price line:", error);
    }
  };

  const createZonePriceHighlights = (zones: Zone[], candlestickSeries: any) => {
    try {
      // Remove existing zone price lines
      zonePriceLinesRef.current.forEach((line) => {
        try {
          candlestickSeries.removePriceLine(line);
        } catch (e) {
          // Ignore errors when removing lines
        }
      });
      zonePriceLinesRef.current = [];

      // Filter zones based on current toggles and selections
      const {
        showWeekly: sw,
        showDaily: sd,
        showFire: sf,
        showMagnet: sm,
      } = togglesRef.current;
      const expSel = new Set(selectedExpectedRef.current);

      const visibleZones = zones.filter((z) => {
        if (!sw && z.kind === "weekly") return false;
        if (!sd && z.kind === "daily") return false;
        if (!sf && z.ztype === "fire") return false;
        if (!sm && z.ztype === "magnet") return false;
        const key: ExpectedKey = `${z.kind}_${z.ztype}` as ExpectedKey;
        if (!expSel.has(key)) return false;
        return true;
      });

      // Create highlighted price lines for zone prices
      visibleZones.forEach((zone) => {
        const zoneColor = zone.color;

        // Highlight top price - keep colors, remove labels
        const topLine = candlestickSeries.createPriceLine({
          price: zone.top,
          color: zoneColor,
          lineWidth: 0, // Invisible line
          lineStyle: 0,
          axisLabelVisible: true, // Show price labels
          title: "", // Empty title - no descriptive text
          lineVisible: false, // Don't show the line, just highlight the Y-axis
          axisLabelColor: zoneColor, // Keep colors
          axisLabelTextColor: isDarkMode ? "#ffffff" : "#000000",
        });
        zonePriceLinesRef.current.push(topLine);

        // Highlight bottom price - keep colors, remove labels
        const bottomLine = candlestickSeries.createPriceLine({
          price: zone.bottom,
          color: zoneColor,
          lineWidth: 0,
          lineStyle: 0,
          axisLabelVisible: true, // Show price labels
          title: "", // Empty title - no descriptive text
          lineVisible: false,
          axisLabelColor: zoneColor, // Keep colors
          axisLabelTextColor: isDarkMode ? "#ffffff" : "#000000",
        });
        zonePriceLinesRef.current.push(bottomLine);
      });
    } catch (error) {
      console.error("Error creating zone price highlights:", error);
    }
  };

  // === Auto-fit helper to keep daily/weekly zones proportionally visible ===
  const applyZoneAutoScale = () => {
    const chart = chartRef.current;
    const series = candlestickSeriesRef.current;
    if (!chart || !series) return;

    const priceScale = chart.priceScale("right");

    const {
      showWeekly: sw,
      showDaily: sd,
      showFire: sf,
      showMagnet: sm,
    } = togglesRef.current;
    const expSel = new Set(selectedExpectedRef.current);
    const visibleZones = memoZones.filter((z) => {
      if (!sw && z.kind === "weekly") return false;
      if (!sd && z.kind === "daily") return false;
      if (!sf && z.ztype === "fire") return false;
      if (!sm && z.ztype === "magnet") return false;
      const key: ExpectedKey = `${z.kind}_${z.ztype}` as ExpectedKey;
      return expSel.has(key);
    });

    const deriveFromCandles = (): { from: number; to: number } | null => {
      if (!chartData?.candle?.length) return null;
      const candles = convertCandleData(chartData.candle);
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      candles.forEach((candle) => {
        if (typeof candle.low === "number" && Number.isFinite(candle.low)) {
          min = Math.min(min, candle.low);
        }
        if (typeof candle.high === "number" && Number.isFinite(candle.high)) {
          max = Math.max(max, candle.high);
        }
      });
      if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
      if (min === max) {
        const delta = Math.max(Math.abs(max) * 0.01, 0.5);
        return { from: min - delta, to: max + delta };
      }
      const span = max - min;
      const pad = Math.max(span * 0.08, 0.25);
      return { from: min - pad, to: max + pad };
    };

    const applyManualRange = (range: { from: number; to: number } | null) => {
      if (!range) {
        try {
          (series as any).applyOptions({ autoscaleInfoProvider: undefined });
        } catch {}
        priceScale.setAutoScale(true);
        priceScale.applyOptions({
          scaleMargins: getScaleMarginsForInterval(selectedInterval),
        });
        return;
      }
      (series as any).applyOptions({ autoscaleInfoProvider: undefined });
      priceScale.applyOptions({ scaleMargins: { top: 0.05, bottom: 0.05 } });
      priceScale.setAutoScale(false);
      priceScale.setVisibleRange(range);
    };

    if (!visibleZones.length) {
      applyManualRange(deriveFromCandles());
      return;
    }

    const zoneExtremes = visibleZones.reduce(
      (acc, zone) => {
        const zoneHigh = Math.max(zone.top, zone.bottom, zone.center);
        const zoneLow = Math.min(zone.top, zone.bottom, zone.center);
        acc.max = Math.max(acc.max, zoneHigh);
        acc.min = Math.min(acc.min, zoneLow);
        return acc;
      },
      { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
    );

    if (
      !Number.isFinite(zoneExtremes.min) ||
      !Number.isFinite(zoneExtremes.max)
    ) {
      applyManualRange(deriveFromCandles());
      return;
    }

    if (chartData?.candle?.length) {
      const candles = convertCandleData(chartData.candle);
      const lastValid = findLastValidCandle(candles);
      if (lastValid) {
        if (
          typeof lastValid.low === "number" &&
          Number.isFinite(lastValid.low)
        ) {
          zoneExtremes.min = Math.min(zoneExtremes.min, lastValid.low);
        }
        if (
          typeof lastValid.high === "number" &&
          Number.isFinite(lastValid.high)
        ) {
          zoneExtremes.max = Math.max(zoneExtremes.max, lastValid.high);
        }
      }
    }

    let minBound = zoneExtremes.min;
    let maxBound = zoneExtremes.max;
    let span = maxBound - minBound;

    if (!Number.isFinite(span) || span <= 0) {
      const baseline = Number.isFinite(maxBound) ? maxBound : minBound;
      const fallbackSpan = Math.max(Math.abs(baseline) * 0.01, 0.5);
      minBound -= fallbackSpan / 2;
      maxBound += fallbackSpan / 2;
      span = fallbackSpan;
    }

    const paddingRatio = 0.1;
    const minPadding = Math.max(span * paddingRatio, 0.25);
    const targetRange = {
      from: minBound - minPadding,
      to: maxBound + minPadding,
    };

    applyManualRange(targetRange);
  };

  const buildDummyZones = (candles: CandlestickData[]): Zone[] => {
    if (!candles.length) return [];

    const last = candles[candles.length - 1];
    if (!last || typeof last.close !== "number" || isNaN(last.close)) {
      return [];
    }

    const ref = last.close;

    const pick = (startBack: number, len: number) => {
      const s = Math.max(0, candles.length - 1 - startBack);
      const e = Math.max(0, Math.min(candles.length - 1, s + len));
      return { from: candles[s].time as number, to: candles[e].time as number };
    };

    const WEEKLY = "#f59e0b";
    const DAILY = "#3b82f6";
    const zones: Zone[] = [];

    {
      const { from, to } = pick(80, 40);
      const w = Math.abs(ref * 0.01);
      zones.push({
        id: "w-fire-1",
        kind: "weekly",
        ztype: "fire",
        from: from as Time,
        to: to as Time,
        center: ref,
        top: ref + w,
        bottom: ref - w,
        color: WEEKLY,
      });
    }
    {
      const { from, to } = pick(60, 30);
      zones.push({
        id: "w-mag-1",
        kind: "weekly",
        ztype: "magnet",
        from: from as Time,
        to: to as Time,
        center: ref * 0.998,
        top: ref * 1.006,
        bottom: ref * 0.99,
        color: WEEKLY,
      });
    }
    {
      const { from, to } = pick(30, 18);
      zones.push({
        id: "d-fire-1",
        kind: "daily",
        ztype: "fire",
        from: from as Time,
        to: to as Time,
        center: ref * 1.001,
        top: ref * 1.004,
        bottom: ref * 0.998,
        color: DAILY,
      });
    }
    {
      const { from, to } = pick(14, 10);
      zones.push({
        id: "d-mag-1",
        kind: "daily",
        ztype: "magnet",
        from: from as Time,
        to: to as Time,
        center: ref * 0.999,
        top: ref * 1.0025,
        bottom: ref * 0.995,
        color: DAILY,
      });
    }
    return zones;
  };

  const buildRealZones = (
    data: DealerBandsResponse,
    candles: CandlestickData[]
  ): Zone[] => {
    if (!candles.length) {
      return [];
    }

    if (!data.expected_move?.data) {
      return [];
    }

    console.log("ðŸ”§ Building zones with data:", {
      candlesCount: candles.length,
      expectedMoveData: data.expected_move.data,
      dailyZones: data.expected_move.data.daily_zones,
      weeklyZones: data.expected_move.data.weekly_zones,
    });

    const last = candles[candles.length - 1];
    if (!last || typeof last.close !== "number" || isNaN(last.close)) {
      console.log("[x] Invalid last candle data for zones:", last);
      return [];
    }

    const ltp = last.close; // Last Traded Price
    const zones: Zone[] = [];

    const startTime = last.time as number;

    const calculateTimeRange = (
      fromDate: string,
      toDate: string,
      fromTime?: string,
      toTime?: string
    ) => {
      console.log("ðŸ” calculateTimeRange called with:", {
        fromDate,
        toDate,
        fromTime,
        toTime,
      });

      try {
        const fromDateTimeStr = fromTime
          ? `${fromDate} ${fromTime}`
          : `${fromDate} 00:00:00`;
        const fromDateTime = new Date(fromDateTimeStr + " UTC");

        const toDateTimeStr = toTime
          ? `${toDate} ${toTime}`
          : `${toDate} 23:59:59`;
        let toDateTime = new Date(toDateTimeStr + " UTC");

        console.log("ðŸ“… Initial date parsing:", {
          fromDateTimeStr: fromDateTimeStr + " UTC",
          toDateTimeStr: toDateTimeStr + " UTC",
          fromDateTime: fromDateTime.toISOString(),
          toDateTime: toDateTime.toISOString(),
          fromValid: !isNaN(fromDateTime.getTime()),
          toValid: !isNaN(toDateTime.getTime()),
        });

        if (isNaN(fromDateTime.getTime()) || isNaN(toDateTime.getTime())) {
          console.log("[x] Invalid date/time parsing");
          return null;
        }

        if (
          fromDate === toDate &&
          toDateTime.getTime() <= fromDateTime.getTime()
        ) {
          console.log(
            "ðŸŒ™ Detected overnight time range, adding 1 day to end time"
          );
          toDateTime = new Date(toDateTime.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
          console.log("ðŸ”„ Adjusted to date:", toDateTime.toISOString());
        }

        if (
          fromDate !== toDate &&
          toDateTime.getTime() <= fromDateTime.getTime()
        ) {
          console.log(
            "ðŸ“… Detected cross-week time range, assuming next week occurrence"
          );
          toDateTime = new Date(toDateTime.getTime() + 7 * 24 * 60 * 60 * 1000); // Add 7 days
          console.log(
            "ðŸ”„ Adjusted to date for next week:",
            toDateTime.toISOString()
          );
        }

        const from = (fromDateTime.getTime() / 1000) as Time;
        const to = (toDateTime.getTime() / 1000) as Time;

        console.log("ðŸ•’ Final time comparison:", {
          fromTimestamp: from,
          toTimestamp: to,
          fromDate: new Date((from as number) * 1000).toLocaleString(),
          toDate: new Date((to as number) * 1000).toLocaleString(),
          isBackwards: (to as number) <= (from as number),
          durationHours: ((to as number) - (from as number)) / 3600,
        });

        if ((to as number) <= (from as number)) {
          console.log(
            "[x] Time still goes backwards after adjustments - rejecting range"
          );
          return null;
        }

        console.log("[ok] Valid time range calculated:", {
          from: new Date((from as number) * 1000).toLocaleString(),
          to: new Date((to as number) * 1000).toLocaleString(),
          durationHours: ((to as number) - (from as number)) / 3600,
        });

        return { from, to };
      } catch (error) {
        console.error("[x] Error calculating time range:", error);
        return null;
      }
    };

    const WEEKLY = "#f59e0b";
    const DAILY = "#3b82f6";

    if (data.expected_move.data.weekly_zones) {
      console.log("ðŸ“Š Building Weekly Zones...");
      const weekly = data.expected_move.data.weekly_zones;
      console.log("ðŸ“‹ Weekly zone data:", weekly);

      const timeRange = calculateTimeRange(
        weekly.weekly_expires_start,
        weekly.weekly_expires_end,
        weekly.weekly_expires_start_time,
        weekly.weekly_expires_end_time
      );

      if (timeRange) {
        if (weekly.fire_zones) {
          if (weekly.fire_zones.up) {
            zones.push({
              id: "weekly-fire-up",
              kind: "weekly",
              ztype: "fire",
              from: timeRange.from as Time,
              to: timeRange.to as Time,
              center: weekly.fire_zones.up.center,
              top: weekly.fire_zones.up.high,
              bottom: weekly.fire_zones.up.low,
              color: WEEKLY,
            });
          }

          if (weekly.fire_zones.down) {
            zones.push({
              id: "weekly-fire-down",
              kind: "weekly",
              ztype: "fire",
              from: timeRange.from as Time,
              to: timeRange.to as Time,
              center: weekly.fire_zones.down.center,
              top: weekly.fire_zones.down.high,
              bottom: weekly.fire_zones.down.low,
              color: WEEKLY,
            });
          }
        }

        if (weekly.magnet_zones) {
          if (weekly.magnet_zones.up) {
            zones.push({
              id: "weekly-magnet-up",
              kind: "weekly",
              ztype: "magnet",
              from: timeRange.from as Time,
              to: timeRange.to as Time,
              center: weekly.magnet_zones.up.center,
              top: weekly.magnet_zones.up.high,
              bottom: weekly.magnet_zones.up.low,
              color: WEEKLY,
            });
          }

          if (weekly.magnet_zones.down) {
            zones.push({
              id: "weekly-magnet-down",
              kind: "weekly",
              ztype: "magnet",
              from: timeRange.from as Time,
              to: timeRange.to as Time,
              center: weekly.magnet_zones.down.center,
              top: weekly.magnet_zones.down.high,
              bottom: weekly.magnet_zones.down.low,
              color: WEEKLY,
            });
          }
        }
      }
    }

    if (data.expected_move.data.daily_zones) {
      console.log("ðŸ“Š Building Daily Zones...");
      const daily = data.expected_move.data.daily_zones;
      console.log("ðŸ“‹ Daily zone data:", daily);

      const timeRange = calculateTimeRange(
        daily.daily_expires_start,
        daily.daily_expires_end,
        daily.daily_expires_time_start,
        daily.daily_expires_time_end
      );

      if (timeRange) {
        if (daily.fire_zones) {
          if (daily.fire_zones.up) {
            zones.push({
              id: "daily-fire-up",
              kind: "daily",
              ztype: "fire",
              from: timeRange.from as Time,
              to: timeRange.to as Time,
              center: daily.fire_zones.up.center,
              top: daily.fire_zones.up.high,
              bottom: daily.fire_zones.up.low,
              color: DAILY,
            });
          }

          if (daily.fire_zones.down) {
            zones.push({
              id: "daily-fire-down",
              kind: "daily",
              ztype: "fire",
              from: timeRange.from as Time,
              to: timeRange.to as Time,
              center: daily.fire_zones.down.center,
              top: daily.fire_zones.down.high,
              bottom: daily.fire_zones.down.low,
              color: DAILY,
            });
          }
        }

        if (daily.magnet_zones) {
          if (daily.magnet_zones.up) {
            zones.push({
              id: "daily-magnet-up",
              kind: "daily",
              ztype: "magnet",
              from: timeRange.from as Time,
              to: timeRange.to as Time,
              center: daily.magnet_zones.up.center,
              top: daily.magnet_zones.up.high,
              bottom: daily.magnet_zones.up.low,
              color: DAILY,
            });
          }

          if (daily.magnet_zones.down) {
            zones.push({
              id: "daily-magnet-down",
              kind: "daily",
              ztype: "magnet",
              from: timeRange.from as Time,
              to: timeRange.to as Time,
              center: daily.magnet_zones.down.center,
              top: daily.magnet_zones.down.high,
              bottom: daily.magnet_zones.down.low,
              color: DAILY,
            });
          }
        }
      }
    }

    console.log("ðŸŽ¯ Built real zones from API data:", zones);
    console.log(
      "ðŸ“‹ Zone details:",
      zones.map((z) => ({
        id: z.id,
        kind: z.kind,
        type: z.ztype,
        from: new Date((z.from as number) * 1000).toLocaleString(),
        to: new Date((z.to as number) * 1000).toLocaleString(),
        center: z.center,
        top: z.top,
        bottom: z.bottom,
      }))
    );
    return zones;
  };

  const memoZones = useMemo<Zone[]>(() => {
    if (!chartData || !chartData.candle) {
      console.log("ðŸ” No chartData or candle data for zones");
      return [];
    }

    try {
      const candles = convertCandleData(chartData.candle);
      const zones = buildRealZones(chartData, candles);
      console.log("ðŸŽ¨ MemoZones calculated:", zones.length, "zones");
      return zones;
    } catch (error) {
      console.error("[x] Error building zones:", error);
      return [];
    }
  }, [chartData]);

  const redrawOverlay = () => {
    const chart = chartRef.current;
    const overlay = overlayRef.current;
    const container = chartContainerRef.current;
    const series = candlestickSeriesRef.current;
    if (!chart || !overlay || !container || !series) {
      console.log("ðŸš« RedrawOverlay: Missing chart components");
      return;
    }

    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Get the OHLC header height to avoid overlap
    const headerElement = container.parentElement?.querySelector(
      ".bg-white.dark\\:bg-gray-800.border-b"
    ) as HTMLElement;
    const headerHeight = headerElement ? headerElement.offsetHeight : 60; // fallback to 60px

    overlay.width = Math.floor(w * dpr);
    overlay.height = Math.floor(h * dpr);
    overlay.style.width = `${w}px`;
    overlay.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);

    // Create clipping path to avoid drawing over OHLC header
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, headerHeight, w, h - headerHeight);
    ctx.clip();

    const {
      showWeekly: sw,
      showDaily: sd,
      showFire: sf,
      showMagnet: sm,
    } = togglesRef.current;
    const expSel = new Set(selectedExpectedRef.current);

    // filter by toggles + expected dropdown
    const toDraw = memoZones.filter((z) => {
      if (!sw && z.kind === "weekly") return false;
      if (!sd && z.kind === "daily") return false;
      if (!sf && z.ztype === "fire") return false;
      if (!sm && z.ztype === "magnet") return false;
      const key: ExpectedKey = `${z.kind}_${z.ztype}` as ExpectedKey;
      if (!expSel.has(key)) return false;
      return true;
    });

    console.log("ðŸŽ­ Zones to draw after filtering:", {
      totalZones: memoZones.length,
      filteredZones: toDraw.length,
      toggles: { showWeekly: sw, showDaily: sd, showFire: sf, showMagnet: sm },
      selectedExpected: Array.from(expSel),
    });

    const timeScale = chart.timeScale();

    // Sort zones by price level to handle overlapping labels better
    const sortedToDraw = [...toDraw].sort((a, b) => b.top - a.top);

    sortedToDraw.forEach((z, index) => {
      const x1 = timeScale.timeToCoordinate(z.from as any);
      const x2 = timeScale.timeToCoordinate(z.to as any);
      const yTop = series.priceToCoordinate(z.top);
      const yBot = series.priceToCoordinate(z.bottom);
      const yCtr = series.priceToCoordinate(z.center);

      if (
        x1 == null ||
        x2 == null ||
        yTop == null ||
        yBot == null ||
        yCtr == null
      )
        return;

      const left = Math.min(x1, x2);
      let right = Math.max(x1, x2);
      if (right - left < 2) right = left + 8; // visible min-width

      const width = Math.max(0, right - left);
      // Round coordinates for pixel-perfect alignment and add small offset to align with Y-axis
      const offset = 47; // Downward adjustment to align with Y-axis prices
      const roundedYTop = Math.round(yTop) + offset;
      const roundedYBot = Math.round(yBot) + offset;
      const roundedYCtr = Math.round(yCtr) + offset;
      const top = Math.min(roundedYTop, roundedYBot);
      const height = Math.abs(roundedYTop - roundedYBot);

      // Rectangle 20% opacity
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = z.color;
      ctx.fillRect(left, top, width, height);
      ctx.globalAlpha = 1;

      // Top dotted
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = z.color;
      ctx.moveTo(left, roundedYTop);
      ctx.lineTo(right, roundedYTop);
      ctx.stroke();

      // Bottom dotted
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = z.color;
      ctx.moveTo(left, roundedYBot);
      ctx.lineTo(right, roundedYBot);
      ctx.stroke();

      // Center solid
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = z.color;
      ctx.moveTo(left, roundedYCtr);
      ctx.lineTo(right, roundedYCtr);
      ctx.stroke();

      // (optional) midpoint for magnet
      if (z.ztype === "magnet") {
        const mid = (z.top + z.bottom) / 2;
        const yMid = series.priceToCoordinate(mid);
        if (yMid != null) {
          const roundedYMid = Math.round(yMid) + offset;
          ctx.beginPath();
          ctx.setLineDash([4, 6]);
          ctx.lineWidth = 1;
          ctx.strokeStyle = isDarkMode ? "#9ca3af" : "#6b7280";
          ctx.moveTo(left, roundedYMid);
          ctx.lineTo(right, roundedYMid);
          ctx.stroke();
        }
      }

      // Add center price label on the right side of the zone
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = isDarkMode ? "#ffffff" : "#000000";
      ctx.textAlign = "left";

      // Show center price on the right side, outside the zone
      const centerLabel = `$${z.center.toFixed(2)}`;
      const labelX = right + 5; // Right side of zone with small margin
      ctx.fillText(centerLabel, labelX, roundedYCtr + 4);
    });

    // Restore canvas context after clipping
    ctx.restore();
  };

  // Create / init chart
  useEffect(() => {
    if (!chartContainerRef.current || !chartData) return;

    // Validate chart data before proceeding
    if (!chartData || typeof chartData !== "object") {
      setError("Invalid chart data received");
      return;
    }

    if (
      !chartData.candle ||
      !Array.isArray(chartData.candle) ||
      chartData.candle.length === 0
    ) {
      setError("Invalid chart data received");
      return;
    }

    const currentDarkMode = isDarkMode;
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: currentDarkMode ? "#000000" : "#ffffff",
        },
        textColor: currentDarkMode ? "#ffffff" : "#333333",
        fontSize: 12,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      },
      width: chartContainerRef.current.clientWidth,
      height: Math.max(400, Math.min(800, window.innerHeight * 0.7)),
      grid: {
        vertLines: { color: "transparent", style: 0, visible: false },
        horzLines: { color: "transparent", style: 0, visible: false },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#758696", width: 1, style: 2 },
        horzLine: { color: "#758696", width: 1, style: 2 },
      },

      // [ok] NEW: Crosshair time ko 12-hour AM/PM me dikhane ke liye
      localization: {
        locale: "en-US",
        timeFormatter: (t: any) => {
          // UTCTimestamp (number)
          if (typeof t === "number") {
            const d = new Date(t * 1000);
            return d.toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: "UTC", // EST/EDT
            });
          }
          // BusinessDay (daily/timeframe without time)
          if (t && typeof t === "object") {
            const d = new Date(
              Date.UTC(t.year, (t.month ?? 1) - 1, t.day ?? 1)
            );
            return d.toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
            });
          }
          return String(t);
        },
      },

      rightPriceScale: {
        borderColor: currentDarkMode ? "#374151" : "#e1e3e6",
        borderVisible: true,
        scaleMargins: getScaleMarginsForInterval(selectedInterval), // Different margins for different intervals
        visible: true, // Always show price scale
        autoScale: true, // Auto-scale even when no data
        mode: 0, // Normal price scale mode
      },
      timeScale: {
        borderColor: currentDarkMode ? "#374151" : "#e1e3e6",
        borderVisible: true,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 4,
        fixLeftEdge: false, // Allow scrolling past data
        fixRightEdge: false, // Allow scrolling past data
        lockVisibleTimeRangeOnResize: false, // Don't lock time range
        // (aapka existing tickMarkFormatter rehne do)
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);

          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            timeZone: "UTC",
          });
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      visible: true, // Always keep series visible
      priceScaleId: "right", // Ensure it uses right price scale
    });
    candlestickSeriesRef.current = candlestickSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#c0c0c0",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      visible: true, // Always keep volume series visible
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      visible: true, // Always show volume scale
      autoScale: true, // Auto-scale even when no volume data
    });
    volumeSeriesRef.current = volumeSeries;

    // data
    if (
      !chartData.candle ||
      !Array.isArray(chartData.candle) ||
      chartData.candle.length === 0
    ) {
      return;
    }

    // Ensure chart and series are properly initialized
    if (!chart || !candlestickSeries || !volumeSeries) {
      return;
    }

    try {
      const candlestickData = convertCandleData(chartData.candle);
      const volumeData = convertVolumeData(chartData.candle);

      // Validate converted data
      if (!Array.isArray(candlestickData) || !Array.isArray(volumeData)) {
        return;
      }

      // Ensure volume data covers all dates for complete time axis
      const completeVolumeData = ensureCompleteVolumeData(
        chartData.candle,
        volumeData
      );

      // Create a comprehensive time scale that includes all dates
      const allDates = chartData.candle
        .map((candle) => {
          // Combine date and time to create timestamp
          // Treat API time as UTC to avoid timezone conversion issues
          const dateTimeStr = `${candle["6. date"]} ${candle["7. time"]}`;
          const date = new Date(dateTimeStr + " UTC");
          const timestamp = (date.getTime() / 1000) as Time;
          return timestamp;
        })
        .sort((a, b) => (a as number) - (b as number));

      // Set the time scale to show all dates - with additional null checks
      if (
        allDates.length > 0 &&
        allDates[0] !== null &&
        allDates[allDates.length - 1] !== null
      ) {
        try {
          chart.timeScale().setVisibleRange({
            from: allDates[0] as Time,
            to: allDates[allDates.length - 1] as Time,
          });

          // Subscribe to visible time range changes to maintain Y-axis visibility
          chart.timeScale().subscribeVisibleTimeRangeChange(() => {
            // Ensure price scales remain visible even when no data in range
            try {
              chart
                .priceScale("right")
                .applyOptions({ visible: true, autoScale: true });
              chart
                .priceScale("volume")
                .applyOptions({ visible: true, autoScale: true });
            } catch (error) {
              // Ignore scale update errors
            }
          });
        } catch (rangeError) {
          // Could not set visible range, using default
        }
      }

      // Set volume data first to establish the complete time axis with all dates
      // This approach eliminates the need for placeholder candles while maintaining date coverage
      if (completeVolumeData.length > 0) {
        try {
          volumeSeries.setData(completeVolumeData);
        } catch (volumeError) {
          console.error("Error setting volume data:", volumeError);
        }
      }

      // Only set valid candles - no placeholder candles needed
      // The volume data maintains the complete time axis, eliminating NaN assertion errors
      if (candlestickData.length > 0) {
        try {
          candlestickSeries.setData(candlestickData);

          // LTP Positioning: Ensure the Last Traded Price line stays on the last valid candle
          const lastValidCandle = findLastValidCandle(candlestickData);
          if (lastValidCandle) {
            // Move the chart view to focus on the last valid candle
            try {
              chart.timeScale().scrollToPosition(0, false);

              // Create LTP price line that extends to volume chart area
              createLTPPriceLine(
                lastValidCandle.close,
                chart,
                candlestickSeries
              );
            } catch (scrollError) {
              // Could not scroll to last valid candle
            }
          }
        } catch (setDataError) {
          console.error("Error setting chart data:", setDataError);
        }
      }
    } catch (error) {
      console.error("Error converting chart data:", error);
      setError("Error processing chart data");
      return;
    }

    // Tooltip
    chart.subscribeCrosshairMove((param) => {
      const container = chartContainerRef.current;
      if (!container) return;
      const existingTooltip = container.querySelector(".custom-tooltip");
      if (existingTooltip) existingTooltip.remove();

      if (!param.point || !param.time) {
        setCurrentHoverData(null);
        return;
      }

      const data = param.seriesData.get(candlestickSeries) as CandlestickData;
      const vData = param.seriesData.get(volumeSeries) as HistogramData;
      if (!data) {
        setCurrentHoverData(null);
        return;
      }

      // Find the corresponding API candle data for this hover point to get change values
      const hoverTimestamp = data.time as number;
      const correspondingApiCandle = chartData?.candle?.find((candle) => {
        const candleDateTime = `${candle["6. date"]} ${candle["7. time"]}`;
        const candleDate = new Date(candleDateTime + " UTC");
        const candleTimestamp = Math.floor(candleDate.getTime() / 1000);
        return candleTimestamp === hoverTimestamp;
      });

      // Use API change values - no fallback to local calculation
      let hoverChange = 0;
      let hoverChangePercent = 0;

      if (
        correspondingApiCandle &&
        (correspondingApiCandle as any)["8. change_val"] !== null &&
        (correspondingApiCandle as any)["9. change_pct"] !== null
      ) {
        hoverChange = parseFloat(
          (correspondingApiCandle as any)["8. change_val"]
        );
        const changePercentStr = (correspondingApiCandle as any)[
          "9. change_pct"
        ]
          .toString()
          .replace("%", "");
        hoverChangePercent = parseFloat(changePercentStr);
      }

      const hoverVolume = vData ? vData.value : 0;

      const hoverDate = new Date((data.time as number) * 1000);
      setCurrentHoverData({
        time: `${hoverDate.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        })}, ${hoverDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC",
        })}`,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: hoverVolume,
        change: hoverChange,
        changePercent: hoverChangePercent,
      });

      const tooltip = document.createElement("div");
      tooltip.className = "custom-tooltip";
      tooltip.style.cssText = `
        position: absolute;
        background: ${
          currentDarkMode ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.95)"
        };
        color: ${currentDarkMode ? "white" : "#333333"};
        padding: 12px;
        border-radius: 6px;
        font-size: 12px;
        font-family: Inter, sans-serif;
        pointer-events: none;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 1px solid ${
          currentDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
        };
      `;

      // Use the exact time from the API data without timezone conversion
      // Display exactly what the API sends
      const date = new Date((data.time as number) * 1000);
      const timeStr = date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const volumeStr = vData
        ? vData.value > 1_000_000
          ? `${(vData.value / 1_000_000).toFixed(1)}M`
          : vData.value > 1_000
          ? `${(vData.value / 1_000).toFixed(0)}K`
          : vData.value.toString()
        : "";
      const isUp = hoverChange >= 0;
      const changeColor = isUp ? "#22c55e" : "#ef4444";
      const tooltipChange = hoverChangePercent.toFixed(2);
      const tooltipChangeValue = hoverChange.toFixed(2);
      const labelColor = currentDarkMode ? "#888" : "#666";
      const textColor = currentDarkMode ? "white" : "#333";
      const borderColor = currentDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)";

      // Format time more clearly to avoid confusion
      // The date object is already in UTC from the API, so we format it directly
      const tooltipTimeStr = date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC", // Ensure we display the exact API time
      });

      tooltip.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: 600; color: ${
          currentDarkMode ? "#f0f0f0" : "#333"
        };">
          ${currentSymbol} | ${tooltipTimeStr}
        </div>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <div><span style="color: ${labelColor};">Open:</span> <span style="color: ${textColor};">$${data.open.toFixed(
        2
      )}</span></div>
          <div><span style="color: ${labelColor};">High:</span> <span style="color: #22c55e;">$${data.high.toFixed(
        2
      )}</span></div>
          <div><span style="color: ${labelColor};">Low:</span> <span style="color: #ef4444;">$${data.low.toFixed(
        2
      )}</span></div>
          <div><span style="color: ${labelColor};">Close:</span> <span style="color: ${changeColor};">$${data.close.toFixed(
        2
      )}</span></div>
          <div><span style="color: ${labelColor};">Change:</span> <span style="color: ${changeColor};">${
        isUp ? "+" : ""
      }$${tooltipChangeValue} (${isUp ? "+" : ""}${tooltipChange}%)</span></div>
          ${
            volumeStr
              ? `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid ${borderColor};"><span style="color: ${labelColor};">Volume:</span> <span style="color: ${textColor};">${volumeStr}</span></div>`
              : ""
          }
        </div>
      `;
      const x = param.point.x;
      const y = param.point.y;
      tooltip.style.left = `${x + 15}px`;
      tooltip.style.top = `${y - 10}px`;
      container.appendChild(tooltip);
      const tooltipRect = tooltip.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (tooltipRect.right > containerRect.right)
        tooltip.style.left = `${x - tooltipRect.width - 15}px`;
      if (tooltipRect.top < containerRect.top)
        tooltip.style.top = `${y + 15}px`;
      if (tooltipRect.bottom > containerRect.bottom)
        tooltip.style.top = `${y - tooltipRect.height - 15}px`;
    });

    // Fit content
    chart.timeScale().fitContent();

    // Overlay: create & subscribe
    const overlay = document.createElement("canvas");
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "1000";
    overlayRef.current = overlay;
    chartContainerRef.current!.appendChild(overlay);

    chart.timeScale().subscribeVisibleTimeRangeChange(() => redrawOverlay());
    (chart.timeScale() as any).subscribeVisibleLogicalRangeChange?.(() =>
      redrawOverlay()
    );

    // Add mouse event listeners to detect chart interactions and redraw zones
    const chartElement = chartContainerRef.current;
    const handleChartInteraction = () => {
      // Use requestAnimationFrame to ensure redraw happens after chart updates
      requestAnimationFrame(() => redrawOverlay());
    };

    // Track if user is currently dragging/scaling
    let isInteracting = false;
    let animationId: number | null = null;

    const startInteraction = () => {
      isInteracting = true;
      // Start continuous redraw during interaction
      const continuousRedraw = () => {
        if (isInteracting) {
          redrawOverlay();
          animationId = requestAnimationFrame(continuousRedraw);
        }
      };
      continuousRedraw();
    };

    const stopInteraction = () => {
      isInteracting = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      // Final redraw when interaction stops
      requestAnimationFrame(() => redrawOverlay());
    };

    // Mouse events
    chartElement.addEventListener("mousedown", startInteraction);
    chartElement.addEventListener("mouseup", stopInteraction);
    chartElement.addEventListener("mouseleave", stopInteraction);

    // Wheel events for scaling
    chartElement.addEventListener("wheel", handleChartInteraction);

    // Touch events for mobile
    chartElement.addEventListener("touchstart", startInteraction);
    chartElement.addEventListener("touchend", stopInteraction);
    chartElement.addEventListener("touchcancel", stopInteraction);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        const newHeight = Math.max(
          400,
          Math.min(800, window.innerHeight * 0.7)
        );
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: newHeight,
        });
        applyZoneAutoScale();
        redrawOverlay();
      }
    };
    window.addEventListener("resize", handleResize);

    // Delay initial overlay draw to ensure chart is fully rendered
    setTimeout(() => {
      redrawOverlay();
    }, 100);

    // also sync price lines initially
    syncPriceLines();

    // Update LTP line if we have valid data
    if (chartData && chartData.candle) {
      const candlestickData = convertCandleData(chartData.candle);
      const lastValidCandle = findLastValidCandle(candlestickData);
      if (lastValidCandle) {
        createLTPPriceLine(lastValidCandle.close, chart, candlestickSeries);
      }
    }

    // Create zone price highlights after chart is set up
    if (memoZones.length > 0) {
      createZonePriceHighlights(memoZones, candlestickSeries);
      applyZoneAutoScale();
    }

    return () => {
      window.removeEventListener("resize", handleResize);

      // Clean up chart interaction event listeners
      if (chartElement) {
        chartElement.removeEventListener("mousedown", startInteraction);
        chartElement.removeEventListener("mouseup", stopInteraction);
        chartElement.removeEventListener("mouseleave", stopInteraction);
        chartElement.removeEventListener("wheel", handleChartInteraction);
        chartElement.removeEventListener("touchstart", startInteraction);
        chartElement.removeEventListener("touchend", stopInteraction);
        chartElement.removeEventListener("touchcancel", stopInteraction);
      }

      // Cancel any ongoing animation
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      if (chartContainerRef.current) {
        const tooltip =
          chartContainerRef.current.querySelector(".custom-tooltip");
        if (tooltip) tooltip.remove();
      }
      // remove price lines
      try {
        const series = candlestickSeriesRef.current;
        if (series && priceLinesRef.current) {
          Object.values(priceLinesRef.current).forEach((pl: any) =>
            series.removePriceLine(pl)
          );
        }
        // Remove zone price lines
        if (series && zonePriceLinesRef.current) {
          zonePriceLinesRef.current.forEach((pl: any) => {
            try {
              series.removePriceLine(pl);
            } catch (e) {
              // Ignore errors
            }
          });
        }
      } catch {}
      priceLinesRef.current = {};
      zonePriceLinesRef.current = [];

      if (overlayRef.current?.parentElement)
        overlayRef.current.parentElement.removeChild(overlayRef.current);
      overlayRef.current = null;

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDarkMode, chartData]);

  // Redraw overlay when toggles/zones or expected dropdown change
  useEffect(() => {
    redrawOverlay();
    // Update zone price highlights when zones or toggles change
    if (candlestickSeriesRef.current && memoZones.length > 0) {
      applyZoneAutoScale();
      createZonePriceHighlights(memoZones, candlestickSeriesRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showWeekly,
    showDaily,
    showFire,
    showMagnet,
    memoZones,
    selectedExpected,
  ]);

  // [ok] NEW: sync price lines whenever selection or data changes
  const syncPriceLines = () => {
    const series = candlestickSeriesRef.current;
    if (!series || !chartData) return;

    // remove old lines
    Object.values(priceLinesRef.current).forEach((pl: any) => {
      try {
        series.removePriceLine(pl);
      } catch {}
    });
    priceLinesRef.current = {};

    const entries = getLevelEntries(chartData).filter(({ key }) =>
      selectedLevelsRef.current.includes(key)
    );

    entries.forEach(({ key, lvl }) => {
      const line = series.createPriceLine({
        price: lvl.price,
        color: lvl.color,
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: lvl.label,
        lineVisible: true,
      });
      priceLinesRef.current[key] = line;
    });
  };

  useEffect(() => {
    syncPriceLines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevels, chartData]);

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // --- Helpers for dropdown rendering ---
  const toggleLevel = (k: PriceLevelKey) => {
    setSelectedLevels((prev) =>
      prev.includes(k) ? prev.filter((i) => i !== k) : [...prev, k]
    );
  };
  const toggleExpected = (k: ExpectedKey) => {
    setSelectedExpected((prev) =>
      prev.includes(k) ? prev.filter((i) => i !== k) : [...prev, k]
    );
  };

  const levelLabels: Record<PriceLevelKey, string> = {
    max_pain: "Max Pain",
    total_gamma_flip: "Total Gamma Flip",
    abs_gex: "Abs GEX",
    p1: "Top +GEX C1",
    p2: "Top +GEX C2",
    p3: "Top +GEX C3",
    n1: "Top -GEX P1",
    n2: "Top -GEX P2",
    n3: "Top -GEX P3",
  };

  const expectedLabels: Record<ExpectedKey, string> = {
    daily_fire: "Daily - Fire",
    daily_magnet: "Daily - Magnet",
    weekly_fire: "Weekly - Fire",
    weekly_magnet: "Weekly - Magnet",
  };

  return (
    <div className={`w-full h-auto p-2`}>
      {/* Currently Selected Ticker Display */}
      <div className="mb-4 p-3 bg-gradient-to-r from-[#00FBC7]/10 to-[#00d4aa]/10 border border-[#00FBC7]/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 ">
            <div className="w-2 h-2 bg-[#00FBC7] rounded-full animate-pulse"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Currently Viewing:
              </span>
              <span className="text-lg font-bold dark:text-[#00FBC7] text-zinc-900">
                {currentSymbol}
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Last Updated
              </span>
              {snapshotDate && (
                <span className="text-sm font-semibold dark:text-[#00FBC7] text-gray-900 dark:text-white">
                  {snapshotDate} EST
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Controls in one responsive row */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
        {/* Search Section */}
        <div className="flex items-center gap-2 lg:gap-4">
          <span className="text-sm lg:text-lg font-bold whitespace-nowrap">
            Search Ticker:
          </span>
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search tickers (e.g., AAPL, TSLA, BA)..."
                className="w-48 sm:w-64 lg:w-80 pl-10 pr-10 py-2 bg-transparent border border-[#00d4aa] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00FBC7] font-medium text-black dark:text-white placeholder-gray-400"
              />
              {(searchQuery || searchLoading) && (
                <button
                  onClick={clearSearch}
                  disabled={searchLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 disabled:opacity-50"
                >
                  {searchLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchResults.map((ticker, index) => (
                  <button
                    key={`${ticker.symbol}-${index}`}
                    onClick={() => handleTickerSelect(ticker)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      index === selectedIndex
                        ? "bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ticker.symbol}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {ticker.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="relative" ref={levelsDDRef}>
          <button
            onClick={() => setOpenLevelsDD((v) => !v)}
            className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Price Levels
          </button>
          {openLevelsDD && (
            <div className="absolute z-50 mt-1 w-64 max-w-[18rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Show Lines
                </span>
                <div className="flex gap-2 text-xs">
                  <button
                    className="underline text-blue-600 dark:text-blue-400"
                    onClick={() => setSelectedLevels(allLevelKeys)}
                  >
                    All
                  </button>
                  <button
                    className="underline text-blue-600 dark:text-blue-400"
                    onClick={() => setSelectedLevels([])}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-56 overflow-auto pr-1 space-y-1">
                {allLevelKeys.map((k) => (
                  <label
                    key={k}
                    className="flex items-center gap-2 text-sm py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLevels.includes(k)}
                      onChange={() => toggleLevel(k)}
                    />
                    <span className="text-gray-800 dark:text-gray-100">
                      {levelLabels[k]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={expectedDDRef}>
          <button
            onClick={() => setOpenExpectedDD((v) => !v)}
            className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Expected Zones
          </button>
          {openExpectedDD && (
            <div className="absolute z-50 mt-1 w-64 max-w-[18rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Show Zones
                </span>
                <div className="flex gap-2 text-xs">
                  <button
                    className="underline text-blue-600 dark:text-blue-400"
                    onClick={() => setSelectedExpected(allExpectedKeys)}
                  >
                    All
                  </button>
                  <button
                    className="underline text-blue-600 dark:text-blue-400"
                    onClick={() => setSelectedExpected([])}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-56 overflow-auto pr-1 space-y-1">
                {allExpectedKeys.map((k) => (
                  <label
                    key={k}
                    className="flex items-center gap-2 text-sm py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExpected.includes(k)}
                      onChange={() => toggleExpected(k)}
                    />
                    <span className="text-gray-800 dark:text-gray-100">
                      {expectedLabels[k]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Time Interval */}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Time Interval:
        </span>
        <div className="flex gap-1">
          {["1min", "5min", "15min", "1DAY"].map((interval) => (
            <button
              key={interval}
              onClick={() => setSelectedInterval(interval)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedInterval === interval
                  ? "bg-[#00FBC7] text-black border border-[#00FBC7]"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative bg-white dark:bg-gray-800">
        {/* Current Candle Data Header - Shows LTP by default, hover data when hovering */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 overflow-x-auto">
          <div className="flex items-center gap-6 text-sm min-w-max">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                Ticker:
              </span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {currentSymbol}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                ({selectedInterval})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                Date:
              </span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {(currentHoverData || ltpData)?.time
                  ? (currentHoverData || ltpData)?.time.split(",")[0]
                  : new Date().toLocaleDateString("en-GB")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                Time:
              </span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {(currentHoverData || ltpData)?.time
                  ? (currentHoverData || ltpData)?.time.split(",")[1]?.trim() +
                    " EST"
                  : new Date().toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }) + " EST"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                O:
              </span>
              <span className="text-gray-900 dark:text-white font-semibold">
                ${(currentHoverData || ltpData)?.open?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                H:
              </span>
              <span className="text-green-600 dark:text-green-400 font-semibold">
                ${(currentHoverData || ltpData)?.high?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                L:
              </span>
              <span className="text-red-600 dark:text-red-400 font-semibold">
                ${(currentHoverData || ltpData)?.low?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                C:
              </span>
              <span className="text-gray-900 dark:text-white font-semibold">
                ${(currentHoverData || ltpData)?.close?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                Change:
              </span>
              <span
                className={`font-semibold ${
                  ((currentHoverData || ltpData)?.change ?? 0) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {((currentHoverData || ltpData)?.change ?? 0) >= 0 ? "+" : ""}
                {(currentHoverData || ltpData)?.change?.toFixed(2) || "0.00"} (
                {(currentHoverData || ltpData)?.changePercent?.toFixed(2) ||
                  "0.00"}
                %)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                Vol:
              </span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {((currentHoverData || ltpData)?.volume ?? 0) > 1_000_000
                  ? `${(
                      ((currentHoverData || ltpData)?.volume ?? 0) / 1_000_000
                    ).toFixed(2)}M`
                  : ((currentHoverData || ltpData)?.volume ?? 0) > 1_000
                  ? `${(
                      ((currentHoverData || ltpData)?.volume ?? 0) / 1_000
                    ).toFixed(0)}K`
                  : ((currentHoverData || ltpData)?.volume ?? 0).toString()}
              </span>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 z-10">
            <div className="w-full h-full">
              <div className="h-16 bg-gray-100 dark:bg-gray-700 mb-4" />
              <div className="px-4">
                <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg relative overflow-hidden" />
              </div>
            </div>
          </div>
        )}
        <div
          ref={chartContainerRef}
          className="w-full"
          style={{
            height: `${Math.max(
              400,
              Math.min(
                800,
                typeof window !== "undefined" ? window.innerHeight * 0.7 : 600
              )
            )}px`,
            minHeight: "400px",
          }}
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
