"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavigationMenuItem } from "@/entities/menu/types";

const MenuLeaf = ({ item, depth }: { item: NavigationMenuItem; depth: number }) => {
  return (
    <li>
      <Link
        className={cn(
          "block rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-800",
          depth > 0 && "pl-4",
        )}
        href={item.href}
      >
        {item.label}
      </Link>
    </li>
  );
};

const MenuBranch = ({ item, depth }: { item: NavigationMenuItem; depth: number }) => {
  return (
    <li>
      <details open>
        <summary className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-blue-50">
          {item.label}
        </summary>
        <MenuTree items={item.items} depth={depth + 1} />
      </details>
    </li>
  );
};

export const MenuTree = ({ items, depth = 0 }: { items: NavigationMenuItem[]; depth?: number }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={cn("grid list-none gap-1", depth > 0 && "ml-3 mt-1 border-l border-dashed border-slate-300 pl-2")}>
      {items.map((item) => {
        if (item.items.length > 0) {
          return <MenuBranch key={item.id} item={item} depth={depth} />;
        }
        return <MenuLeaf key={item.id} item={item} depth={depth} />;
      })}
    </ul>
  );
};

