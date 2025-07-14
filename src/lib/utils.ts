import { SocialMediaData } from "@/app/strategies/[slug]/components/SocialMediaNode";
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

export const extractVideoInfoFromUrl = (
  url: string
): SocialMediaData | null => {
  const SUPPORTED_PATTERNS = {
    youtube: {
      patterns: [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      ],
      thumbnail: (id: string) =>
        `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      title: (id: string) => `YouTube Video (${id})`,
    },
    tiktok: {
      patterns: [
        /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
        /vm\.tiktok\.com\/(\w+)/,
      ],
      thumbnail: () => "https://placehold.co/640x360?text=TikTok+Preview",
      title: (id: string) => `TikTok Video (${id})`,
    },
    facebook: {
      patterns: [
        /facebook\.com\/watch\/\?v=(\d+)/,
        /facebook\.com\/[\w.]+\/videos\/(\d+)/,
        /fb\.watch\/([\w_-]+)/,
      ],
      thumbnail: () => "https://placehold.co/640x360?text=Facebook+Preview",
      title: (id: string) => `Facebook Video (${id})`,
    },
    instagram: {
      patterns: [
        /instagram\.com\/(p|reel|tv)\/([\w-]+)/,
        /instagram\.com\/stories\/[\w.]+\/(\d+)/,
      ],
      thumbnail: () => "https://placehold.co/640x360?text=Instagram+Preview",
      title: (id: string) => `Instagram Video (${id})`,
    },
  };

  for (const [platform, config] of Object.entries(SUPPORTED_PATTERNS)) {
    for (const pattern of config.patterns) {
      const match = url.match(pattern);
      if (match) {
        const videoId = match[1] || match[2] || "";
        return {
          url,
          platform,
          videoId,
          thumbnail: config.thumbnail(videoId),
          title: config.title(videoId),
          author: "",
          duration: "",
        };
      }
    }
  }

  return null; // No matching platform
};
