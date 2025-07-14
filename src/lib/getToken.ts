import { auth } from "@/lib/auth";

export const getToken = async () => {
  const session = await auth();
  return session?.accessToken;
};
