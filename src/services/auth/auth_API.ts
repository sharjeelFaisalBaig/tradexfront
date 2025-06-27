import { endpoints } from "@/lib/endpoints";
import { SignupData } from "./auth_Mutation";

export const getUsers = async () => {
  const response = await fetch(endpoints.USER.PROFILE);
  return await response.json();
};

export const createUser = async (userData: SignupData) => {
  const response = await fetch(endpoints.AUTH.SIGNUP, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });
  
  return await response.json();
};
