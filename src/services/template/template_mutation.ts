import { endpoints } from "@/lib/endpoints";
import axiosInstance from "../axios";

export const useTemplate = async (data: { templateId: string }) => {
  const res = await axiosInstance.post(
    endpoints.TEMPLATE.CREATE(data.templateId),
    data
  );
  return res.data;
};

export const toggleTemplate = async (strategyId: string) => {
  const res = await axiosInstance.patch(endpoints.TEMPLATE.TOGGLE(strategyId));
  return res.data;
};
