"use client";

type LoaderProps = {
  text?: string;
  direction?: "row" | "column";
  size?: "xs" | "sm" | "md" | "lg" | number; // Accepts predefined sizes or custom number
};

export default function Loader({
  text = "Loading...",
  direction = "column",
  size,
}: LoaderProps) {
  // Map size prop to Tailwind classes or use custom number for width/height
  const getSizeClass = () => {
    if (typeof size === "number") {
      return { width: size, height: size };
    }
    switch (size) {
      case "xs":
        return { width: 16, height: 16, text: "text-xs" };
      case "sm":
        return { width: 24, height: 24, text: "text-sm" };
      case "md":
        return { width: 32, height: 32, text: "text-lg" };
      case "lg":
        return { width: 40, height: 40, text: "text-xl" };
      default:
        return { width: 48, height: 48, text: "text-lg" };
    }
  };

  const { width, height, text: textSize } = getSizeClass();
  const flexDirectionClass = direction === "row" ? "flex-row" : "flex-col";

  return (
    <div
      className={`flex ${flexDirectionClass} items-center justify-center gap-2`}
    >
      <svg
        className="animate-spin text-cyan-600"
        style={{ width: `${width}px`, height: `${height}px` }}
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"
        />
      </svg>
      <span className={`text-cyan-600 ${textSize} font-semibold`}>{text}</span>
    </div>
  );
}
