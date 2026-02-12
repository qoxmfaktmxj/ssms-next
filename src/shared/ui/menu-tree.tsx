"use client";

import Link from "next/link";
import type { NavigationMenuItem } from "@/entities/menu/types";

const MenuLeaf = ({ item }: { item: NavigationMenuItem }) => {
  return (
    <li>
      <Link className="menu-link" href={item.href}>
        {item.label}
      </Link>
    </li>
  );
};

const MenuBranch = ({ item }: { item: NavigationMenuItem }) => {
  return (
    <li>
      <details open>
        <summary>{item.label}</summary>
        <MenuTree items={item.items} />
      </details>
    </li>
  );
};

export const MenuTree = ({ items }: { items: NavigationMenuItem[] }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="menu-tree">
      {items.map((item) => {
        if (item.items.length > 0) {
          return <MenuBranch key={item.id} item={item} />;
        }
        return <MenuLeaf key={item.id} item={item} />;
      })}
    </ul>
  );
};

