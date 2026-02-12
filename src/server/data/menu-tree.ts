import type { MenuRow } from "@/server/data/menu-store";

export type MenuTreeNode = MenuRow & {
  items: MenuTreeNode[];
};

export const buildMenuTree = (rows: MenuRow[]): MenuTreeNode[] => {
  const map = new Map<number, MenuTreeNode>();
  const roots: MenuTreeNode[] = [];

  for (const row of rows) {
    map.set(row.menuId, { ...row, items: [] });
  }

  for (const node of map.values()) {
    if (node.parentMenuId == null) {
      roots.push(node);
      continue;
    }
    const parent = map.get(node.parentMenuId);
    if (!parent) {
      roots.push(node);
      continue;
    }
    parent.items.push(node);
  }

  return roots;
};
