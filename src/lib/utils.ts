import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPeerTypeFromNodeType = (nodeType: string): string => {
  // image, audio, video, docs, social_media, remote, thread, annotation,

  const nodeTypeToPeerTypeMap: Record<string, string> = {
    imageUploadNode: "image",
    audioPlayerNode: "audio",
    videoUploadNode: "video",
    documentUploadNode: "docs",
    socialMediaNode: "social_media",
    remoteNode: "remote",
    chatbox: "thread",
    annotationNode: "annotation",
  };
  // Return the corresponding peer type or an empty string if not found
  return nodeTypeToPeerTypeMap[nodeType] || "";
};
