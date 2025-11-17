import { endpoints } from "@/lib/endpoints";
import axiosInstance from "../axios";

export const inviteUsers = async (payload: {
  strategyId: string;
  emails: string[];
}) => {
  const res = await axiosInstance.post(
    endpoints.INVITATION.INVITE(payload?.strategyId),
    { emails: payload?.emails || [] }
  );
  return res.data;
};

export const acceptInvitation = async (data: { invitationId: string }) => {
  const res = await axiosInstance.patch(
    endpoints.INVITATION.ACCEPT(data?.invitationId)
  );
  return res.data;
};

export const rejectInvitation = async (data: {
  invitationId: string;
  message: string;
}) => {
  const res = await axiosInstance.patch(
    endpoints.INVITATION.REJECT(data?.invitationId),
    { message: data?.message }
  );
  return res.data;
};
