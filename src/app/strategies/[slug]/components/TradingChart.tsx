// components/TradingChart.tsx
"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

const data = {
  datasets: [
    {
      label: "BTC/USDT",
      data: [
        { x: "2023-01-01", o: 21000, h: 21500, l: 20500, c: 21200 },
        { x: "2023-01-02", o: 21200, h: 22000, l: 21000, c: 21800 },
        { x: "2023-01-03", o: 21800, h: 22500, l: 21500, c: 22200 },
        { x: "2023-01-04", o: 22200, h: 23000, l: 22000, c: 22800 },
      ],
      color: {
        up: "#00ff00",
        down: "#ff0000",
        unchanged: "#999",
      },
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    x: {
      type: "time",
      time: { unit: "day" },
      ticks: { source: "auto" },
    },
    y: {
      beginAtZero: false,
    },
  },
};

export default function TradingChart() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* @ts-ignore */}
      <Chart type="candlestick" data={data} options={options} />
    </div>
  );
}
