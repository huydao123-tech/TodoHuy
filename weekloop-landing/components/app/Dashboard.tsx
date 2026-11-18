"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { compareTaskGroups, moveTaskGroup } from "@/lib/taskGroupPriority";
import {
  attachGroupToVision,
  detachGroupFromVision,
  exclusiveVisions,
  groupsForVisionFilter,
  stripGroupFromVisions,
  type VisionDraft,
  type VisionRecord,
} from "@/lib/visions";
import Link from "next/link";
import {
  getNavLabel,
  type SideTaskData,
  type TaskGroup,
  type ResourceData,
  type WorkItemData,
  type WorkItemStatus,
  TASK_GROUPS,
  INITIAL_SIDE_TASKS,
  RESOURCES,
  getGoalText,
  getWorkItems,
  getWeekDateStr,
  getWeekRange,
  dateStrToOffset,
} from "@/lib/mockData";
import {
  dashboardApi,
  taskGroupApi,
  sideTaskApi,
  resourceApi,
  workItemApi,
  weeklyGoalApi,
  visionApi,
  removeAuthToken,
  requireAuthUser,
  authApi,
} from "@/lib/api";
import { useLanguage } from "@/lib/languageContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import WeekGrid from "@/components/app/WeekGrid";
import WeekAgenda from "@/components/app/WeekAgenda";
import SidePanel from "@/components/app/SidePanel";
import NotesGallery from "@/components/app/NotesGallery";
import VisionsBoard, { VisionLens } from "@/components/app/VisionsBoard";
import {
  normalizeDayOrder,
  normalizeDaysOfWeek,
  removeAgendaDay,
  type AgendaDay,
  type DayAssignment,
} from "@/lib/weekAgenda";
import {
  CaretLeft,
  CaretRight,
  BookOpen,
  Gear,
  ArrowCounterClockwise,
  Calendar,
  X,
  Plus,
  ArrowSquareOut,
  SignOut,
  PawPrint,
  Trash,
  Notebook,
  PencilSimple,
  List,
  ListChecks,
  CheckSquare,
  Flag,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

// ─── PHẦN TỬ ĐIỀU HƯỚNG THANH BÊN (SIDEBAR NAV ITEM) ─────────────────────────
function SideNavItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number | string | null;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: 40,
        background: active ? "var(--accent-ghost)" : "transparent",
        border: "none",
        cursor: "pointer",
        padding: "0 10px",
        borderRadius: 10,
        textAlign: "left",
        transition: "background 0.14s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-alt)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            color: active ? "var(--accent-contrast)" : "var(--text-muted)",
            display: "flex",
          }}
        >
          {icon}
        </span>
        <span
          style={{
            fontSize: "0.875rem",
            color: active ? "var(--accent-contrast)" : "var(--text-secondary)",
            fontWeight: active ? 600 : 500,
          }}
        >
          {label}
        </span>
      </div>

      {badge !== undefined && badge !== null && (
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            background: "var(--bg-alt)",
            color: active ? "var(--accent-contrast)" : "var(--text-muted)",
            borderRadius: 8,
            padding: "1px 6px",
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── ĐIỀU HƯỚNG TUẦN (dùng chung Planner + Việc cần làm) ────────────────────
function WeekNavCard({
  viewOffset,
  label,
  isVietnamese,
  prevLabel,
  nextLabel,
  todayLabel,
  onPrev,
  onNext,
  onToday,
}: {
  viewOffset: number;
  label: string;
  isVietnamese: boolean;
  prevLabel: string;
  nextLabel: string;
  todayLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const stateLabel =
    viewOffset === 0
      ? (isVietnamese ? "TUẦN HIỆN TẠI" : "THIS WEEK")
      : viewOffset < 0
        ? (isVietnamese ? "TUẦN ĐÃ QUA" : "PAST WEEK")
        : (isVietnamese ? "TUẦN SẮP TỚI" : "UPCOMING WEEK");

  return (
    <div className="week-nav">
      <button type="button" className="week-nav-btn" onClick={onPrev} title={prevLabel} aria-label={prevLabel}>
        <CaretLeft size={16} />
      </button>

      <button
        type="button"
        className="week-nav-center"
        data-current={viewOffset === 0}
        onClick={onToday}
        title={todayLabel}
        aria-label={`${todayLabel} · ${label}`}
      >
        <span className="week-nav-state">
          <i className={viewOffset === 0 ? "on" : undefined} aria-hidden />
          {stateLabel}
        </span>
        <span className="week-nav-date">{label}</span>
      </button>

      <button type="button" className="week-nav-btn" onClick={onNext} title={nextLabel} aria-label={nextLabel}>
        <CaretRight size={16} />
      </button>

      {viewOffset !== 0 && (
        <button type="button" className="week-nav-today" onClick={onToday}>
          <ArrowCounterClockwise size={11} />
          {todayLabel}
        </button>
      )}
    </div>
  );
}


// ─── DASHBOARD CHÍNH ─────────────────────────────────────────────────────────
export interface ArchivedTaskGroup extends TaskGroup {
  archivedAt?: string | null;
}

function formatArchivedTime(isoString?: string | null, isVi = true): string {
  if (!isoString) return isVi ? "Đã xóa gần đây" : "Deleted recently";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isVi ? "Đã xóa gần đây" : "Deleted recently";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (isVi) {
    if (diffDays <= 0) return "Đã xóa hôm nay";
    if (diffDays === 1) return "Đã xóa hôm qua";
    return `Đã xóa ${diffDays} ngày trước`;
  } else {
    if (diffDays <= 0) return "Deleted today";
    if (diffDays === 1) return "Deleted yesterday";
    return `Deleted ${diffDays} days ago`;
  }
}

export default function Dashboard() {
  const { t, lang, setLang, isVietnamese } = useLanguage();
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<"planner" | "agenda" | "visions" | "notes">("planner");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileSidePanelOpen, setMobileSidePanelOpen] = useState(false);

  useEffect(() => {
    requireAuthUser()
      .then(() => setAuthChecking(false))
      .catch(() => {});
  }, []);

  const [viewOffset, setViewOffset] = useState(0);
  const [groups, setTaskGroups] = useState<TaskGroup[]>([]);
  const taskGroups = useMemo(() => [...groups].sort(compareTaskGroups), [groups]);
  const [visions, setVisions] = useState<VisionRecord[]>([]);
  const [visionsReady, setVisionsReady] = useState(false);
  const [visionFilter, setVisionFilter] = useState("all");
  const [manageRequest, setManageRequest] = useState<{ id: string; nonce: number } | null>(null);
  const ownedVisions = useMemo(() => exclusiveVisions(visions), [visions]);
  const selectedVisionId =
    visionFilter !== "all" && ownedVisions.some((vision) => vision.id === visionFilter) ? visionFilter : "all";
  const visibleGroups = useMemo(
    () => groupsForVisionFilter(taskGroups, ownedVisions, selectedVisionId),
    [taskGroups, ownedVisions, selectedVisionId],
  );
  const [savingPriorityId, setSavingPriorityId] = useState<string | number | null>(null);
  const [archivedGroups, setArchivedGroups] = useState<ArchivedTaskGroup[]>([]);
  const [sideTasks, setSideTasks] = useState<SideTaskData[]>([]);
  const [resources, setResources] = useState<ResourceData[]>([]);

  const [goalsMap, setGoalsMap] = useState<Record<string, string>>({});
  const [workItemsMap, setWorkItemsMap] = useState<Record<string, WorkItemData[]>>({});

  // Số việc chưa xong của tuần đang xem, hiện trên mục "Việc cần làm" ở sidebar.
  const agendaPendingCount = useMemo(
    () =>
      taskGroups.reduce((total, group) => {
        const items = workItemsMap[`${group.id}:${viewOffset}`] ?? [];
        return total + items.filter((item) => item.status !== "DONE").length;
      }, 0),
    [taskGroups, workItemsMap, viewOffset],
  );

  const [toast, setToast] = useState<{
    text: string;
    actionText?: string;
    onAction?: () => void;
  } | null>(null);

  const [currentUser] = useState<{ fullName?: string; email?: string }>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("weekloop_user") ?? "{}") as {
        fullName?: string;
        email?: string;
      };
    } catch {
      return {};
    }
  });

  // Modals state
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#16A34A");

  const [editingGroupId, setEditingGroupId] = useState<string | number | null>(null);
  const [editGroupVal, setEditGroupVal] = useState("");

  const [showTrashModal, setShowTrashModal] = useState(false);
  const [confirmPermDeleteId, setConfirmPermDeleteId] = useState<string | number | null>(null);

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResTitle, setNewResTitle] = useState("");
  const [newResLink, setNewResLink] = useState("");
  const [newResDesc, setNewResDesc] = useState("");
  const [newResGroupId, setNewResGroupId] = useState("");

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    dashboardApi
      .getDashboard()
      .then((data) => {
        setSideTasks((data.sideTasks ?? []).filter((t) => !t.isDone));

        const gMap: Record<string, string> = {};
        const wMap: Record<string, WorkItemData[]> = {};

        (data.weeklyGoals ?? []).forEach((goal) => {
          const off = dateStrToOffset(goal.weekStartDate);
          gMap[`${goal.taskGroupId}:${off}`] = goal.goalText;
        });

        (data.workItems ?? []).forEach((item) => {
          const off = dateStrToOffset(item.weekStartDate);
          const key = `${item.taskGroupId}:${off}`;
          if (!wMap[key]) wMap[key] = [];
          wMap[key].push({
            id: item.id,
            content: item.content,
            status: item.status,
            note: item.note || "",
            daysOfWeek: normalizeDaysOfWeek(item.daysOfWeek),
            dayOrder: normalizeDayOrder(item.dayOrder),
          });
        });

        setGoalsMap(gMap);
        setWorkItemsMap(wMap);
      })
      .catch(() => {
        setSideTasks(INITIAL_SIDE_TASKS.filter((t) => !t.isDone));

        const initialGMap: Record<string, string> = {};
        const initialWMap: Record<string, WorkItemData[]> = {};
        TASK_GROUPS.forEach((g) => {
          [-1, 0, 1].forEach((off) => {
            const key = `${g.id}:${off}`;
            initialGMap[key] = getGoalText(g.id, off);
            initialWMap[key] = getWorkItems(g.id, off);
          });
        });
        setGoalsMap(initialGMap);
        setWorkItemsMap(initialWMap);
      });

    resourceApi
      .getAll()
      .then((resList) => {
        setResources(
          (resList ?? []).map((r) => ({
            id: r.id,
            groupId: r.taskGroupId,
            title: r.title,
            link: r.link,
            description: r.description || "",
          }))
        );
      })
      .catch(() => {
        setResources(RESOURCES);
      });
  }, []);

  // ─── SOFT DELETE & THÙNG RÁC (CHỈ ÁP DỤNG CHO NÚT BÊN SIDEBAR TRÁI) ─────────
  useEffect(() => {
    if (authChecking) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    const onError = () => {
      if (!cancelled) setToast({ text: isVietnamese ? "Không thể đồng bộ nhóm công việc. Vui lòng tải lại trang." : "Could not sync task groups. Please reload." });
    };
    taskGroupApi.subscribe((allGroups) => {
      if (cancelled) return;
      setTaskGroups(allGroups.filter((g) => !g.isArchived));
      setArchivedGroups(allGroups.filter((g) => g.isArchived));
    }, onError).then((stop) => {
      if (cancelled) stop();
      else unsubscribe = stop;
    }).catch(onError);
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [authChecking, isVietnamese]);

  useEffect(() => {
    if (authChecking) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    visionApi.subscribe((list) => {
      if (cancelled) return;
      setVisions(list);
      setVisionsReady(true);
    }, () => {
      if (cancelled) return;
      setVisionsReady(true);
      setToast({ text: isVietnamese ? "Không tải được tầm nhìn." : "Could not load visions." });
    }).then((stop) => {
      if (cancelled) stop();
      else unsubscribe = stop;
    }).catch(() => {
      if (!cancelled) setVisionsReady(true);
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [authChecking, isVietnamese]);

  const handleRestoreGroup = useCallback((id: string | number) => {
    setArchivedGroups((prev) => {
      const target = prev.find((g) => g.id === id);
      if (!target) return prev;

      setTaskGroups((active) => [...active, target]);

      setToast({
        text: isVietnamese ? `Đã khôi phục "${target.name}"` : `Restored "${target.name}"`,
      });

      return prev.filter((g) => g.id !== id);
    });

    taskGroupApi.restore(id).catch(() => {});
  }, [isVietnamese]);

  const handleSoftDeleteGroup = useCallback((id: string | number) => {
    setTaskGroups((prev) => {
      const target = prev.find((g) => g.id === id);
      if (!target) return prev;

      setArchivedGroups((arch) => [
        { ...target, archivedAt: new Date().toISOString() },
        ...arch.filter((a) => a.id !== id),
      ]);

      setToast({
        text: isVietnamese ? `Đã chuyển "${target.name}" vào thùng rác` : `Moved "${target.name}" to trash`,
        actionText: t.undo,
        onAction: () => handleRestoreGroup(id),
      });

      return prev.filter((g) => g.id !== id);
    });

    taskGroupApi.delete(id).catch(() => {});
  }, [isVietnamese, t.undo, handleRestoreGroup]);

  const handlePermanentDeleteGroup = useCallback((id: string | number) => {
    setArchivedGroups((prev) => prev.filter((g) => g.id !== id));
    setVisions((prev) => stripGroupFromVisions(prev, String(id)).next);
    taskGroupApi.permanentDelete(id).catch(() => {});
    visionApi.removeGroupFromAll(String(id)).catch(() => {});
  }, []);

  // ─── BỎ ĐẦU VIỆC KHỎI MỘT TUẦN CỤ THỂ (KHÔNG VÀO THÙNG RÁC) ────────────────
  const [excludedByWeek, setExcludedByWeek] = useState<Record<number, (string | number)[]>>({});

  const handleRemoveGroupFromWeek = useCallback(
    (groupId: string | number, absoluteOffset: number, name: string) => {
      setExcludedByWeek((prev) => {
        const currentList = prev[absoluteOffset] ?? [];
        if (currentList.includes(groupId)) return prev;
        return {
          ...prev,
          [absoluteOffset]: [...currentList, groupId],
        };
      });

      setToast({
        text: isVietnamese ? `Đã bỏ "${name}" khỏi tuần này` : `Removed "${name}" from this week`,
        actionText: t.undo,
        onAction: () => {
          setExcludedByWeek((prev) => ({
            ...prev,
            [absoluteOffset]: (prev[absoluteOffset] ?? []).filter((id) => id !== groupId),
          }));
        },
      });
    },
    [isVietnamese, t.undo]
  );

  const handleAddGroupToWeek = useCallback((groupId: string | number, absoluteOffset: number) => {
    setExcludedByWeek((prev) => ({
      ...prev,
      [absoluteOffset]: (prev[absoluteOffset] ?? []).filter((id) => id !== groupId),
    }));
  }, []);

  // ─── WORK ITEMS & GOALS (ĐỒNG BỘ 100% VỚI FIREBASE) ───────────────────────
  const handleSaveGoal = useCallback((groupId: string | number, offset: number, text: string) => {
    const key = `${groupId}:${offset}`;
    setGoalsMap((prev) => ({ ...prev, [key]: text }));
    const weekStartDate = getWeekDateStr(offset);
    weeklyGoalApi.update(groupId, weekStartDate, text).catch(console.error);
  }, []);

  const handleAddItem = useCallback(
    async (
      groupId: string | number,
      offset: number,
      content: string,
      daysOfWeek: number[] = []
    ) => {
      const key = `${groupId}:${offset}`;
      const weekStartDate = getWeekDateStr(offset);
      const tempId = `temp-${Date.now()}`;
      const normalizedDays = normalizeDaysOfWeek(daysOfWeek);
      const newItem: WorkItemData = {
        id: tempId,
        content,
        status: "TODO",
        note: "",
        daysOfWeek: normalizedDays,
      };
      setWorkItemsMap((prev) => ({
        ...prev,
        [key]: [...(prev[key] ?? []), newItem],
      }));

      try {
        const created = await workItemApi.create(groupId, weekStartDate, content, "", normalizedDays);
        setWorkItemsMap((prev) => ({
          ...prev,
          [key]: (prev[key] ?? []).map((item) => (item.id === tempId ? { ...item, id: created.id } : item)),
        }));
      } catch (e) {
        console.error("Lỗi thêm công việc vào Firebase:", e);
      }
    },
    []
  );

  // Gán một việc vào nhiều thứ (hoặc bỏ hết về hàng đợi "Chưa xếp thứ").
  const handleAssignDays = useCallback(
    (groupId: string | number, offset: number, itemId: string | number, daysOfWeek: number[]) => {
      const key = `${groupId}:${offset}`;
      const normalizedDays = normalizeDaysOfWeek(daysOfWeek);
      setWorkItemsMap((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).map((item) =>
          item.id === itemId ? { ...item, daysOfWeek: normalizedDays } : item
        ),
      }));
      workItemApi.update(itemId, { daysOfWeek: normalizedDays }).catch(console.error);
    },
    []
  );

  // Bỏ một việc khỏi đúng một thứ: việc vẫn còn trong Planner và các thứ khác.
  const handleRemoveFromDay = useCallback(
    (groupId: string | number, offset: number, itemId: string | number, day: AgendaDay) => {
      const key = `${groupId}:${offset}`;
      const item = (workItemsMap[key] ?? []).find((candidate) => candidate.id === itemId);
      if (!item) return;

      const previousDays = normalizeDaysOfWeek(item.daysOfWeek);
      const nextDays = removeAgendaDay(previousDays, day);
      if (nextDays.length === previousDays.length) return;

      setWorkItemsMap((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).map((entry) =>
          entry.id === itemId ? { ...entry, daysOfWeek: nextDays } : entry
        ),
      }));
      workItemApi.update(itemId, { daysOfWeek: nextDays }).catch(console.error);

      const dayName = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun][day - 1];
      const label = item.content.length > 30 ? `${item.content.slice(0, 30)}…` : item.content;
      setToast({
        text: isVietnamese
          ? `Đã bỏ "${label}" khỏi ${dayName}. Việc vẫn còn trong Planner.`
          : `Removed "${label}" from ${dayName}. The task stays in the Planner.`,
        actionText: t.undo,
        onAction: () => handleAssignDays(groupId, offset, itemId, previousDays),
      });
    },
    [handleAssignDays, isVietnamese, t, workItemsMap]
  );

  const applyDayAssignments = useCallback((assignments: DayAssignment[], offset: number) => {
    setWorkItemsMap((prev) => {
      const next = { ...prev };
      for (const assignment of assignments) {
        const key = `${assignment.taskGroupId}:${offset}`;
        const items = next[key];
        if (!items) continue;
        next[key] = items.map((item) =>
          item.id === assignment.taskId ? { ...item, daysOfWeek: assignment.daysOfWeek } : item
        );
      }
      return next;
    });
  }, []);

  // Kéo-thả trong một thứ: mỗi thứ giữ vị trí riêng trong `dayOrder`.
  const handleReorderDay = useCallback(
    (day: number, orderedIds: (string | number)[], offset: number) => {
      const positions = new Map(orderedIds.map((id, index) => [String(id), index]));
      const updates: { id: string | number; dayOrder: Record<string, number> }[] = [];
      for (const [key, items] of Object.entries(workItemsMap)) {
        if (!key.endsWith(`:${offset}`)) continue;
        for (const item of items) {
          const position = positions.get(String(item.id));
          if (position === undefined) continue;
          const current = normalizeDayOrder(item.dayOrder);
          if (current[String(day)] === position) continue;
          updates.push({ id: item.id, dayOrder: { ...current, [String(day)]: position } });
        }
      }
      if (updates.length === 0) return;

      setWorkItemsMap((prev) => {
        const orderById = new Map(updates.map((update) => [String(update.id), update.dayOrder]));
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (!key.endsWith(`:${offset}`)) continue;
          next[key] = next[key].map((item) => {
            const dayOrder = orderById.get(String(item.id));
            return dayOrder ? { ...item, dayOrder } : item;
          });
        }
        return next;
      });
      workItemApi.setDayOrder(updates).catch(console.error);
    },
    [workItemsMap]
  );

  // "Tự xếp lịch": áp dụng kế hoạch của WeekAgenda, lưu một lượt, kèm Hoàn tác.
  const handleAutoSchedule = useCallback(
    (assignments: DayAssignment[]) => {
      if (assignments.length === 0) {
        setToast({
          text: isVietnamese
            ? "Không còn việc nào chưa xếp để tự xếp lịch."
            : "There is no unscheduled task left to auto-plan.",
        });
        return;
      }

      const offset = viewOffset;
      const previous: DayAssignment[] = assignments.map((assignment) => {
        const items = workItemsMap[`${assignment.taskGroupId}:${offset}`] ?? [];
        const item = items.find((candidate) => candidate.id === assignment.taskId);
        return { ...assignment, daysOfWeek: normalizeDaysOfWeek(item?.daysOfWeek) };
      });

      applyDayAssignments(assignments, offset);
      workItemApi
        .assignDays(assignments.map((assignment) => ({ id: assignment.taskId, daysOfWeek: assignment.daysOfWeek })))
        .catch(console.error);

      setToast({
        text: isVietnamese
          ? `Đã tự xếp ${assignments.length} việc vào các thứ.`
          : `Auto-planned ${assignments.length} tasks.`,
        actionText: t.undo,
        onAction: () => {
          applyDayAssignments(previous, offset);
          workItemApi
            .assignDays(previous.map((assignment) => ({ id: assignment.taskId, daysOfWeek: assignment.daysOfWeek })))
            .catch(console.error);
        },
      });
    },
    [applyDayAssignments, isVietnamese, t.undo, viewOffset, workItemsMap]
  );

  const handleCycleStatus = useCallback((groupId: string | number, offset: number, itemId: string | number) => {
    const key = `${groupId}:${offset}`;
    setWorkItemsMap((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((item) => {
        if (item.id !== itemId) return item;
        const cycle = ["TODO", "IN_PROGRESS", "DONE"] as const;
        const nextStatus = cycle[(cycle.indexOf(item.status) + 1) % 3];
        workItemApi.update(itemId, { status: nextStatus }).catch(console.error);
        return { ...item, status: nextStatus };
      }),
    }));
  }, []);

  const handleUpdateItem = useCallback(
    (
      groupId: string | number,
      offset: number,
      itemId: string | number,
      updates: { content?: string; note?: string; status?: WorkItemStatus } | string
    ) => {
      const key = `${groupId}:${offset}`;
      const payload = typeof updates === "string" ? { content: updates } : updates;

      setWorkItemsMap((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, ...payload };
        }),
      }));
      workItemApi.update(itemId, payload).catch(console.error);
    },
    []
  );

  const handleMoveTaskToWeek = useCallback(
    async (groupId: string | number, fromOffset: number, itemId: string | number, targetOffset: number = 0) => {
      const fromKey = `${groupId}:${fromOffset}`;
      const toKey = `${groupId}:${targetOffset}`;
      const targetWeekStart = getWeekDateStr(targetOffset);

      const itemToMove = (workItemsMap[fromKey] ?? []).find((it) => it.id === itemId);
      if (!itemToMove) return;

      // Optimistic state update
      setWorkItemsMap((prev) => ({
        ...prev,
        [fromKey]: (prev[fromKey] ?? []).filter((it) => it.id !== itemId),
        [toKey]: [...(prev[toKey] ?? []), { ...itemToMove, weekStartDate: targetWeekStart }],
      }));

      try {
        await workItemApi.moveToWeek(itemId, targetWeekStart);
        const destLabel = targetOffset === 0 
          ? (isVietnamese ? "tuần này" : "current week")
          : targetOffset === 1 
            ? (isVietnamese ? "tuần sau" : "next week")
            : getWeekRange(targetOffset);
        setToast({
          text: isVietnamese ? `Đã dời "${itemToMove.content}" sang ${destLabel}` : `Moved "${itemToMove.content}" to ${destLabel}`,
          actionText: isVietnamese ? "Hoàn tác" : "Undo",
          onAction: async () => {
            const oldWeekStart = getWeekDateStr(fromOffset);
            setWorkItemsMap((prev) => ({
              ...prev,
              [toKey]: (prev[toKey] ?? []).filter((it) => it.id !== itemId),
              [fromKey]: [...(prev[fromKey] ?? []), itemToMove],
            }));
            await workItemApi.moveToWeek(itemId, oldWeekStart);
          },
        });
      } catch (err) {
        console.error("Lỗi dời công việc sang tuần mới:", err);
      }
    },
    [workItemsMap, isVietnamese]
  );

  const handleDeleteItem = useCallback((groupId: string | number, offset: number, itemId: string | number) => {
    const key = `${groupId}:${offset}`;
    setWorkItemsMap((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((item) => item.id !== itemId),
    }));
    workItemApi.delete(itemId).catch(console.error);
  }, []);

  // ─── SIDE TASKS ──────────────────────────────────────────────────────────
  const handleCompleteSideTask = useCallback((task: SideTaskData) => {
    setSideTasks((prev) => prev.filter((t) => t.id !== task.id));
    sideTaskApi.completeAndRemove(task.id).catch(console.error);

    setToast({
      text: `Đã hoàn thành và xóa "${task.name}"`,
      actionText: "Hoàn tác",
      onAction: async () => {
        try {
          const created = await sideTaskApi.create(task.name);
          setSideTasks((prev) => [
            ...prev,
            { id: created.id, name: task.name, isDone: false },
          ]);
        } catch (e) {
          console.error("Lỗi hoàn tác việc phụ:", e);
        }
      },
    });
  }, []);

  const handleAddSideTask = useCallback(async (name: string) => {
    const tempId = `temp-${Date.now()}`;
    setSideTasks((prev) => [...prev, { id: tempId, name, isDone: false }]);
    try {
      const created = await sideTaskApi.create(name);
      setSideTasks((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: created.id } : t))
      );
    } catch {}
  }, []);

  const handleDeleteSideTask = useCallback((task: SideTaskData) => {
    setSideTasks((prev) => prev.filter((t) => t.id !== task.id));
    sideTaskApi.delete(task.id).catch(console.error);

    setToast({
      text: `Đã xóa "${task.name}"`,
      actionText: "Hoàn tác",
      onAction: async () => {
        try {
          const created = await sideTaskApi.create(task.name);
          setSideTasks((prev) => [
            ...prev,
            { id: created.id, name: task.name, isDone: false },
          ]);
        } catch (e) {
          console.error("Lỗi hoàn tác xóa việc phụ:", e);
        }
      },
    });
  }, []);

  const handleChangeGroupPriority = async (id: string | number, position: number) => {
    if (savingPriorityId !== null) return;
    if (taskGroups.findIndex((g) => g.id === id) === position) return;
    const reordered = moveTaskGroup(taskGroups, id, position);
    if (reordered === taskGroups || taskGroups.some((g) => String(g.id).startsWith("temp-"))) return;
    setSavingPriorityId(id);
    try {
      await taskGroupApi.reorder(reordered.map((g) => g.id));
      setToast({ text: isVietnamese ? "Đã cập nhật độ ưu tiên" : "Priority updated" });
    } catch {
      setToast({ text: isVietnamese ? "Không thể lưu độ ưu tiên. Vui lòng thử lại." : "Could not save priority. Please try again." });
    } finally {
      setSavingPriorityId(null);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const newGroup: TaskGroup = {
      id: tempId,
      name: newGroupName.trim(),
      color: newGroupColor,
      displayOrder: Math.max(0, ...taskGroups.map((g) => g.displayOrder ?? 0)) + 1,
    };
    setTaskGroups((prev) => [...prev, newGroup]);
    setNewGroupName("");
    setShowAddGroupModal(false);

    try {
      const created = await taskGroupApi.create(newGroup.name, "MAIN", newGroup.displayOrder, newGroupColor);
      setTaskGroups((prev) =>
        prev.map((g) => (g.id === tempId ? { ...g, id: created.id } : g))
      );
    } catch {}
  };

  const handleCreateVision = async (draft: VisionDraft) => {
    const displayOrder = Math.max(0, ...visions.map((vision) => vision.displayOrder)) + 1;
    try {
      const created = await visionApi.create({ ...draft, displayOrder });
      setVisions((prev) => (prev.some((vision) => vision.id === created.id) ? prev : [...prev, created]));
      return created.id;
    } catch (error) {
      setToast({ text: t.couldNotSaveVision });
      throw error;
    }
  };

  const handleUpdateVision = async (
    id: string,
    patch: Partial<Pick<VisionRecord, "title" | "outcome" | "horizon" | "status">>,
  ) => {
    const previous = visions;
    setVisions((prev) => prev.map((vision) => (vision.id === id ? { ...vision, ...patch } : vision)));
    try {
      await visionApi.update(id, patch);
    } catch (error) {
      setVisions(previous);
      setToast({ text: t.couldNotSaveVision });
      throw error;
    }
  };

  const handleDeleteVision = async (id: string) => {
    const previous = visions;
    setVisions((prev) => prev.filter((vision) => vision.id !== id));
    if (visionFilter === id) setVisionFilter("all");
    try {
      await visionApi.remove(id);
    } catch (error) {
      setVisions(previous);
      setToast({ text: t.couldNotSaveVision });
      throw error;
    }
  };

  const handleAttachGroup = async (visionId: string, groupId: string) => {
    const previous = visions;
    const result = attachGroupToVision(previous, visionId, groupId);
    setVisions(exclusiveVisions(result.next));
    try {
      await visionApi.attachGroup(visionId, groupId);
      if (result.movedFromId) {
        const from = previous.find((vision) => vision.id === result.movedFromId);
        if (from) setToast({ text: t.movedGroup.replace("{name}", from.title) });
      }
    } catch (error) {
      setVisions(previous);
      setToast({ text: t.couldNotSaveVision });
      throw error;
    }
  };

  const handleDetachGroup = async (visionId: string, groupId: string) => {
    const previous = visions;
    setVisions(detachGroupFromVision(previous, visionId, groupId).next);
    try {
      await visionApi.detachGroup(visionId, groupId);
    } catch (error) {
      setVisions(previous);
      setToast({ text: t.couldNotSaveVision });
      throw error;
    }
  };

  const handleCreateGroupInVision = async (visionId: string, name: string, color: string) => {
    const tempId = `temp-${Date.now()}`;
    const displayOrder = Math.max(0, ...taskGroups.map((group) => group.displayOrder ?? 0)) + 1;
    setTaskGroups((prev) => [...prev, { id: tempId, name, color, displayOrder }]);
    let createdId = "";
    try {
      const created = await taskGroupApi.create(name, "MAIN", displayOrder, color);
      createdId = created.id;
      setTaskGroups((prev) => prev.map((group) => (group.id === tempId ? { ...group, id: created.id } : group)));
    } catch (error) {
      setTaskGroups((prev) => prev.filter((group) => group.id !== tempId));
      setToast({ text: isVietnamese ? "Không tạo được nhóm việc." : "Could not create the group." });
      throw error;
    }

    const previous = visions;
    setVisions((prev) => exclusiveVisions(attachGroupToVision(prev, visionId, createdId).next));
    try {
      await visionApi.attachGroup(visionId, createdId);
    } catch (error) {
      setVisions(previous);
      setToast({
        text: isVietnamese
          ? "Đã tạo nhóm việc nhưng chưa gắn được vào tầm nhìn."
          : "The group was created, but it could not be attached.",
      });
      throw error;
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const selectedGroupId = newResGroupId || null;
    const newRes: ResourceData = {
      id: tempId,
      groupId: selectedGroupId,
      title: newResTitle.trim(),
      link: newResLink.trim() || "https://example.com",
      description: newResDesc.trim(),
    };
    setResources((prev) => [newRes, ...prev]);
    setNewResTitle("");
    setNewResLink("");
    setNewResDesc("");
    setNewResGroupId("");

    try {
      const created = await resourceApi.create(newRes.title, newRes.link, newRes.description, selectedGroupId);
      setResources((prev) =>
        prev.map((r) => (r.id === tempId ? { ...r, id: created.id } : r))
      );
    } catch (e) {
      console.error("Lỗi thêm tài liệu:", e);
    }
  };

  const handleDeleteResource = useCallback((id: string | number, title: string) => {
    const target = resources.find((r) => r.id === id);
    setResources((prev) => prev.filter((r) => r.id !== id));
    resourceApi.delete(id).catch(console.error);

    if (target) {
      setToast({
        text: isVietnamese ? `Đã xóa tài liệu "${title}"` : `Deleted resource "${title}"`,
        actionText: t.undo,
        onAction: () => {
          setResources((prev) => [target, ...prev]);
          resourceApi.create(target.title, target.link, target.description, target.groupId).catch(() => {});
        },
      });
    }
  }, [resources, isVietnamese, t.undo]);

  const handleLogout = async () => {
    if (window.confirm(t.logoutConfirm)) {
      await authApi.logout();
    }
  };

  const navToPrev = () => setViewOffset((v) => v - 1);
  const navToNext = () => setViewOffset((v) => v + 1);
  const navToToday = () => setViewOffset(0);

  const centerLabel = getNavLabel(viewOffset);

  const pageTitle =
    activeTab === "planner"
      ? (isVietnamese ? "Kế hoạch" : "Planner")
      : activeTab === "agenda"
        ? t.agenda
        : activeTab === "visions"
          ? t.visions
          : t.notes;

  const pageSubtitle =
    activeTab === "planner"
      ? (isVietnamese ? "Kế hoạch tuần & quản lý công việc" : "Weekly planning & task management")
      : activeTab === "agenda"
        ? (isVietnamese ? "Việc cần làm theo từng thứ trong tuần" : "Tasks by weekday for this week")
        : activeTab === "visions"
          ? (isVietnamese ? "Mục tiêu dài hạn và nhóm việc" : "Long-term goals and work groups")
          : (isVietnamese ? "Ghi chú nhanh trong ngày" : "Quick notes");

  const userInitials = currentUser.fullName
    ? currentUser.fullName.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase()).join("")
    : "HN";

  const weekNav = (
    <WeekNavCard
      viewOffset={viewOffset}
      label={centerLabel}
      isVietnamese={isVietnamese}
      prevLabel={t.prevWeek}
      nextLabel={t.nextWeek}
      todayLabel={t.today}
      onPrev={navToPrev}
      onNext={navToNext}
      onToday={navToToday}
    />
  );

  if (authChecking) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "var(--accent)",
            animation: "pulse 1.4s infinite ease-in-out",
          }}
        />
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 520 }}>
          {t.verifyingSession}
        </p>
      </div>
    );
  }

  return (
    <div
      id="app-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <div className="sb-frame">
      {/* ─── TOP BAR ─────────────────────────────────────────────────────── */}
      {/* ─── TOP BAR ─────────────────────────────────────────────────────── */}
      <nav id="app-nav" className="app-topbar" aria-label="Điều hướng ứng dụng">
        <div className="topbar-left">
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            aria-label={isVietnamese ? "Mở menu danh mục đầu việc" : "Open categories menu"}
            title={t.categoriesSection}
          >
            <List size={20} weight="bold" />
          </button>

          <div className="topbar-heading">
            <h1 className="topbar-title">{pageTitle}</h1>
            <p className="topbar-subtitle">{pageSubtitle}</p>
          </div>
        </div>

        <div className="topbar-weeknav">
          {activeTab === "planner" || activeTab === "agenda" ? weekNav : null}
        </div>

        <div className="topbar-actions">
          <Link
            href="/garden"
            id="open-garden"
            className="topbar-icon-btn"
            title="Văn phòng"
            aria-label="Mở văn phòng việc"
          >
            <PawPrint size={16} />
          </Link>
          <ThemeToggle size="sm" />
          <LanguageToggle size="sm" />
          <button
            id="user-menu-btn"
            type="button"
            className="topbar-avatar"
            onClick={() => setShowSettingsModal(true)}
            aria-label={t.settings}
            title={t.settings}
          >
            {userInitials}
          </button>
        </div>
      </nav>
      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="sb-stage" style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Backdrop cho Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div
            className="mobile-backdrop"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ─── LEFT SIDEBAR ────────────────────────────────────────────────── */}
        <aside
          id="app-sidebar"
          aria-label="Điều hướng chính"
          className={mobileSidebarOpen ? "mobile-drawer-open" : ""}
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            background: "var(--card-bg)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <Link href="/" className="sb-brand" style={{ textDecoration: "none" }}>
            <span className="sb-mark" aria-hidden>
              <i />
              <span />
            </span>
            WeekLoop
          </Link>

          <div className="sb-profile">
            <span className="sb-profile-avatar" aria-hidden>
              {userInitials}
            </span>
            <div style={{ minWidth: 0 }}>
              <span className="sb-profile-name">{currentUser.fullName || "Huy Nguyễn"}</span>
              <span className="sb-profile-email">{currentUser.email || "huy@example.com"}</span>
            </div>
          </div>

          {/* Header trong drawer điện thoại */}
          <div className="mobile-drawer-header">
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text)" }}>{t.categoriesSection}</span>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Navigation tabs */}
          <div style={{ padding: "0.35rem 10px 0.35rem" }}>
            <SideNavItem
              icon={<Calendar size={15} />}
              label={t.planner}
              active={activeTab === "planner"}
              onClick={() => {
                setActiveTab("planner");
                setMobileSidebarOpen(false);
              }}
            />
            <SideNavItem
              icon={<ListChecks size={15} />}
              label={t.agenda}
              active={activeTab === "agenda"}
              badge={agendaPendingCount > 0 ? agendaPendingCount : null}
              onClick={() => {
                setActiveTab("agenda");
                setMobileSidebarOpen(false);
              }}
            />
            <SideNavItem
              icon={<Flag size={15} />}
              label={t.visions}
              active={activeTab === "visions"}
              badge={ownedVisions.length > 0 ? ownedVisions.length : null}
              onClick={() => {
                setActiveTab("visions");
                setMobileSidebarOpen(false);
              }}
            />
            <SideNavItem
              icon={<Notebook size={15} />}
              label={t.notes}
              active={activeTab === "notes"}
              onClick={() => {
                setActiveTab("notes");
                setMobileSidebarOpen(false);
              }}
            />
          </div>

          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "0.4rem 0.75rem",
            }}
          />

          {/* Task Groups Section */}
          <div style={{ padding: "0.35rem 10px 0.75rem", flex: 1 }}>
            <p className="sb-section-label">{t.categoriesSection}</p>

            {taskGroups.map((g) => {
              const isEditing = editingGroupId === g.id;
              return (
              <div
                key={g.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "4px 10px",
                  borderRadius: 10,
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-alt)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden", flex: 1 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: g.color,
                      flexShrink: 0,
                    }}
                  />
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editGroupVal}
                      onChange={(e) => setEditGroupVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const trimmed = editGroupVal.trim();
                          if (trimmed) {
                            setTaskGroups(prev => prev.map(x => x.id === g.id ? { ...x, name: trimmed } : x));
                            taskGroupApi.update(g.id, trimmed).catch(() => {});
                          }
                          setEditingGroupId(null);
                        }
                        if (e.key === "Escape") setEditingGroupId(null);
                      }}
                      onBlur={() => {
                        const trimmed = editGroupVal.trim();
                        if (trimmed) {
                          setTaskGroups(prev => prev.map(x => x.id === g.id ? { ...x, name: trimmed } : x));
                          taskGroupApi.update(g.id, trimmed).catch(() => {});
                        }
                        setEditingGroupId(null);
                      }}
                      style={{
                        flex: 1,
                        fontSize: "0.8125rem",
                        padding: "0.1rem 0.2rem",
                        border: "1px solid var(--accent)",
                        borderRadius: "var(--radius-sm)",
                        outline: "none",
                        fontFamily: "inherit",
                        minWidth: 0,
                      }}
                    />
                  ) : (
                    <div style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "var(--text)",
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {g.name}
                    </span>
                    <select
                      aria-label={isVietnamese ? `Độ ưu tiên của ${g.name}` : `Priority for ${g.name}`}
                      value={taskGroups.findIndex((group) => group.id === g.id)}
                      disabled={savingPriorityId !== null || taskGroups.some((group) => String(group.id).startsWith("temp-"))}
                      onChange={(e) => void handleChangeGroupPriority(g.id, Number(e.target.value))}
                      title={isVietnamese ? "Vị trí 1 là ưu tiên cao nhất. Áp dụng cho tất cả các tuần." : "Position 1 is the highest priority. Applies to all weeks."}
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        marginTop: 1,
                        padding: "0 2px",
                        border: "none",
                        background: "transparent",
                        color: "var(--text-faint)",
                        fontSize: "0.625rem",
                        fontFamily: "inherit",
                        cursor: savingPriorityId !== null ? "wait" : "pointer",
                      }}
                    >
                      {taskGroups.map((group, index) => (
                        <option key={group.id} value={index}>
                          {isVietnamese ? `Ưu tiên: ${index + 1}` : `Priority: ${index + 1}`}
                        </option>
                      ))}
                    </select>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button
                      onClick={() => {
                        setEditingGroupId(g.id);
                        setEditGroupVal(g.name);
                      }}
                      title={t.renameTooltip}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-faint)",
                        padding: "0.15rem 0.25rem",
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        opacity: 0.45,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = "1";
                        (e.currentTarget as HTMLElement).style.color = "var(--text)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = "0.45";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-faint)";
                      }}
                    >
                      <PencilSimple size={12} />
                    </button>
                    <button
                      onClick={() => handleSoftDeleteGroup(g.id)}
                      title={t.archiveTooltip}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-faint)",
                        padding: "0.15rem 0.25rem",
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        opacity: 0.45,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = "1";
                        (e.currentTarget as HTMLElement).style.color = "#DC2626";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = "0.45";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-faint)";
                      }}
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                )}
              </div>
            );})}

            <button
              id="sidebar-add-group"
              onClick={() => setShowAddGroupModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "5px 10px",
                borderRadius: 10,
                color: "var(--text-faint)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                marginTop: "0.15rem",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--accent-contrast)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-faint)")}
            >
              <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>+</span>
              {t.createCategory}
            </button>
          </div>

          <div
            style={{
              height: 1,
              background: "var(--border)",
              marginInline: "0.75rem",
            }}
          />

          {/* Secondary functions */}
          <div style={{ padding: "0.35rem 10px 0.5rem" }}>
            <p className="sb-section-label">{t.utilitiesSection}</p>
            <SideNavItem
              icon={<Trash size={15} />}
              label={t.trash}
              badge={archivedGroups.length > 0 ? archivedGroups.length : null}
              onClick={() => setShowTrashModal(true)}
            />

            <SideNavItem
              icon={<BookOpen size={15} />}
              label={t.resourcesAndLinks}
              badge={resources.length > 0 ? resources.length : null}
              onClick={() => setShowResourceModal(true)}
            />

            <SideNavItem
              icon={<Gear size={15} />}
              label={t.settings}
              onClick={() => setShowSettingsModal(true)}
            />
          </div>

          <div className="sb-footer">
            <button type="button" className="sb-logout" onClick={handleLogout}>
              <SignOut size={15} />
              {t.logout}
            </button>
            <span className="sb-version">WeekLoop v2.0</span>
          </div>
        </aside>

        {/* Content switch */}
        {activeTab === "planner" ? (
          <>
            <main id="main-grid" style={{ flex: 1, overflowY: "auto" }}>
              <div className="mobile-week-nav">{weekNav}</div>
              {taskGroups.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: 380,
                    padding: "2rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "var(--accent-ghost)",
                      border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                      color: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <Calendar size={32} weight="duotone" />
                  </div>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {isVietnamese ? "Bắt đầu kế hoạch tuần của bạn" : "Start your weekly plan"}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      maxWidth: 380,
                      lineHeight: 1.55,
                      marginBottom: "1.25rem",
                    }}
                  >
                    {isVietnamese
                      ? "Tạo đầu việc chính đầu tiên (ví dụ: Học ngoại ngữ, Tập luyện, Dự án cá nhân) để bắt đầu phân bổ công việc theo từng tuần."
                      : "Create your first category (e.g. Language Learning, Workout, Personal Project) to start planning tasks across weeks."}
                  </p>
                  <button
                    onClick={() => setShowAddGroupModal(true)}
                    className="btn-primary"
                    style={{
                      padding: "9px 18px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Plus size={15} weight="bold" />
                    {isVietnamese ? "Tạo đầu việc đầu tiên" : "Create first category"}
                  </button>
                </div>
              ) : (
                <>
                <VisionLens visions={ownedVisions} value={selectedVisionId} onChange={setVisionFilter} />
                {visibleGroups.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      minHeight: 280,
                      padding: "2rem 1.25rem",
                      gap: "0.75rem",
                    }}
                  >
                    <p style={{ margin: 0, maxWidth: 420, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                      {t.visionFilterEmpty}
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: "0.45rem 0.9rem", fontSize: "0.8125rem" }}
                      onClick={() => {
                        setActiveTab("visions");
                        setManageRequest({ id: selectedVisionId, nonce: Date.now() });
                      }}
                    >
                      {t.manageGroups}
                    </button>
                  </div>
                ) : (
                <WeekGrid
                  viewOffset={viewOffset}
                  taskGroups={visibleGroups}
                  goalsMap={goalsMap}
                  workItemsMap={workItemsMap}
                  excludedByWeek={excludedByWeek}
                  onRemoveFromWeek={handleRemoveGroupFromWeek}
                  onAddGroupToWeek={handleAddGroupToWeek}
                  onOpenCreateGroupModal={() => setShowAddGroupModal(true)}
                  onSaveGoal={handleSaveGoal}
                  onAddItem={handleAddItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onMoveTaskToCurrentWeek={(gId: string | number, fromOffset: number, itemId: string | number) => handleMoveTaskToWeek(gId, fromOffset, itemId, 0)}
                  onMoveTaskToNextWeek={(gId: string | number, fromOffset: number, itemId: string | number) => handleMoveTaskToWeek(gId, fromOffset, itemId, 1)}
                />
                )}
                </>
              )}
            </main>
          </>
        ) : activeTab === "agenda" ? (
          <main id="agenda-view" style={{ flex: 1, overflowY: "auto" }}>
            <div className="mobile-week-nav">{weekNav}</div>
            <WeekAgenda
              viewOffset={viewOffset}
              taskGroups={taskGroups}
              workItemsMap={workItemsMap}
              onAddItem={handleAddItem}
              onAssignDays={handleAssignDays}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onRemoveFromDay={handleRemoveFromDay}
              onCycleStatus={handleCycleStatus}
              onAutoSchedule={handleAutoSchedule}
              onReorderDay={(day, orderedIds) => handleReorderDay(day, orderedIds, viewOffset)}
              onOpenPlanner={() => setActiveTab("planner")}
            />
          </main>
        ) : activeTab === "visions" ? (
          <main id="visions-view" style={{ flex: 1, overflowY: "auto" }}>
            <VisionsBoard
              visions={ownedVisions}
              ready={visionsReady}
              groups={taskGroups}
              goalsMap={goalsMap}
              workItemsMap={workItemsMap}
              viewOffset={viewOffset}
              excludedByWeek={excludedByWeek}
              manageRequest={manageRequest}
              onCreateVision={handleCreateVision}
              onUpdateVision={handleUpdateVision}
              onDeleteVision={handleDeleteVision}
              onAttachGroup={handleAttachGroup}
              onDetachGroup={handleDetachGroup}
              onCreateGroup={handleCreateGroupInVision}
              onViewWeek={(id) => {
                setVisionFilter(id);
                setActiveTab("planner");
              }}
            />
          </main>
        ) : (
          <main id="notes-view" style={{ flex: 1, overflowY: "auto", display: "flex" }}>
            <NotesGallery />
          </main>
        )}
      </div>

      {/* ─── SIDE PANEL: desktop chỉ ở Planner, mobile là drawer từ mọi tab ─── */}
      {mobileSidePanelOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileSidePanelOpen(false)}
        />
      )}
      <div
        className={`sidepanel-wrapper ${mobileSidePanelOpen ? "mobile-drawer-open" : ""} ${
          activeTab === "planner" ? "" : "sidepanel-mobile-only"
        }`}
      >
        <div className="mobile-drawer-header">
          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text)" }}>{t.sideTasksTitle}</span>
          <button
            type="button"
            onClick={() => setMobileSidePanelOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
        <SidePanel
          sideTasks={sideTasks}
          onComplete={handleCompleteSideTask}
          onAdd={handleAddSideTask}
          onDelete={handleDeleteSideTask}
        />
      </div>
      </div>

      {/* ─── TOAST ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.18 }}
            className="app-toast"
            style={{
              position: "fixed",
              bottom: "1.25rem",
              right: "1.25rem",
              background: "#18181B",
              color: "#FAFAFA",
              padding: "0.55rem 0.85rem",
              borderRadius: "var(--radius)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              zIndex: 300,
              fontSize: "0.8125rem",
            }}
          >
            <span>{toast.text}</span>
            {toast.actionText && toast.onAction && (
              <button
                onClick={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                style={{
                  background: "none",
                  color: "var(--accent)",
                  border: "none",
                  padding: 0,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {toast.actionText}
              </button>
            )}
            <button
              onClick={() => setToast(null)}
              style={{
                background: "none",
                border: "none",
                color: "#71717A",
                cursor: "pointer",
                padding: 0,
                display: "flex",
              }}
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TRASH MODAL ───────────────────────────────────────────────────── */}
      {showTrashModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 250,
          }}
          onClick={() => {
            setShowTrashModal(false);
            setConfirmPermDeleteId(null);
          }}
        >
          <div
            style={{
              background: "var(--card-bg, #fff)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              width: "100%",
              maxWidth: 460,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 620, color: "var(--text)", margin: 0 }}>
                {t.trashSheetTitle} ({archivedGroups.length})
              </h3>
              <button
                onClick={() => {
                  setShowTrashModal(false);
                  setConfirmPermDeleteId(null);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Retention banner matching Flutter PRODUCT.md */}
            <div
              style={{
                padding: "0.55rem 0.75rem",
                borderRadius: "var(--radius)",
                background: "var(--accent-bg)",
                border: "1px solid rgba(22, 163, 74, 0.2)",
                color: "var(--accent)",
                fontSize: "0.78125rem",
                marginBottom: "0.85rem",
                lineHeight: 1.4,
              }}
            >
              {t.trashRetentionNotice}
            </div>

            <div style={{ overflowY: "auto", flex: 1, marginBottom: "1rem" }}>
              {archivedGroups.length > 0 ? (
                archivedGroups.map((g) => {
                  const isConfirming = confirmPermDeleteId === g.id;
                  return (
                    <div
                      key={g.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.65rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        marginBottom: "0.45rem",
                        background: "var(--bg-alt)",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 9999, background: g.color }} />
                          <span style={{ fontSize: "0.8125rem", fontWeight: 550, color: "var(--text)" }}>{g.name}</span>
                        </div>
                        {g.archivedAt && (
                          <span style={{ fontSize: "0.6875rem", color: "var(--text-faint)", marginLeft: "1.1rem" }}>
                            {formatArchivedTime(g.archivedAt, isVietnamese)}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {isConfirming ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span style={{ fontSize: "0.72rem", color: "#DC2626", fontWeight: 500 }}>
                              {isVietnamese ? "Xóa vĩnh viễn?" : "Delete permanently?"}
                            </span>
                            <button
                              onClick={() => {
                                handlePermanentDeleteGroup(g.id);
                                setConfirmPermDeleteId(null);
                              }}
                              style={{
                                fontSize: "0.72rem",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "var(--radius-sm)",
                                background: "#DC2626",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              {isVietnamese ? "Xác nhận" : "Confirm"}
                            </button>
                            <button
                              onClick={() => setConfirmPermDeleteId(null)}
                              style={{
                                fontSize: "0.72rem",
                                padding: "0.15rem 0.35rem",
                                borderRadius: "var(--radius-sm)",
                                background: "none",
                                border: "1px solid var(--border)",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                              }}
                            >
                              {t.cancel}
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestoreGroup(g.id)}
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "var(--radius)",
                                border: "1px solid var(--border)",
                                background: "var(--card-bg, #fff)",
                                cursor: "pointer",
                                color: "var(--accent)",
                                fontWeight: 550,
                              }}
                            >
                              {t.restoreBtn}
                            </button>

                            <button
                              onClick={() => setConfirmPermDeleteId(g.id)}
                              title={t.permanentDeleteBtn}
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.2rem 0.4rem",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                color: "var(--text-faint)",
                                display: "flex",
                                alignItems: "center",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                            >
                              <Trash size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-faint)", fontSize: "0.8125rem" }}>
                  {t.trashEmpty}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowTrashModal(false);
                  setConfirmPermDeleteId(null);
                }}
                className="btn-ghost"
                style={{ padding: "0.35rem 0.85rem", fontSize: "0.8125rem" }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD GROUP MODAL ───────────────────────────────────────────────── */}
      {showAddGroupModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 250,
          }}
          onClick={() => setShowAddGroupModal(false)}
        >
          <div
            style={{
              background: "var(--card-bg, #fff)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              width: "100%",
              maxWidth: 360,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 620, color: "var(--text)", margin: 0 }}>
                {t.createCategoryModalTitle}
              </h3>
              <button
                onClick={() => setShowAddGroupModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}
              >
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={t.categoryNamePlaceholder}
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                  outline: "none",
                }}
              />

              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {["#16A34A", "#7C3AED", "#D97706", "#2563EB", "#DC2626", "#0D9488"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewGroupColor(c)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 9999,
                      background: c,
                      border: newGroupColor === c ? "2px solid #000" : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddGroupModal(false)}
                  className="btn-ghost"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem" }}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: "0.35rem 0.85rem", fontSize: "0.8125rem" }}
                >
                  {t.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RESOURCE MODAL ────────────────────────────────────────────────── */}
      {showResourceModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 250,
          }}
          onClick={() => setShowResourceModal(false)}
        >
          <div
            style={{
              background: "var(--card-bg, #fff)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              width: "100%",
              maxWidth: 520,
              maxHeight: "82vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 620, color: "var(--text)", margin: 0 }}>
                {t.resourcesSheetTitle} ({resources.length})
              </h3>
              <button
                onClick={() => setShowResourceModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.25rem", marginBottom: "1rem" }}>
              {resources.length > 0 ? (
                resources.map((res) => {
                  const linkedGroup = taskGroups.find((g) => String(g.id) === String(res.groupId));
                  return (
                    <div
                      key={res.id}
                      style={{
                        padding: "0.6rem 0.75rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        marginBottom: "0.5rem",
                        background: "var(--bg-alt)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.2rem" }}>
                          {linkedGroup ? (
                            <span
                              style={{
                                fontSize: "0.65625rem",
                                fontWeight: 600,
                                padding: "0.1rem 0.4rem",
                                borderRadius: "var(--radius-pill)",
                                background: `${linkedGroup.color}15`,
                                color: linkedGroup.color,
                                border: `1px solid ${linkedGroup.color}35`,
                                flexShrink: 0,
                              }}
                            >
                              {linkedGroup.name}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.65625rem",
                                fontWeight: 500,
                                padding: "0.1rem 0.35rem",
                                borderRadius: "var(--radius-pill)",
                                background: "var(--border)",
                                color: "var(--text-muted)",
                                flexShrink: 0,
                              }}
                            >
                              {isVietnamese ? "Chung" : "General"}
                            </span>
                          )}
                          <h4
                            style={{
                              fontSize: "0.84rem",
                              fontWeight: 600,
                              color: "var(--text)",
                              margin: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {res.title}
                          </h4>
                        </div>

                        {res.description && (
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.15rem 0 0.35rem" }}>
                            {res.description}
                          </p>
                        )}

                        <a
                          href={res.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.72rem",
                            color: "var(--accent)",
                            textDecoration: "none",
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{res.link}</span>
                          <ArrowSquareOut size={11} style={{ flexShrink: 0 }} />
                        </a>
                      </div>

                      <button
                        onClick={() => handleDeleteResource(res.id, res.title)}
                        title={isVietnamese ? "Xóa tài liệu" : "Delete resource"}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-faint)",
                          cursor: "pointer",
                          padding: "0.2rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-faint)", fontSize: "0.8125rem" }}>
                  {t.noResourcesYet}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateResource} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={newResTitle}
                    onChange={(e) => setNewResTitle(e.target.value)}
                    placeholder={`${t.resourceTitle}... *`}
                    required
                    style={{
                      flex: 1,
                      padding: "0.4rem 0.6rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      fontSize: "0.8125rem",
                      outline: "none",
                    }}
                  />
                  <select
                    value={newResGroupId}
                    onChange={(e) => setNewResGroupId(e.target.value)}
                    style={{
                      padding: "0.4rem 0.5rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      fontSize: "0.78125rem",
                      outline: "none",
                      background: "var(--input-bg, #fff)",
                      color: "var(--text)",
                      maxWidth: 160,
                    }}
                  >
                    <option value="">{t.generalResource}</option>
                    {taskGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="url"
                  value={newResLink}
                  onChange={(e) => setNewResLink(e.target.value)}
                  placeholder={t.resourceUrl}
                  style={{
                    padding: "0.4rem 0.6rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    fontSize: "0.8125rem",
                    outline: "none",
                  }}
                />
                <input
                  type="text"
                  value={newResDesc}
                  onChange={(e) => setNewResDesc(e.target.value)}
                  placeholder={t.resourceDescOptional}
                  style={{
                    padding: "0.4rem 0.6rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    fontSize: "0.8125rem",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.2rem" }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{
                      padding: "0.38rem 0.75rem",
                      fontSize: "0.8125rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Plus size={13} /> {t.addResource}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SETTINGS MODAL ────────────────────────────────────────────────── */}
      {showSettingsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 250,
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            style={{
              background: "var(--card-bg, #fff)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              width: "100%",
              maxWidth: 380,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 620, color: "var(--text)", margin: 0 }}>
                {t.settings}
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.84rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>{t.fullName}</span>
                <strong style={{ color: "var(--text)" }}>{currentUser.fullName || "Huy Nguyễn"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>{t.email}</span>
                <span style={{ color: "var(--text)" }}>{currentUser.email || "huy@example.com"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.4rem", borderTop: "1px solid var(--border)" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>{t.language}</span>
                  <span style={{ color: "var(--text)", fontWeight: 520 }}>{isVietnamese ? "Tiếng Việt" : "English"}</span>
                </div>
                <LanguageToggle size="sm" />
              </div>
              <div style={{ paddingTop: "0.4rem", borderTop: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>{isVietnamese ? "Hệ thống" : "System"}</span>
                <span style={{ color: "var(--text)" }}>WeekLoop v2.0</span>
              </div>
            </div>
            <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={handleLogout}
                style={{
                  padding: "0.35rem 0.8rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid #FCA5A5",
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                {t.logout}
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn-ghost"
                style={{
                  padding: "0.35rem 0.8rem",
                  fontSize: "0.8125rem",
                }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM NAVIGATION BAR ─── */}
      <nav className="mobile-bottom-bar" aria-label={isVietnamese ? "Điều hướng nhanh trên điện thoại" : "Mobile quick navigation"}>
        <button
          type="button"
          className={`mobile-bottom-tab ${activeTab === "planner" && !mobileSidebarOpen && !mobileSidePanelOpen ? "active" : ""}`}
          onClick={() => {
            setActiveTab("planner");
            setMobileSidebarOpen(false);
            setMobileSidePanelOpen(false);
          }}
        >
          <Calendar size={20} weight={activeTab === "planner" && !mobileSidebarOpen && !mobileSidePanelOpen ? "fill" : "regular"} />
          <span>{isVietnamese ? "Kế hoạch" : "Planner"}</span>
        </button>

        <button
          type="button"
          className={`mobile-bottom-tab ${activeTab === "agenda" && !mobileSidebarOpen && !mobileSidePanelOpen ? "active" : ""}`}
          onClick={() => {
            setActiveTab("agenda");
            setMobileSidebarOpen(false);
            setMobileSidePanelOpen(false);
          }}
        >
          <ListChecks size={20} weight={activeTab === "agenda" && !mobileSidebarOpen && !mobileSidePanelOpen ? "fill" : "regular"} />
          <span>{isVietnamese ? "Cần làm" : "To-do"}</span>
        </button>

        <button
          type="button"
          className={`mobile-bottom-tab ${activeTab === "visions" && !mobileSidebarOpen && !mobileSidePanelOpen ? "active" : ""}`}
          onClick={() => {
            setActiveTab("visions");
            setMobileSidebarOpen(false);
            setMobileSidePanelOpen(false);
          }}
        >
          <Flag size={20} weight={activeTab === "visions" && !mobileSidebarOpen && !mobileSidePanelOpen ? "fill" : "regular"} />
          <span>{t.visions}</span>
        </button>

        <button
          type="button"
          className={`mobile-bottom-tab ${mobileSidePanelOpen ? "active" : ""}`}
          onClick={() => {
            setMobileSidePanelOpen((v) => !v);
            setMobileSidebarOpen(false);
          }}
          aria-label={t.sideTasks}
        >
          <div style={{ position: "relative", display: "inline-flex" }}>
            <CheckSquare size={20} weight={mobileSidePanelOpen ? "fill" : "regular"} />
            {sideTasks.filter((task) => !task.isDone).length > 0 && (
              <span className="bottom-bar-badge">{sideTasks.filter((task) => !task.isDone).length}</span>
            )}
          </div>
          <span>{t.sideTasks}</span>
        </button>

        <button
          type="button"
          className={`mobile-bottom-tab ${activeTab === "notes" && !mobileSidebarOpen && !mobileSidePanelOpen ? "active" : ""}`}
          onClick={() => {
            setActiveTab("notes");
            setMobileSidebarOpen(false);
            setMobileSidePanelOpen(false);
          }}
        >
          <Notebook size={20} weight={activeTab === "notes" && !mobileSidebarOpen && !mobileSidePanelOpen ? "fill" : "regular"} />
          <span>{t.notes}</span>
        </button>
      </nav>

      <style>{`
        .mobile-hamburger-btn,
        .mobile-sidepanel-btn,
        .mobile-drawer-header,
        .mobile-bottom-bar,
        .mobile-backdrop {
          display: none;
        }

        .sidepanel-wrapper {
          display: flex;
          height: 100%;
        }

        .sidepanel-mobile-only {
          display: none !important;
        }

        @media (max-width: 767px) {
          .mobile-hamburger-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            border: none;
            background: transparent;
            color: var(--text);
            cursor: pointer;
            flex-shrink: 0;
          }
          .mobile-hamburger-btn:hover { background: var(--bg-alt); }
          .mobile-sidepanel-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            border-radius: var(--radius);
            border: 1px solid var(--border);
            background: var(--bg);
            color: var(--text);
            cursor: pointer;
            position: relative;
            flex-shrink: 0;
          }
          .mobile-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: var(--accent);
            color: #fff;
            font-size: 0.5625rem;
            font-weight: 700;
            width: 15px;
            height: 15px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
          .mobile-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            z-index: 100;
          }
          #app-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 304px !important;
            max-width: 86vw !important;
            z-index: 110 !important;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
            background: var(--card-bg, #fff) !important;
          }
          #app-sidebar.mobile-drawer-open {
            transform: translateX(0);
          }
          .mobile-drawer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.85rem 1rem 0.5rem;
            border-bottom: 1px solid var(--border);
          }
          .sidepanel-wrapper {
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 320px !important;
            max-width: 88vw !important;
            z-index: 110 !important;
            transform: translateX(100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
            background: var(--card-bg, #fff) !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .sidepanel-mobile-only {
            display: flex !important;
          }
          .sidepanel-wrapper.mobile-drawer-open {
            transform: translateX(0);
          }
          .sidepanel-wrapper #side-panel {
            width: 100% !important;
            height: 100% !important;
            border-left: none !important;
            background: var(--card-bg, #fff) !important;
          }
          .mobile-bottom-bar {
            display: flex;
            align-items: center;
            justify-content: space-around;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: var(--card-bg);
            border-top: 1px solid var(--border);
            box-shadow: var(--shadow-bar);
            z-index: 50;
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
          .mobile-bottom-tab {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 11.5px;
            font-weight: 500;
            padding: 6px 0;
            cursor: pointer;
            transition: color 0.15s ease;
          }
          .mobile-bottom-tab.active {
            color: var(--accent-contrast);
            font-weight: 700;
          }
          .mobile-bottom-tab span {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .bottom-bar-badge {
            position: absolute;
            top: -4px;
            right: -6px;
            background: var(--accent);
            color: #fff;
            font-size: 0.55rem;
            font-weight: 700;
            padding: 1px 4px;
            border-radius: 9999px;
            min-width: 14px;
            text-align: center;
            line-height: 1.2;
          }
          #main-grid, #agenda-view, #notes-view, #visions-view {
            padding-bottom: 72px !important;
          }
          .app-toast {
            bottom: 72px !important;
            right: 12px !important;
            left: 12px !important;
          }
          .desktop-only-btn {
            display: none !important;
          }
          .nav-center-wrapper {
            max-width: 160px;
          }
          .nav-center-pill {
            min-width: unset !important;
            padding: 0.2rem 0.35rem !important;
          }
          .nav-center-label {
            font-size: 0.72rem !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 75px;
          }
        }
      `}</style>
    </div>
  );
}
