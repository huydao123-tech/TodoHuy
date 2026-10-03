"use client";

import { useState, useCallback, useEffect } from "react";
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
  dateStrToOffset,
} from "@/lib/mockData";
import {
  dashboardApi,
  taskGroupApi,
  sideTaskApi,
  resourceApi,
  workItemApi,
  weeklyGoalApi,
  removeAuthToken,
} from "@/lib/api";
import WeekGrid from "@/components/app/WeekGrid";
import SidePanel from "@/components/app/SidePanel";
import NotesGallery from "@/components/app/NotesGallery";
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
  Trash,
  Notebook,
  PencilSimple,
  List,
  CheckSquare,
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
        background: active ? "var(--accent-bg)" : "none",
        border: "none",
        cursor: "pointer",
        padding: "0.45rem 0.625rem",
        borderRadius: "var(--radius)",
        textAlign: "left",
        transition: "background 0.14s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--border)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ color: active ? "var(--accent)" : "var(--text-faint)", display: "flex" }}>
          {icon}
        </span>
        <span
          style={{
            fontSize: "0.8125rem",
            color: active ? "var(--accent)" : "var(--text-muted)",
            fontWeight: active ? 580 : 400,
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
            padding: "0.05rem 0.4rem",
            borderRadius: "var(--radius-pill)",
            background: active ? "var(--accent)" : "var(--border)",
            color: active ? "#fff" : "var(--text-muted)",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── DASHBOARD CHÍNH ─────────────────────────────────────────────────────────
export interface ArchivedTaskGroup extends TaskGroup {
  archivedAt?: string | null;
}

function formatArchivedTime(isoString?: string | null): string {
  if (!isoString) return "Đã xóa gần đây";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Đã xóa gần đây";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return "Đã xóa hôm nay";
  if (diffDays === 1) return "Đã xóa hôm qua";
  return `Đã xóa ${diffDays} ngày trước`;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"planner" | "notes">("planner");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileSidePanelOpen, setMobileSidePanelOpen] = useState(false);

  const [viewOffset, setViewOffset] = useState(0);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<ArchivedTaskGroup[]>([]);
  const [sideTasks, setSideTasks] = useState<SideTaskData[]>([]);
  const [resources, setResources] = useState<ResourceData[]>([]);

  const [goalsMap, setGoalsMap] = useState<Record<string, string>>({});
  const [workItemsMap, setWorkItemsMap] = useState<Record<string, WorkItemData[]>>({});

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
    const colors = ["#16A34A", "#7C3AED", "#D97706", "#2563EB", "#DC2626", "#0D9488"];

    dashboardApi
      .getDashboard()
      .then((data) => {
        const activeList = (data.taskGroups ?? [])
          .filter((g) => !g.isArchived)
          .map((g, idx) => ({
            id: g.id,
            name: g.name,
            color: colors[idx % colors.length],
          }));

        // Đảm bảo không trùng ID
        const uniqueGroups = Array.from(new Map(activeList.map((item) => [item.id, item])).values());
        setTaskGroups(uniqueGroups);
        setSideTasks(data.sideTasks ?? []);

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
          });
        });

        setGoalsMap(gMap);
        setWorkItemsMap(wMap);
      })
      .catch(() => {
        setTaskGroups(TASK_GROUPS);
        setSideTasks(INITIAL_SIDE_TASKS);

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

    taskGroupApi
      .getTrash()
      .then((trashList) => {
        setArchivedGroups(
          (trashList ?? []).map((g, idx) => ({
            id: g.id,
            name: g.name,
            color: colors[(idx + 3) % colors.length],
            archivedAt: g.archivedAt,
          }))
        );
      })
      .catch(() => {
        setArchivedGroups([]);
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
  const handleSoftDeleteGroup = useCallback((id: string | number, name?: string) => {
    setTaskGroups((prev) => {
      const target = prev.find((g) => g.id === id);
      if (!target) return prev;

      setArchivedGroups((arch) => [
        { ...target, archivedAt: new Date().toISOString() },
        ...arch.filter((a) => a.id !== id),
      ]);

      setToast({
        text: `Đã chuyển "${target.name}" vào thùng rác`,
        actionText: "Hoàn tác",
        onAction: () => handleRestoreGroup(id),
      });

      return prev.filter((g) => g.id !== id);
    });

    taskGroupApi.delete(id).catch(() => {});
  }, []);

  const handleRestoreGroup = useCallback((id: string | number) => {
    setArchivedGroups((prev) => {
      const target = prev.find((g) => g.id === id);
      if (!target) return prev;

      setTaskGroups((active) => [...active, target]);

      setToast({
        text: `Đã khôi phục "${target.name}"`,
      });

      return prev.filter((g) => g.id !== id);
    });

    taskGroupApi.restore(id).catch(() => {});
  }, []);

  const handlePermanentDeleteGroup = useCallback((id: string | number) => {
    setArchivedGroups((prev) => prev.filter((g) => g.id !== id));
    taskGroupApi.permanentDelete(id).catch(() => {});
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
        text: `Đã bỏ "${name}" khỏi tuần này`,
        actionText: "Hoàn tác",
        onAction: () => {
          setExcludedByWeek((prev) => ({
            ...prev,
            [absoluteOffset]: (prev[absoluteOffset] ?? []).filter((id) => id !== groupId),
          }));
        },
      });
    },
    []
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

  const handleAddItem = useCallback(async (groupId: string | number, offset: number, content: string) => {
    const key = `${groupId}:${offset}`;
    const weekStartDate = getWeekDateStr(offset);
    const tempId = `temp-${Date.now()}`;
    const newItem: WorkItemData = {
      id: tempId,
      content,
      status: "TODO",
      note: "",
    };
    setWorkItemsMap((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), newItem],
    }));

    try {
      const created = await workItemApi.create(groupId, weekStartDate, content, "");
      setWorkItemsMap((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).map((item) => (item.id === tempId ? { ...item, id: created.id } : item)),
      }));
    } catch (e) {
      console.error("Lỗi thêm công việc vào Firebase:", e);
    }
  }, []);

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

  const handleDeleteItem = useCallback((groupId: string | number, offset: number, itemId: string | number) => {
    const key = `${groupId}:${offset}`;
    setWorkItemsMap((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((item) => item.id !== itemId),
    }));
    workItemApi.delete(itemId).catch(console.error);
  }, []);

  // ─── SIDE TASKS ──────────────────────────────────────────────────────────
  const handleToggleSideTask = useCallback((id: string | number) => {
    setSideTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
    sideTaskApi.toggle(id).catch(console.error);
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

  const handleDeleteSideTask = useCallback((id: string | number) => {
    setSideTasks((prev) => prev.filter((t) => t.id !== id));
    sideTaskApi.delete(id).catch(console.error);
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const newGroup: TaskGroup = {
      id: tempId,
      name: newGroupName.trim(),
      color: newGroupColor,
    };
    setTaskGroups((prev) => [...prev, newGroup]);
    setNewGroupName("");
    setShowAddGroupModal(false);

    try {
      const created = await taskGroupApi.create(newGroup.name, "MAIN", 0, newGroupColor);
      setTaskGroups((prev) =>
        prev.map((g) => (g.id === tempId ? { ...g, id: created.id } : g))
      );
    } catch {}
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
        text: `Đã xóa tài liệu "${title}"`,
        actionText: "Hoàn tác",
        onAction: () => {
          setResources((prev) => [target, ...prev]);
          resourceApi.create(target.title, target.link, target.description, target.groupId).catch(() => {});
        },
      });
    }
  }, [resources]);

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = "/login";
  };

  const navToPrev = () => setViewOffset((v) => v - 1);
  const navToNext = () => setViewOffset((v) => v + 1);
  const navToToday = () => setViewOffset(0);

  const centerLabel = getNavLabel(viewOffset);
  const isAtToday = viewOffset === 0;

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
      {/* ─── TOP BAR ─────────────────────────────────────────────────────── */}
      <nav
        id="app-nav"
        aria-label="Điều hướng ứng dụng"
        style={{
          height: 60,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 0.85rem",
          borderBottom: "1px solid var(--border)",
          background: "#fff",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Nút Hamburger chỉ hiện trên điện thoại */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            aria-label="Mở menu danh mục đầu việc"
            title="Menu đầu việc"
          >
            <List size={20} weight="bold" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                background: "var(--accent)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontWeight: 620,
                fontSize: "0.9375rem",
                color: "var(--text)",
                letterSpacing: "-0.02em",
              }}
            >
              WeekLoop
            </span>
          </Link>
        </div>

        {/* Center: Week Navigator (only in planner) */}
        {activeTab === "planner" ? (
          <div
            className="nav-center-wrapper"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <button
              id="nav-prev-week"
              onClick={navToPrev}
              title="Tuần trước"
              aria-label="Tuần trước"
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              <CaretLeft size={13} />
            </button>

            <div
              className="nav-center-pill"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--bg-alt)",
                minWidth: 140,
                justifyContent: "center",
              }}
            >
              <Calendar size={13} color="var(--text-faint)" />
              <span
                className="nav-center-label"
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: "0.78125rem",
                  color: "var(--text)",
                  fontWeight: 500,
                }}
              >
                {centerLabel}
              </span>
            </div>

            <button
              id="nav-next-week"
              onClick={navToNext}
              title="Tuần sau"
              aria-label="Tuần sau"
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              <CaretRight size={13} />
            </button>

            {!isAtToday && (
              <button
                id="nav-today"
                className="desktop-only-btn"
                onClick={navToToday}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--accent)",
                  background: "var(--accent-bg)",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 550,
                  whiteSpace: "nowrap",
                }}
              >
                <ArrowCounterClockwise size={11} />
                Về hôm nay
              </button>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* User menu & Mobile Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {/* Nút bật Drawer Việc phụ trên điện thoại */}
          {activeTab === "planner" && (
            <button
              type="button"
              className="mobile-sidepanel-btn"
              onClick={() => setMobileSidePanelOpen((v) => !v)}
              aria-label="Mở danh sách việc phụ"
              title="Việc phụ"
            >
              <CheckSquare size={17} weight="bold" />
              {sideTasks.filter((t) => !t.isDone).length > 0 && (
                <span className="mobile-badge">
                  {sideTasks.filter((t) => !t.isDone).length}
                </span>
              )}
            </button>
          )}

          <button
            id="user-menu-btn"
            onClick={() => setShowSettingsModal(true)}
            aria-label="Tài khoản người dùng"
            title="Tài khoản cá nhân"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9999,
              background: "var(--bg-alt)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text)",
              flexShrink: 0,
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          >
            {currentUser.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : "HN"}
          </button>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--text-faint)",
              padding: "0.35rem",
              borderRadius: "var(--radius)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <SignOut size={16} />
          </button>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
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
            width: 220,
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            background: "var(--bg-alt)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Header trong drawer điện thoại */}
          <div className="mobile-drawer-header">
            <span style={{ fontWeight: 620, fontSize: "0.875rem", color: "var(--text)" }}>Menu & Đầu việc</span>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Navigation tabs */}
          <div style={{ padding: "0.75rem 0.75rem 0.35rem" }}>
            <SideNavItem
              icon={<Calendar size={15} />}
              label="Kế hoạch 3 tuần"
              active={activeTab === "planner"}
              onClick={() => {
                setActiveTab("planner");
                setMobileSidebarOpen(false);
              }}
            />
            <SideNavItem
              icon={<Notebook size={15} />}
              label="Ghi chú"
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
          <div style={{ padding: "0.35rem 0.75rem 0.75rem", flex: 1 }}>
            <p
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: "0.5625rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "var(--text-faint)",
                marginBottom: "0.45rem",
                paddingLeft: "0.625rem",
              }}
            >
              Đầu việc chính
            </p>

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
                  padding: "0.32rem 0.55rem 0.32rem 0.625rem",
                  borderRadius: "var(--radius)",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--border)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
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
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text)",
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {g.name}
                    </span>
                  )}
                </div>

                {!isEditing && (
                  <div style={{ display: "flex", gap: "2px" }}>
                    <button
                      onClick={() => {
                        setEditingGroupId(g.id);
                        setEditGroupVal(g.name);
                      }}
                      title="Sửa đầu việc"
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
                      onClick={() => handleSoftDeleteGroup(g.id, g.name)}
                      title="Chuyển vào thùng rác"
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
                padding: "0.35rem 0.625rem",
                borderRadius: "var(--radius)",
                color: "var(--text-faint)",
                fontSize: "0.8rem",
                marginTop: "0.2rem",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--accent)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-faint)")}
            >
              <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>+</span>
              Thêm đầu việc
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
          <div style={{ padding: "0.6rem 0.75rem" }}>
            <SideNavItem
              icon={<Trash size={15} />}
              label="Thùng rác"
              badge={archivedGroups.length > 0 ? archivedGroups.length : null}
              onClick={() => setShowTrashModal(true)}
            />

            <SideNavItem
              icon={<BookOpen size={15} />}
              label="Tài liệu & Link"
              badge={resources.length > 0 ? resources.length : null}
              onClick={() => setShowResourceModal(true)}
            />

            <SideNavItem
              icon={<Gear size={15} />}
              label="Cài đặt hệ thống"
              onClick={() => setShowSettingsModal(true)}
            />
          </div>
        </aside>

        {/* Content switch */}
        {activeTab === "planner" ? (
          <>
            <main id="main-grid" style={{ flex: 1, overflowY: "auto" }}>
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
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: "var(--accent-bg)",
                      color: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <Calendar size={26} weight="duotone" />
                  </div>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 650,
                      color: "var(--text)",
                      marginBottom: "0.45rem",
                    }}
                  >
                    Bắt đầu kế hoạch tuần của bạn
                  </h3>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      maxWidth: 380,
                      lineHeight: 1.5,
                      marginBottom: "1.25rem",
                    }}
                  >
                    Tạo đầu việc chính đầu tiên (ví dụ: Học ngoại ngữ, Tập luyện, Dự án cá nhân) để bắt đầu phân bổ công việc theo từng tuần.
                  </p>
                  <button
                    onClick={() => setShowAddGroupModal(true)}
                    className="btn-primary"
                    style={{
                      padding: "0.5rem 1.1rem",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Plus size={15} weight="bold" />
                    Tạo đầu việc đầu tiên
                  </button>
                </div>
              ) : (
                <WeekGrid
                  viewOffset={viewOffset}
                  taskGroups={taskGroups}
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
                  onCycleStatus={handleCycleStatus}
                />
              )}
            </main>

            {/* Backdrop cho Mobile SidePanel Drawer */}
            {mobileSidePanelOpen && (
              <div
                className="mobile-backdrop"
                onClick={() => setMobileSidePanelOpen(false)}
              />
            )}

            <div className={`sidepanel-wrapper ${mobileSidePanelOpen ? "mobile-drawer-open" : ""}`}>
              {/* Header cho mobile drawer việc phụ */}
              <div className="mobile-drawer-header">
                <span style={{ fontWeight: 620, fontSize: "0.875rem", color: "var(--text)" }}>Danh sách việc phụ</span>
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
                onToggle={handleToggleSideTask}
                onAdd={handleAddSideTask}
                onDelete={handleDeleteSideTask}
              />
            </div>
          </>
        ) : (
          <main id="notes-view" style={{ flex: 1, overflowY: "auto", display: "flex" }}>
            <NotesGallery />
          </main>
        )}
      </div>

      {/* ─── TOAST ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.18 }}
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
              background: "#fff",
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
                Thùng rác ({archivedGroups.length})
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
              Các nhóm trong thùng rác có thể khôi phục lại bất kỳ lúc nào hoặc xóa vĩnh viễn.
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
                            {formatArchivedTime(g.archivedAt)}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {isConfirming ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span style={{ fontSize: "0.72rem", color: "#DC2626", fontWeight: 500 }}>Xóa vĩnh viễn?</span>
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
                              Xác nhận
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
                              Hủy
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
                                background: "#fff",
                                cursor: "pointer",
                                color: "var(--accent)",
                                fontWeight: 550,
                              }}
                            >
                              Khôi phục
                            </button>

                            <button
                              onClick={() => setConfirmPermDeleteId(g.id)}
                              title="Xóa vĩnh viễn"
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
                  Thùng rác trống
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
                Đóng
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
              background: "#fff",
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
                Thêm đầu việc chính
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
                placeholder="Tên đầu việc..."
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
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: "0.35rem 0.85rem", fontSize: "0.8125rem" }}
                >
                  Tạo đầu việc
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
              background: "#fff",
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
                Tài liệu & Link ({resources.length})
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
                              Chung
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
                        title="Xóa tài liệu"
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
                  Chưa có tài liệu nào. Thêm link mới ở bên dưới.
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
                    placeholder="Tiêu đề tài liệu... *"
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
                      background: "#fff",
                      color: "var(--text)",
                      maxWidth: 160,
                    }}
                  >
                    <option value="">Chung (Không nhóm)</option>
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
                  placeholder="Đường dẫn (URL, ví dụ: https://...)"
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
                  placeholder="Ghi chú ngắn (tùy chọn)..."
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
                    <Plus size={13} /> Thêm tài liệu
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
              background: "#fff",
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
                Tài khoản
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
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>Chủ tài khoản</span>
                <strong style={{ color: "var(--text)" }}>{currentUser.fullName || "Huy Nguyễn"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>Email</span>
                <span style={{ color: "var(--text)" }}>{currentUser.email || "huy@example.com"}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.72rem" }}>Hệ thống</span>
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
                Đăng xuất
              </button>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn-ghost"
                style={{
                  padding: "0.35rem 0.8rem",
                  fontSize: "0.8125rem",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM NAVIGATION BAR ─── */}
      <nav className="mobile-bottom-bar" aria-label="Điều hướng nhanh trên điện thoại">
        <button
          type="button"
          className={`mobile-bottom-tab ${activeTab === "planner" && !mobileSidebarOpen && !mobileSidePanelOpen ? "active" : ""}`}
          onClick={() => {
            setActiveTab("planner");
            setMobileSidebarOpen(false);
            setMobileSidePanelOpen(false);
          }}
        >
          <Calendar size={19} weight={activeTab === "planner" && !mobileSidebarOpen && !mobileSidePanelOpen ? "fill" : "regular"} />
          <span>Kế hoạch</span>
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
          <Notebook size={19} weight={activeTab === "notes" && !mobileSidebarOpen && !mobileSidePanelOpen ? "fill" : "regular"} />
          <span>Ghi chú</span>
        </button>

        {activeTab === "planner" && (
          <button
            type="button"
            className={`mobile-bottom-tab ${mobileSidePanelOpen ? "active" : ""}`}
            onClick={() => {
              setMobileSidePanelOpen((v) => !v);
              setMobileSidebarOpen(false);
            }}
          >
            <div style={{ position: "relative", display: "inline-flex" }}>
              <CheckSquare size={19} weight={mobileSidePanelOpen ? "fill" : "regular"} />
              {sideTasks.filter((t) => !t.isDone).length > 0 && (
                <span className="bottom-bar-badge">
                  {sideTasks.filter((t) => !t.isDone).length}
                </span>
              )}
            </div>
            <span>Việc phụ</span>
          </button>
        )}

        <button
          type="button"
          className={`mobile-bottom-tab ${mobileSidebarOpen ? "active" : ""}`}
          onClick={() => {
            setMobileSidebarOpen((v) => !v);
            setMobileSidePanelOpen(false);
          }}
        >
          <List size={19} weight={mobileSidebarOpen ? "bold" : "regular"} />
          <span>Đầu việc</span>
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

        @media (max-width: 767px) {
          .mobile-hamburger-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: var(--radius);
            border: 1px solid var(--border);
            background: var(--bg);
            color: var(--text);
            cursor: pointer;
            flex-shrink: 0;
          }
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
            width: 280px !important;
            max-width: 82vw !important;
            z-index: 110 !important;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
            background: #fff !important;
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
            background: #fff !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .sidepanel-wrapper.mobile-drawer-open {
            transform: translateX(0);
          }
          .sidepanel-wrapper #side-panel {
            width: 100% !important;
            height: 100% !important;
            border-left: none !important;
            background: #fff !important;
          }
          .mobile-bottom-bar {
            display: flex;
            align-items: center;
            justify-content: space-around;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 56px;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-top: 1px solid var(--border);
            z-index: 50;
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
          .mobile-bottom-tab {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 0.6875rem;
            font-weight: 500;
            padding: 6px 0;
            cursor: pointer;
            transition: color 0.15s ease;
          }
          .mobile-bottom-tab.active {
            color: var(--accent);
            font-weight: 600;
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
          #main-grid, #notes-view {
            padding-bottom: 64px !important;
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
