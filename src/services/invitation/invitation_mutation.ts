import { endpoints } from "@/lib/endpoints";
import { Folder } from "@/lib/types";
import axiosInstance from "../axios";

export const inviteUsers = async (payload: {
  strategyId: string;
  emails: string[];
}) => {
  const res = await axiosInstance.post(
    endpoints.INVITATION.INVITE(payload?.strategyId),
    { email: payload?.emails?.[0] || [] }
  );
  return res.data;
};

export const acceptInvitation = async (data: Partial<Folder>) => {
  const res = await axiosInstance.post(endpoints.FOLDER.CREATE, data);
  return res.data;
};
