export type MenuNode = {
  menuId?: number;
  parentMenuId?: number;
  menuLabel: string;
  menuPath?: string;
  menuIcon?: string;
  seq?: number;
  useYn?: string;
  items?: MenuNode[];
};

export type NavigationMenuItem = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  items: NavigationMenuItem[];
};
