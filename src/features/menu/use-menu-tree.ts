"use client";

import { useEffect, useState } from "react";
import type { NavigationMenuItem } from "@/entities/menu/types";
import { menuApi } from "@/features/menu/api";

type UseMenuTreeResult = {
  menu: NavigationMenuItem[];
  isLoading: boolean;
  error: string | null;
};

export const useMenuTree = (enabled: boolean): UseMenuTreeResult => {
  const [menu, setMenu] = useState<NavigationMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setMenu([]);
      return;
    }

    let isCancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const tree = await menuApi.getTree();
        if (!isCancelled) {
          setMenu(menuApi.toNavigation(tree));
        }
      } catch {
        if (!isCancelled) {
          setError("Failed to load menu tree");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [enabled]);

  return { menu, isLoading, error };
};
