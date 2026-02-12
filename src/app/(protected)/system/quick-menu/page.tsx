"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [statusText, setStatusText] = useState("메뉴 데이터를 불러오세요.");
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
      setStatusText("바로가기 메뉴 조회 중...");
      try {
        const [quickResponse] = await Promise.all([systemQuickMenuApi.list(), loadCandidates(nextPage, appliedQuery)]);
        setQuickMenus(toSequential(quickResponse.content ?? []));
        setSelectedQuickMenuId(null);
        setStatusText("바로가기 메뉴 데이터를 불러왔습니다.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "바로가기 메뉴 조회에 실패했습니다.";
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
      const message = error instanceof Error ? error.message : "후보 메뉴 조회에 실패했습니다.";
      setStatusText(message);
    });
  };

  const addCandidate = (candidate: QuickMenuCandidate) => {
    setQuickMenus((current) => {
      if (current.some((item) => item.menuId === candidate.menuId)) {
        setStatusText("이미 바로가기 메뉴에 등록된 항목입니다.");
        return current;
      }
      const next = [...current, toQuickItem(candidate, current.length + 1)];
      setStatusText(`"${candidate.menuLabel}" 메뉴를 추가했습니다.`);
      return next;
    });
  };

  const addSelectedCandidate = () => {
    if (selectedCandidateId == null) {
      setStatusText("후보 메뉴를 먼저 선택하세요.");
      return;
    }
    const selectedCandidate = candidates.find((item) => item.menuId === selectedCandidateId);
    if (!selectedCandidate) {
      setStatusText("선택한 후보 메뉴를 찾을 수 없습니다.");
      return;
    }
    addCandidate(selectedCandidate);
  };

  const removeByMenuId = (menuId: number) => {
    setQuickMenus((current) => toSequential(current.filter((item) => item.menuId !== menuId)));
    if (selectedQuickMenuId === menuId) {
      setSelectedQuickMenuId(null);
    }
  };

  const moveSelected = (direction: -1 | 1) => {
    if (selectedQuickMenuId == null) {
      setStatusText("바로가기 메뉴에서 이동할 행을 선택하세요.");
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
    setStatusText("바로가기 메뉴 저장 중...");
    try {
      const payload = quickMenus.map((item, index) => ({ menuId: item.menuId, seq: index + 1 }));
      const response = await systemQuickMenuApi.save(payload);
      setStatusText(`저장 ${response.succeeded}건, 실패 ${response.failed}건`);
      await loadAll(page, query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "바로가기 메뉴 저장에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSaving(false);
    }
  };

  const clearQuickMenus = async () => {
    const confirmed = window.confirm("바로가기 메뉴를 모두 삭제할까요?");
    if (!confirmed) {
      return;
    }
    setIsSaving(true);
    setStatusText("바로가기 메뉴 초기화 중...");
    try {
      const response = await systemQuickMenuApi.clear();
      setQuickMenus([]);
      setSelectedQuickMenuId(null);
      setStatusText(`삭제 ${response.succeeded}건`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "바로가기 메뉴 초기화에 실패했습니다.";
      setStatusText(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="panel">
      <header className="section-head">
        <div>
          <h2>퀵메뉴관리</h2>
          <p className="subtle">후보 메뉴 조회와 개인 퀵메뉴 순서 관리 화면입니다.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Input
          placeholder="후보 메뉴 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              applySearch();
            }
          }}
          className="w-60"
        />
        <Button type="button" variant="outline" onClick={applySearch} disabled={isLoading}>
          조회
        </Button>
        <Button type="button" variant="outline" onClick={addSelectedCandidate} disabled={isSaving}>
          선택추가
        </Button>
        <Button type="button" variant="outline" onClick={() => moveSelected(-1)} disabled={isSaving}>
          위로
        </Button>
        <Button type="button" variant="outline" onClick={() => moveSelected(1)} disabled={isSaving}>
          아래로
        </Button>
        <Button type="button" onClick={() => void saveQuickMenus()} disabled={isSaving}>
          저장
        </Button>
        <Button type="button" variant="destructive" onClick={() => void clearQuickMenus()} disabled={isSaving}>
          전체삭제
        </Button>
      </div>

      <p className="status-text">{statusText}</p>

      <div className="quick-grid">
        <div className="quick-panel">
          <h3>후보 메뉴</h3>
          <CandidateTable
            rows={candidates}
            selectedMenuId={selectedCandidateId}
            onSelect={setSelectedCandidateId}
            onAdd={addCandidate}
          />
          <div className="pagination">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const nextPage = Math.max(page - 1, 0);
                setPage(nextPage);
                void loadCandidates(nextPage, query);
              }}
              disabled={page === 0 || isLoading}
            >이전</Button>
            <span>
              페이지 {page + 1} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const nextPage = Math.min(page + 1, totalPages - 1);
                setPage(nextPage);
                void loadCandidates(nextPage, query);
              }}
              disabled={page >= totalPages - 1 || isLoading}
            >다음</Button>
          </div>
        </div>

        <div className="quick-panel">
          <h3>내 퀵메뉴</h3>
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


