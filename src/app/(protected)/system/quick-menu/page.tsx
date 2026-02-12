"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { systemQuickMenuApi } from "@/features/system-quick-menu/api";
import { CandidateTable } from "@/features/system-quick-menu/candidate-table";
import { SelectedTable } from "@/features/system-quick-menu/selected-table";
import type { QuickMenuCandidate, QuickMenuItem } from "@/features/system-quick-menu/types";

const toSequential = (rows: QuickMenuItem[]): QuickMenuItem[] =>
  rows.map((row, index) => ({
    ...row,
    seq: index + 1,
  }));

const toQuickItem = (candidate: QuickMenuCandidate, seq: number): QuickMenuItem => ({
  menuId: candidate.menuId,
  menuLabel: candidate.menuLabel,
  menuPath: candidate.menuPath,
  menuIcon: candidate.menuIcon,
  seq,
});

export default function SystemQuickMenuPage() {
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<QuickMenuCandidate[]>([]);
  const [quickMenus, setQuickMenus] = useState<QuickMenuItem[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [selectedQuickMenuId, setSelectedQuickMenuId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState("퀵 Load menu data to begin.");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const totalPages = useMemo(() => Math.max(Math.ceil(totalElements / size), 1), [size, totalElements]);

  const loadCandidates = useCallback(
    async (nextPage: number, appliedQuery: string) => {
      const response = await systemQuickMenuApi.listCandidates({
        page: nextPage,
        size,
        keyword: appliedQuery,
      });
      setCandidates(response.content ?? []);
      setTotalElements(response.totalElements ?? 0);
      setSelectedCandidateId(null);
    },
    [size],
  );

  const loadAll = useCallback(
    async (nextPage: number, appliedQuery: string) => {
      setIsLoading(true);
      setStatusText("Loading quick menu data...");
      try {
        const [quickResponse] = await Promise.all([systemQuickMenuApi.list(), loadCandidates(nextPage, appliedQuery)]);
        setQuickMenus(toSequential(quickResponse.content ?? []));
        setSelectedQuickMenuId(null);
        setStatusText("Quick menu data loaded.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load quick menu data.";
        setStatusText(message);
      } finally {
        setIsLoading(false);
      }
    },
    [loadCandidates],
  );

  useEffect(() => {
    void loadAll(0, "");
  }, [loadAll]);

  const applySearch = () => {
    setPage(0);
    const nextQuery = keyword.trim();
    setQuery(nextQuery);
    void loadCandidates(0, nextQuery).catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load candidate menus.";
      setStatusText(message);
    });
  };

  const addCandidate = (candidate: QuickMenuCandidate) => {
    setQuickMenus((current) => {
      if (current.some((item) => item.menuId === candidate.menuId)) {
        setStatusText("Selected menu already exists in quick menu.");
        return current;
      }
      const next = [...current, toQuickItem(candidate, current.length + 1)];
      setStatusText(`Added "${candidate.menuLabel}" to quick menu.`);
      return next;
    });
  };

  const addSelectedCandidate = () => {
    if (selectedCandidateId == null) {
      setStatusText("Select one candidate menu first.");
      return;
    }
    const selectedCandidate = candidates.find((item) => item.menuId === selectedCandidateId);
    if (!selectedCandidate) {
      setStatusText("Selected candidate no longer exists.");
      return;
    }
    addCandidate(selectedCandidate);
  };

  const removeByMenuId = (menuId: number) => {
    setQuickMenus((current) => {
      const next = toSequential(current.filter((item) => item.menuId !== menuId));
      return next;
    });
    if (selectedQuickMenuId === menuId) {
      setSelectedQuickMenuId(null);
    }
  };

  const moveSelected = (direction: -1 | 1) => {
    if (selectedQuickMenuId == null) {
      setStatusText("Select one quick menu row first.");
      return;
    }
    setQuickMenus((current) => {
      const index = current.findIndex((item) => item.menuId === selectedQuickMenuId);
      if (index < 0) {
        return current;
      }
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return toSequential(next);
    });
  };

  const saveQuickMenus = async () => {
    setIsSaving(true);
    setStatusText("Saving quick menu...");
    try {
      const payload = quickMenus.map((item, index) => ({ menuId: item.menuId, seq: index + 1 }));
      const response = await systemQuickMenuApi.save(payload);
      setStatusText(`Saved ${response.succeeded} item(s), failed ${response.failed}.`);
      await loadAll(page, query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save quick menu.";
      setStatusText(message);
    } finally {
      setIsSaving(false);
    }
  };

  const clearQuickMenus = async () => {
    const confirmed = window.confirm("Delete all quick menu entries?");
    if (!confirmed) {
      return;
    }
    setIsSaving(true);
    setStatusText("Clearing quick menu...");
    try {
      const response = await systemQuickMenuApi.clear();
      setQuickMenus([]);
      setSelectedQuickMenuId(null);
      setStatusText(`Deleted ${response.succeeded} item(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear quick menu.";
      setStatusText(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>퀵System Menu</h2>
          <p className="subtle">Phase 2 slice: candidate lookup and personal quick-menu ordering.</p>
        </div>
      </header>

      <div className="toolbar">
        <input
          placeholder="Search candidate menus"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              applySearch();
            }
          }}
        />
        <button type="button" className="ghost" onClick={applySearch} disabled={isLoading}>
          Search
        </button>
        <button type="button" className="ghost" onClick={addSelectedCandidate} disabled={isSaving}>
          Add Selected
        </button>
        <button type="button" className="ghost" onClick={() => moveSelected(-1)} disabled={isSaving}>
          Move Up
        </button>
        <button type="button" className="ghost" onClick={() => moveSelected(1)} disabled={isSaving}>
          Move Down
        </button>
        <button type="button" onClick={() => void saveQuickMenus()} disabled={isSaving}>
          Save
        </button>
        <button type="button" className="danger" onClick={() => void clearQuickMenus()} disabled={isSaving}>
          Clear All
        </button>
      </div>

      <p className="status-text">{statusText}</p>

      <div className="quick-grid">
        <div className="quick-panel">
          <h3>Candidate Menus</h3>
          <CandidateTable
            rows={candidates}
            selectedMenuId={selectedCandidateId}
            onSelect={setSelectedCandidateId}
            onAdd={addCandidate}
          />
          <div className="pagination">
            <button
              type="button"
              className="ghost"
              onClick={() => {
                const nextPage = Math.max(page - 1, 0);
                setPage(nextPage);
                void loadCandidates(nextPage, query);
              }}
              disabled={page === 0 || isLoading}
            >
              Prev
            </button>
            <span>
              Page {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                const nextPage = Math.min(page + 1, totalPages - 1);
                setPage(nextPage);
                void loadCandidates(nextPage, query);
              }}
              disabled={page >= totalPages - 1 || isLoading}
            >
              Next
            </button>
          </div>
        </div>

        <div className="quick-panel">
          <h3>My Quick Menu</h3>
          <SelectedTable
            rows={quickMenus}
            selectedMenuId={selectedQuickMenuId}
            onSelect={setSelectedQuickMenuId}
            onRemove={removeByMenuId}
          />
        </div>
      </div>
    </section>
  );
}

