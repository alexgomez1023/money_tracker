
"use client";

import { useState } from "react";

export type Country = {
  code: string;
  name: string;
};

interface CountryCodeSelectProps {
  id: string;
  countries: Country[];
  value: string;
  onChange: (code: string) => void;
  invalid?: boolean;
}

// A country code picker styled like the rest of the app, in place of the browser's own dropdown.
export default function CountryCodeSelect({
  id,
  countries,
  value,
  onChange,
  invalid = false,
}: CountryCodeSelectProps) {
  const selectedIndex = Math.max(
    countries.findIndex((country) => country.code === value),
    0
  );

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  function openList() {
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(countries[index].code);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        openList();
        return;
      }

      const step = event.key === "ArrowDown" ? 1 : -1;

      setActiveIndex(
        (activeIndex + step + countries.length) % countries.length
      );

      return;
    }

    if (open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      choose(activeIndex);
    }
  }

  return (
    <div
      className="relative shrink-0"
      onBlur={(event) => {
        // Close when focus leaves the picker.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={`Country code, ${countries[selectedIndex].name} ${value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={
          open ? `${id}-option-${activeIndex}` : undefined
        }
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`flex items-center gap-1 rounded-xl border bg-surface-blue px-3 py-3 text-sm font-semibold text-primary outline-none transition focus:ring-2 ${
          invalid
            ? "border-accent focus:border-accent focus:ring-accent/20"
            : "border-border-custom focus:border-secondary focus:ring-secondary/20"
        }`}
      >
        {value}

        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label="Country code"
          className="absolute left-0 top-full z-20 mt-2 w-60 rounded-2xl border border-border-custom bg-surface p-2 shadow-lg"
        >
          {countries.map((country, index) => {
            const selected = index === selectedIndex;
            const active = index === activeIndex;

            return (
              <li
                key={country.code}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={selected}
                // Keeps focus on the button, so the list stays open until the click lands.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  selected
                    ? "bg-primary font-semibold text-white"
                    : active
                      ? "bg-surface-blue text-primary"
                      : "text-foreground"
                }`}
              >
                <span>{country.name}</span>

                <span
                  className={`font-semibold ${
                    selected ? "text-white/85" : "text-muted"
                  }`}
                >
                  {country.code}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
