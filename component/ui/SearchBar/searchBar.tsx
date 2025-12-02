import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

// Merge classes
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

type InputProps = React.ComponentProps<"input"> & {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

function Input({ className, type, icon, iconPosition = "right", ...props }: InputProps) {
  const iconIsLeft = icon && iconPosition === "left";
  const iconIsRight = icon && iconPosition === "right";

  return (
    <div className="relative w-full">
      {icon && (
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none",
            iconIsLeft ? "left-3" : undefined,
            iconIsRight ? "right-3" : undefined

          )}
        >
          {icon}
        </div>
      )}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent",
          iconIsLeft ? "pl-10" : undefined,
          iconIsRight ? "pr-10" : undefined,
          className
        )}
        {...props}
      />
    </div>
  );
}

interface SearchComponentProps<T = unknown> {
  placeholder?: string;
  debounceDelay?: number;

  // callback when results are received (optional)
  onResults?: (results: T[]) => void;

  // called when user types (server API call required)
  onSearch: (query: string) => Promise<T[]>;

  // 🔥 NEW: allows <SearchComponent serverSideSearch={true} />
  serverSideSearch?: boolean;

  className?: string;
}

const SearchComponent = <T extends Record<string, any>>({
  placeholder = "Search",
  debounceDelay = 300,
  className = "",
  onResults,
  onSearch,
  serverSideSearch = false,   // default: false
}: SearchComponentProps<T>) => {
  const [query, setQuery] = useState("");
  const onResultsRef = useRef(onResults);

  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  // 🔥 If serverSideSearch is enabled → run API search on debounce.
  // If NOT enabled → do nothing automatically (parent can decide behaviour)
  useEffect(() => {
    if (!serverSideSearch) return;

    const debounce = setTimeout(async () => {
      const results = await onSearch(query);
      onResultsRef.current?.(results);
    }, debounceDelay);

    return () => clearTimeout(debounce);
  }, [query, debounceDelay, onSearch, serverSideSearch]);

  return (
    <div className={cn("w-full", className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        icon={<Search className="w-5 h-5" />}
        iconPosition="right"
      />
    </div>
  );
};

export default SearchComponent;
