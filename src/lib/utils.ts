"use client";

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getFilteredAiModels = (
  data: {
    id: string;
    name: string;
    extras: {
      color: string;
    };
  }[]
) => {
  return (
    data?.map((model) => ({
      id: model.id,
      name: model.name,
      color: model.extras.color,
      // color: `bg-[${model.extras.color}]`,
    })) || []
  );
};

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
        /vm\.tiktok\.com\/(\w+)\/?/,
        /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/video\/[0-9]+\/?/,
        /^https?:\/\/(vt\.)?tiktok\.com\/[a-zA-Z0-9]+\/?/,
        /^https?:\/\/(vm\.)?tiktok\.com\/[a-zA-Z0-9]+\/?/,
        /^https?:\/\/(www\.)?tiktok\.com\/[a-zA-Z0-9_.]+\/video\/[0-9]+\/?/,
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

// Types for social media data and URL validation
export interface SocialMediaData {
  url: string;
  platform: string;
  videoId: string;
  thumbnail: string;
  title: string;
  author?: string;
  duration?: string;
}

export interface URLValidationResult {
  isValid: boolean;
  platform?: string;
  error?: string;
  warning?: string;
}

// Supported platforms with their URL patterns and branding
export const SUPPORTED_PLATFORMS = {
  instagram: {
    name: "Instagram",
    icon: "📷",
    color: "from-purple-500 to-pink-500",
    textColor: "text-purple-600",
    patterns: [
      /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+/,
      /^https?:\/\/(www\.)?instagram\.com\/stories\/[a-zA-Z0-9_.]+\/[0-9]+/,
      /^https?:\/\/(www\.)?instagram\.com\/s\/[a-zA-Z0-9_-]+/,
    ],
  },
  youtube: {
    name: "YouTube",
    icon: "🎥",
    color: "from-red-500 to-red-600",
    textColor: "text-red-600",
    patterns: [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/(www\.)?youtu\.be\/[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/,
    ],
  },
  tiktok: {
    name: "TikTok",
    icon: "🎵",
    color: "from-black to-gray-800",
    textColor: "text-gray-800",
    patterns: [
      /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/video\/[0-9]+/,
      /^https?:\/\/(vm\.)?tiktok\.com\/[a-zA-Z0-9]+/,
      /^https?:\/\/(www\.)?tiktok\.com\/[a-zA-Z0-9_.]+\/video\/[0-9]+/,
    ],
  },
  facebook: {
    name: "Facebook",
    icon: "📘",
    color: "from-blue-600 to-blue-700",
    textColor: "text-blue-600",
    patterns: [
      /^https?:\/\/(www\.)?facebook\.com\/watch\/?v=[0-9]+/,
      /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/videos\/[0-9]+/,
      /^https?:\/\/(www\.)?fb\.watch\/[a-zA-Z0-9_-]+/,
      /^https?:\/\/(www\.)?facebook\.com\/share\/r\/[a-zA-Z0-9_-]+\/?$/,
    ],
  },
};

export const validateSocialMediaUrl = (url: string): URLValidationResult => {
  if (!url.trim()) {
    return { isValid: false, error: "Please enter a URL" };
  }
  try {
    new URL(url);
  } catch {
    return { isValid: false, error: "Please enter a valid URL" };
  }
  for (const [platform, config] of Object.entries(SUPPORTED_PLATFORMS)) {
    if (config.patterns.some((pattern) => pattern.test(url))) {
      return { isValid: true, platform };
    }
  }
  return {
    isValid: false,
    error:
      "Unsupported platform. Please use Instagram, YouTube, TikTok, or Facebook video URLs.",
  };
};

export const extractSocialVideoDetails = (
  url: string
): SocialMediaData | null => {
  const validation = validateSocialMediaUrl(url);
  if (!validation.isValid || !validation.platform) {
    return null;
  }

  const platform = validation.platform;
  let videoId = "";
  let thumbnail = "/placeholder.svg?height=360&width=640"; // Default placeholder

  try {
    const parsedUrl = new URL(url);

    if (platform === "youtube") {
      if (parsedUrl.searchParams.get("v")) {
        videoId = parsedUrl.searchParams.get("v")!;
      } else if (parsedUrl.hostname.includes("youtu.be")) {
        videoId = parsedUrl.pathname.split("/")[1];
      } else if (parsedUrl.pathname.startsWith("/shorts/")) {
        videoId = parsedUrl.pathname.split("/")[2];
      } else if (parsedUrl.pathname.startsWith("/embed/")) {
        videoId = parsedUrl.pathname.split("/")[2];
      }
      if (videoId && videoId.includes("?")) {
        videoId = videoId.split("?")[0];
      }
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } else if (platform === "facebook") {
      // For Facebook, try to extract video ID from common patterns
      if (parsedUrl.pathname.startsWith("/reel/")) {
        videoId = parsedUrl.pathname.split("/")[2];
      } else if (parsedUrl.pathname.startsWith("/watch")) {
        videoId = parsedUrl.searchParams.get("v") || "";
      } else if (parsedUrl.pathname.includes("/videos/")) {
        videoId = parsedUrl.pathname.split("/videos/")[1]?.split("/")[0] || "";
      } else if (parsedUrl.hostname.includes("fb.watch")) {
        const match = url.match(/fb\.watch\/([a-zA-Z0-9_-]+)/);
        if (match) videoId = match[1];
      } else if (parsedUrl.pathname.startsWith("/share/r/")) {
        const match = url.match(/\/share\/r\/([a-zA-Z0-9_-]+)/);
        if (match) videoId = match[1];
      }

      // Facebook public thumbnail access is limited client-side without Graph API token.
      // Using a specific placeholder for clarity.
      thumbnail = `/placeholder.svg?height=360&width=640&text=Facebook+Video`;
    } else if (platform === "instagram") {
      let shortcode = "";
      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      if (["p", "reel", "tv"].includes(parts[0]) && parts[1]) {
        shortcode = parts[1];
      }
      videoId = shortcode;
      // Instagram does not provide a public thumbnail endpoint without authentication.
      // Using a specific placeholder for clarity.
      thumbnail = `/placeholder.svg?height=360&width=640&text=Instagram+Video`;
    } else if (platform === "tiktok") {
      const match = url.match(/video\/(\d+)/);
      if (match) {
        videoId = match[1];
      }
      // TikTok thumbnail will be fetched by a separate useEffect in the component using oEmbed.
      thumbnail = `/placeholder.svg?height=360&width=640&text=TikTok+Video`;
    }
  } catch (e) {
    console.error("Error extracting video details:", e);
    // Keep default placeholder
  }

  const platformConfig =
    SUPPORTED_PLATFORMS[platform as keyof typeof SUPPORTED_PLATFORMS];

  return {
    url,
    platform,
    videoId,
    thumbnail,
    title: `${platformConfig.name} Video${videoId ? ` (${videoId})` : ""}`,
    author: "",
    duration: "",
  };
};
