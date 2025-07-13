import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPeerTypeFromNodeType = (nodeType: string): string => {
  const nodeTypeToPeerTypeMap: Record<string, string> = {
    imageUploadNode: "aiImagePeers",
    audioPlayerNode: "aap",
    videoUploadNode: "avp",
    documentUploadNode: "adp",
    socialMediaNode: "asp",
    remoteNode: "arp",
    threadNode: "acp",
  };
  // Return the corresponding peer type or an empty string if not found
  return nodeTypeToPeerTypeMap[nodeType] || "";
};
