"use client";

import type { CategoryResponse } from "@bh/shared";

interface CategoryChipsProps {
  categories: CategoryResponse[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryChips({
  categories,
  selected,
  onSelect,
}: CategoryChipsProps) {
  return (
    <div
      className="mb-8 flex flex-wrap gap-2"
      role="listbox"
      aria-label="Filter by category"
    >
      <Chip
        active={selected === null}
        onClick={() => onSelect(null)}
        label="All"
      />
      {categories.map((cat) => (
        <Chip
          key={cat.id}
          active={selected === cat.slug}
          onClick={() => onSelect(cat.slug)}
          label={cat.name}
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center rounded-sm border-[1.5px] border-coral bg-coral px-4 py-2 text-[15px] font-medium text-ink transition-colors"
          : "inline-flex items-center rounded-sm border-[1.5px] border-coral-soft bg-transparent px-4 py-2 text-[15px] font-normal text-coral transition-colors hover:bg-coral/5"
      }
    >
      {label}
    </button>
  );
}
