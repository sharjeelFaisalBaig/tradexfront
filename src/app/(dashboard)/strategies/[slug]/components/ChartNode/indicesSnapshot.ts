import axiosInstance from "@/services/axios";

export const fetchStockSnapshot = async () => {
  try {
    const res = await axiosInstance.get("/indices/snapshot");
    return {
      data: res.data.data,
      snapshot_date: res.data.snapshot_date,
    };
  } catch (err) {
    console.error("Stock Snapshot API error:", err);
    return {
      data: [],
      snapshot_date: null,
    };
  }
};
