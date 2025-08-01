"use client";

import { toast } from "@/hooks/use-toast";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const preventNodeDeletionKeys = (e: KeyboardEvent | any) => {
  // if (["Backspace", "Delete", "Escape"].includes(e.key)) {
  //   e.stopPropagation();
  //   e.preventDefault();
  // }
  // const activeElement = document.activeElement;
  // // Allow default behavior if the active element is an input or textarea
  // if (activeElement && ["INPUT", "TEXTAREA"].includes(activeElement.tagName)) {
  //   return;
  // }
  // // Prevent node deletion for specific keys
  // if (["Backspace", "Delete", "Escape"].includes(e.key)) {
  //   e.stopPropagation();
  //   e.preventDefault();
  // }
};

export const showAPIErrorToast = (
  error?: unknown | any,
  fallbackTitle = "Validation failed",
  fallbackMessage = "Something went wrong"
) => {
  let description = fallbackMessage;

  // Axios-style error check
  if (error) {
    const responseData = error.response?.data;

    const messageFromErrors =
      responseData?.errors &&
      Object.values(responseData.errors).flat().join(", ");

    const messageFromMessage = responseData?.message;

    description = messageFromErrors || messageFromMessage || fallbackMessage;
  }

  toast({
    title: fallbackTitle,
    description,
    variant: "destructive",
  });
};

