import { endpoints } from "@/lib/endpoints";
import { SignupData } from "./auth_Mutation";
import axiosInstance from "../axios";

// Get logged-in user profile
export const getUser = async () => {
  const response = await axiosInstance.get(endpoints.USER.PROFILE);
  return response.data;
};

// Register a new user
export const createUser = async (userData: SignupData) => {
  const response = await axiosInstance.post(endpoints.AUTH.SIGNUP, userData);
  return response.data;
};
