"use client";
import type { JSX } from "react/jsx-runtime";

/**
 * Extracts the YouTube video ID from a given URL.
 * Supports various YouTube URL formats.
 * @param url The YouTube video URL.
 * @returns The YouTube video ID or null if not found.
 */
const getYouTubeVideoId = (url: string): string | null => {
  const regExp =
    /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

/**
 * Extracts the TikTok video ID from a given URL.
 * @param url The TikTok video URL.
 * @returns The TikTok video ID or null if not found.
 */
const getTikTokVideoId = (url: string): string | null => {
  const regExp = /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.]+\/video\/(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

/**
 * Generates the appropriate embed code for social media videos based on platform name and link.
 *
 * IMPORTANT: The parent container where this component is rendered should have
 * `position: relative`, `overflow: hidden`, and an `aspect-ratio` class (e.g., `aspect-video`)
 * to ensure the embedded video fills the space without overflow.
 *
 * @param platformName The name of the social media platform (e.g., "youtube", "tiktok", "instagram", "facebook").
 * @param videoLink The URL of the social media video.
 * @returns A React element containing the embed code, or null if the platform is not supported or link is invalid.
 */
export const getEmbedVideoByLink = (
  platformName: string,
  videoLink: string
): JSX.Element | null => {
  const name = platformName?.toLowerCase();

  if (!videoLink) {
    return null;
  }

  switch (name) {
    case "tiktok": {
      const videoId = getTikTokVideoId(videoLink);
      if (!videoId) return null;
      return (
        <>
          <blockquote
            key={videoId} // Key helps React re-render when videoId changes
            title="TikTok video"
            className="tiktok-embed w-full h-full absolute inset-0 object-contain object-center" // Use absolute positioning to fill parent
            cite={videoLink}
            data-video-id={videoId}
            // Removed fixed inline styles for better responsiveness
          >
            <section></section>
          </blockquote>
          {/* TikTok embed script */}
          <script async src="https://www.tiktok.com/embed.js" />
        </>
      );
    }
    case "youtube": {
      const videoId = getYouTubeVideoId(videoLink);
      if (!videoId) return null;
      // YouTube embed URL with common parameters for better user experience
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0`;
      return (
        <iframe
          key={videoId} // Key helps React re-render when videoId changes
          src={embedUrl}
          title="YouTube video player"
          className="w-full h-full absolute inset-0 object-contain object-center" // Use absolute positioning to fill parent
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      );
    }
    case "instagram": {
      // Instagram embeds use the full permalink.
      // The script needs to be loaded for the blockquote to render correctly.
      return (
        <>
          <blockquote
            key={videoLink} // Key helps React re-render when videoLink changes
            className="instagram-media w-full h-full absolute inset-0 object-contain object-center" // Use absolute positioning to fill parent
            data-instgrm-permalink={videoLink}
            data-instgrm-version="14"
            // Removed fixed inline styles for better responsiveness
          >
            <div style={{ padding: "16px" }}></div>{" "}
            {/* Keep this div as Instagram's embed script might rely on it */}
          </blockquote>
          {/* Instagram embed script */}
          <script async src="//www.instagram.com/embed.js" />
        </>
      );
    }
    case "facebook": {
      // Facebook embeds require their SDK to be loaded.
      // The `data-href` should be the full URL of the Facebook video post.
      return (
        <>
          <div
            key={videoLink} // Key helps React re-render when videoLink changes
            className="fb-video w-full h-full absolute inset-0 object-contain object-center" // Use absolute positioning to fill parent
            data-href={videoLink}
            data-show-text="false"
            // Removed data-width for better responsiveness
          ></div>
          {/* Facebook SDK script. Replace 'YOUR_NONCE_HERE' with a dynamically generated nonce in production for CSP. */}
          <script
            async
            defer
            crossOrigin="anonymous"
            src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0"
            nonce="YOUR_NONCE_HERE" // Remember to replace this with a dynamic nonce in production for CSP
          ></script>
        </>
      );
    }
    default:
      return null; // Return null for unsupported platforms
  }
};
