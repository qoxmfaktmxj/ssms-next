export type QuickMenuItem = {
  menuId: number;
  menuLabel: string;
  menuPath?: string | null;
  menuIcon?: string | null;
  seq: number;
};

export type QuickMenuCandidate = {
  menuId: number;
  menuLabel: string;
  menuPath?: string | null;
  menuIcon?: string | null;
  seq?: number | null;
};

export type QuickMenuCandidateFilters = {
  page: number;
  size: number;
  keyword: string;
};
