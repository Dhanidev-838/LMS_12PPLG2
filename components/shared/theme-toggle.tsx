"use client";

type Theme = "light" | "dark";

export default function ThemeToggle({
  theme,
  onToggle,
  className = "",
}: {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `Ganti ke tema ${nextTheme === "light" ? "terang" : "gelap"}`;
  const iconColor = theme === "dark" ? "#fbbf24" : "#4b5563";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B85F6] ${
        theme === "dark"
          ? "border-[#465268] bg-[#171d28] hover:bg-[#2a3343]"
          : "border-[#dce1eb] bg-white hover:bg-[#f7f8fb]"
      } ${className}`}
    >
      {theme === "dark" ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[18px] w-[18px]"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill={iconColor}
          className="h-[18px] w-[18px]"
          aria-hidden="true"
        >
          <path d="M12 3a9 9 0 1 0 9 9c0-.5-.53-.77-.94-.48a7 7 0 0 1-9.58-9.58c.29-.41.02-.94-.48-.94Z" />
        </svg>
      )}
    </button>
  );
}