export const getFileSize = async (url?: string) => {
  if (!url) return null;

  let baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  if (baseUrl.endsWith("/api")) {
    baseUrl = baseUrl.replace(/\/api$/, "");
  }

  const fileUrl = `${baseUrl}${url}`;

  try {
    const response = await fetch(fileUrl, {
      method: "HEAD",
    });

    if (response.ok) {
      const size = response.headers.get("content-length");
      return size;
    } else {
      console.error("Failed to fetch file size");
      return null;
    }
  } catch (error) {
    console.error("Error fetching file size:", error);
    return null;
  }
};

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
  // instagram: {
  //   name: "Instagram",
  //   icon: "📷",
  //   color: "from-purple-500 to-pink-500",
  //   textColor: "text-purple-600",
  //   patterns: [
  //     /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+/,
  //     /^https?:\/\/(www\.)?instagram\.com\/stories\/[a-zA-Z0-9_.]+\/[0-9]+/,
  //     /^https?:\/\/(www\.)?instagram\.com\/s\/[a-zA-Z0-9_-]+/,
  //   ],
  // },
  // facebook: {
  //   name: "Facebook",
  //   icon: "📘",
  //   color: "from-blue-600 to-blue-700",
  //   textColor: "text-blue-600",
  //   patterns: [
  //     /^https?:\/\/(www\.)?facebook\.com\/watch\/?v=[0-9]+/,
  //     /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/videos\/[0-9]+/,
  //     /^https?:\/\/(www\.)?fb\.watch\/[a-zA-Z0-9_-]+/,
  //     /^https?:\/\/(www\.)?facebook\.com\/share\/r\/[a-zA-Z0-9_-]+\/?$/,
  //     /^https?:\/\/(www\.)?facebook\.com\/reel\/[0-9]+/, // NEW: Reel pattern
  //   ],
  // },
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
    color: "from-red-500 to-red-600",
    // color: "from-black to-gray-800",
    // color: "from-[#000000] to-[#FE2C55]",
    textColor: "text-gray-800",
    patterns: [
      /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/video\/[0-9]+/,
      /^https?:\/\/(vm\.)?tiktok\.com\/[a-zA-Z0-9]+/,
      /^https?:\/\/(www\.)?tiktok\.com\/[a-zA-Z0-9_.]+\/video\/[0-9]+/,
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
    // error: "Unsupported platform. Please use Instagram, YouTube, TikTok, or Facebook video URLs.",
    error: "Unsupported platform. Please use YouTube, or TikTok video URLs.",
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

export type PastedContentType =
  | { type: "image-file"; data: string } // Data URL from a pasted image file
  | { type: "image-url"; data: string } // URL from a pasted image (e.g., from HTML or direct URL)
  | { type: "audio-file"; data: string }
  | { type: "video-file"; data: string }
  | { type: "document-file"; data: string }
  | { type: "youtube"; data: string }
  | { type: "tiktok"; data: string }
  | { type: "instagram"; data: string }
  | { type: "facebook"; data: string }
  | { type: "website url"; data: string }
  | { type: "annotation"; data: string }
  | { type: "unknown"; data: null };

/**
 * Analyzes the pasted content from a ClipboardEvent and returns its type and data.
 * It prioritizes file types over string types, and specific URLs over general text.
 * @param e The ClipboardEvent.
 * @returns A Promise that resolves to an object containing the type and data of the pasted content.
 */
export async function getPastedContent(
  e: ClipboardEvent
): Promise<PastedContentType> {
  const items = e?.clipboardData?.items;

  if (!items) {
    return { type: "unknown", data: null };
  }

  const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
  const imageFileExtensionRegex = /\.(jpg|jpeg|png|gif|webp|svg)$/i; // For checking if a URL points to an image

  const socialMediaPlatforms = [
    {
      name: "youtube",
      regex:
        /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i,
    },
    {
      name: "tiktok",
      regex:
        /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com)\/@([\w.-]+)\/video\/(\d+)(?:\S+)?/i,
    },
    {
      name: "instagram",
      regex:
        /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com)\/(?:p|reel|tv)\/([\w-]+)(?:\S+)?/i,
    },
    {
      name: "facebook",
      regex:
        /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com)\/(?:video\.php\?v=|watch\/?\?v=|permalink\.php\?story_fbid=|groups\/[\w.-]+\/permalink\/|)([\w.-]+)(?:\S+)?/i,
    },
  ] as const;

  const promises: Promise<PastedContentType | null>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.kind === "file") {
      const file = item.getAsFile();
      if (!file) continue;

      promises.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (item.type.startsWith("image/")) {
              resolve({ type: "image-file", data: dataUrl });
            } else if (item.type.startsWith("video/")) {
              resolve({ type: "video-file", data: dataUrl });
            } else if (item.type.startsWith("audio/")) {
              resolve({ type: "audio-file", data: dataUrl });
            } else if (
              item.type.startsWith("application/pdf") ||
              item.type.startsWith("application/msword") ||
              item.type.startsWith(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              )
            ) {
              resolve({ type: "document-file", data: dataUrl });
            } else {
              resolve(null); // Not a recognized file type we want to handle specifically
            }
          };
          reader.readAsDataURL(file);
        })
      );
    } else if (item.kind === "string") {
      if (item.type === "text/uri-list") {
        promises.push(
          new Promise((resolve) => {
            item.getAsString((text) => {
              const url = text.split("\n")[0]; // Take the first URL if multiple
              if (urlRegex.test(url)) {
                // Check if it's an image URL based on extension
                if (imageFileExtensionRegex.test(url)) {
                  resolve({ type: "image-url", data: url });
                  return;
                }

                let matchedPlatform: PastedContentType["type"] = "website url";
                for (const p of socialMediaPlatforms) {
                  if (p.regex.test(url)) {
                    matchedPlatform = p.name;
                    break;
                  }
                }
                resolve({ type: matchedPlatform, data: url });
              } else {
                resolve(null); // Not a valid URL in uri-list
              }
            });
          })
        );
      } else if (item.type === "text/html") {
        promises.push(
          new Promise((resolve) => {
            item.getAsString((htmlText) => {
              // Try to extract image src from HTML
              const imgMatch = htmlText.match(/<img[^>]+src="([^">]+)"/i);
              if (imgMatch && imgMatch[1]) {
                const imageUrl = imgMatch[1];
                if (urlRegex.test(imageUrl)) {
                  resolve({ type: "image-url", data: imageUrl });
                  return;
                }
              }

              // Try to extract href from anchor tags
              const aMatch = htmlText.match(/<a[^>]+href="([^">]+)"/i);
              if (aMatch && aMatch[1]) {
                const url = aMatch[1];
                if (urlRegex.test(url)) {
                  let matchedPlatform: PastedContentType["type"] =
                    "website url";
                  for (const p of socialMediaPlatforms) {
                    if (p.regex.test(url)) {
                      matchedPlatform = p.name;
                      break;
                    }
                  }
                  resolve({ type: matchedPlatform, data: url });
                  return;
                }
              }
              resolve(null); // No specific URL or image found in HTML
            });
          })
        );
      } else if (item.type === "text/plain") {
        promises.push(
          new Promise((resolve) => {
            item.getAsString((text) => {
              if (urlRegex.test(text)) {
                // Check if it's an image URL based on extension
                if (imageFileExtensionRegex.test(text)) {
                  resolve({ type: "image-url", data: text });
                  return;
                }

                let matchedPlatform: PastedContentType["type"] = "website url";
                for (const p of socialMediaPlatforms) {
                  if (p.regex.test(text)) {
                    matchedPlatform = p.name;
                    break;
                  }
                }
                resolve({ type: matchedPlatform, data: text });
              } else {
                resolve({ type: "annotation", data: text });
              }
            });
          })
        );
      }
    }
  }

  const results = (await Promise.all(promises)).filter(
    Boolean
  ) as PastedContentType[];

  // Define the order of priority for content types
  const prioritizedOrder: PastedContentType["type"][] = [
    "image-file",
    "video-file",
    "audio-file",
    "document-file",
    "image-url", // Prioritize image URLs after actual files
    "youtube",
    "tiktok",
    "instagram",
    "facebook",
    "website url",
    "annotation",
  ];

  for (const type of prioritizedOrder) {
    const found = results.find((result) => result.type === type);
    if (found) {
      return found;
    }
  }

  return { type: "unknown", data: null };
}
