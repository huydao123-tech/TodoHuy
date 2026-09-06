"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  getNavLabel,
  type SideTaskData,
  type TaskGroup,
  type ResourceData,
  type WorkItemData,
  TASK_GROUPS,
  INITIAL_SIDE_TASKS,
  RESOURCES,
  getGoalText,
  getWorkItems,
} from "@/lib/mockData";
import {
  dashboardApi,
  taskGroupApi,
  sideTaskApi,
  resourceApi,
  workItemApi,
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
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"planner" | "notes">("planner");

  const [viewOffset, setViewOffset] = useState(0);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<TaskGroup[]>([]);
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

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupVal, setEditGroupVal] = useState("");

  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResTitle, setNewResTitle] = useState("");
  const [newResLink, setNewResLink] = useState("");
  const [newResDesc, setNewResDesc] = useState("");

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

        const offsets: Record<string, number> = {};
        if (data.prevWeekStart) offsets[data.prevWeekStart] = -1;
        if (data.currentWeekStart) offsets[data.currentWeekStart] = 0;
        if (data.nextWeekStart) offsets[data.nextWeekStart] = 1;

        (data.weeklyGoals ?? []).forEach((goal) => {
          const off = offsets[goal.weekStartDate] ?? 0;
          gMap[`${goal.taskGroupId}:${off}`] = goal.goalText;
        });

        (data.workItems ?? []).forEach((item) => {
          const off = offsets[item.weekStartDate] ?? 0;
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
  const handleSoftDeleteGroup = useCallback((id: number, name?: string) => {
    setTaskGroups((prev) => {
      const target = prev.find((g) => g.id === id);
      if (!target) return prev;

      setArchivedGroups((arch) => [target, ...arch.filter((a) => a.id !== id)]);

      setToast({
        text: `Đã chuyển "${target.name}" vào thùng rác`,
        actionText: "Hoàn tác",
        onAction: () => handleRestoreGroup(id),
      });

      return prev.filter((g) => g.id !== id);
    });

    taskGroupApi.delete(id).catch(() => {});
  }, []);

  const handleRestoreGroup = useCallback((id: number) => {
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

  const handlePermanentDeleteGroup = useCallback((id: number) => {
    setArchivedGroups((prev) => prev.filter((g) => g.id !== id));
    taskGroupApi.permanentDelete(id).catch(() => {});
  }, []);

  // ─── BỎ ĐẦU VIỆC KHỎI MỘT TUẦN CỤ THỂ (KHÔNG VÀO THÙNG RÁC) ────────────────
  const [excludedByWeek, setExcludedByWeek] = useState<Record<number, number[]>>({});

  const handleRemoveGroupFromWeek = useCallback(
    (groupId: number, absoluteOffset: number, name: string) => {
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

  const handleAddGroupToWeek = useCallback((groupId: number, absoluteOffset: number) => {
    setExcludedByWeek((prev) => ({
      ...prev,
      [absoluteOffset]: (prev[absoluteOffset] ?? []).filter((id) => id !== groupId),
    }));
  }, []);

  // ─── WORK ITEMS & GOALS ──────────────────────────────────────────────────
  const handleSaveGoal = useCallback((groupId: number, offset: number, text: string) => {
    const key = `${groupId}:${offset}`;
    setGoalsMap((prev) => ({ ...prev, [key]: text }));
  }, []);

  const handleAddItem = useCallback((groupId: number, offset: number, content: string) => {
    const key = `${groupId}:${offset}`;
    const newItem: WorkItemData = {
      id: Date.now(),
      content,
      status: "TODO",
      note: "",
    };
    setWorkItemsMap((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), newItem],
    }));
  }, []);

  const handleCycleStatus = useCallback((groupId: number, offset: number, itemId: number) => {
    const key = `${groupId}:${offset}`;
    setWorkItemsMap((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((item) => {
        if (item.id !== itemId) return item;
        const cycle = ["TODO", "IN_PROGRESS", "DONE"] as const;
        const nextStatus = cycle[(cycle.indexOf(item.status) + 1) % 3];
        workItemApi.update(itemId, { status: nextStatus }).catch(() => {});
        return { ...item, status: nextStatus };
      }),
    }));
  }, []);

  const handleUpdateItem = useCallback((groupId: number, offset: number, itemId: number, content: string) => {
    const key = `${groupId}:${offset}`;
    setWorkItemsMap((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, content };
      }),
    }));
    workItemApi.update(itemId, { content }).catch(() => {});
  }, []);

  const handleDeleteItem = useCallback((groupId: number, offset: number, itemId: number) => {
    const key = `${groupId}:${offset}`;
    setWorkItemsMap((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((item) => item.id !== itemId),
    }));
    workItemApi.delete(itemId).catch(() => {});
  }, []);

  // ─── SIDE TASKS ──────────────────────────────────────────────────────────
  const handleToggleSideTask = useCallback((id: number) => {
    setSideTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
    sideTaskApi.toggle(id).catch(() => {});
  }, []);

  const handleAddSideTask = useCallback(async (name: string) => {
    const tempId = Date.now();
    setSideTasks((prev) => [...prev, { id: tempId, name, isDone: false }]);
    try {
      const created = await sideTaskApi.create(name);
      setSideTasks((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: created.id } : t))
      );
    } catch {}
  }, []);

  const handleDeleteSideTask = useCallback((id: number) => {
    setSideTasks((prev) => prev.filter((t) => t.id !== id));
    sideTaskApi.delete(id).catch(() => {});
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const tempId = Date.now();
    const newGroup: TaskGroup = {
      id: tempId,
      name: newGroupName.trim(),
      color: newGroupColor,
    };
    setTaskGroups((prev) => [...prev, newGroup]);
    setNewGroupName("");
    setShowAddGroupModal(false);

    try {
      const created = await taskGroupApi.create(newGroup.name);
      setTaskGroups((prev) =>
        prev.map((g) => (g.id === tempId ? { ...g, id: created.id } : g))
      );
    } catch {}
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle.trim()) return;
    const tempId = Date.now();
    const newRes: ResourceData = {
      id: tempId,
      groupId: null,
      title: newResTitle.trim(),
      link: newResLink.trim() || "https://example.com",
      description: newResDesc.trim(),
    };
    setResources((prev) => [...prev, newRes]);
    setNewResTitle("");
    setNewResLink("");
    setNewResDesc("");

    try {
      const created = await resourceApi.create(newRes.title, newRes.link, newRes.description);
      setResources((prev) =>
        prev.map((r) => (r.id === tempId ? { ...r, id: created.id } : r))
      );
    } catch {}
  };

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
          padding: "0 1.25rem",
          borderBottom: "1px solid var(--border)",
          background: "#fff",
          gap: "1rem",
        }}
      >
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

        {/* Center: Week Navigator (only in planner) */}
        {activeTab === "planner" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <button
              id="nav-prev-week"
              onClick={navToPrev}
              title="Tuần trước"
              aria-label="Tuần trước"
              style={{
                width: 30,
                height: 30,
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <CaretLeft size={13} />
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.2rem 0.7rem",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--bg-alt)",
                minWidth: 180,
                justifyContent: "center",
              }}
            >
              <Calendar size={13} color="var(--text-faint)" />
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: "0.8125rem",
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
                width: 30,
                height: 30,
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <CaretRight size={13} />
            </button>

            {!isAtToday && (
              <button
                id="nav-today"
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

        {/* User menu */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            id="user-menu-btn"
            onClick={() => setShowSettingsModal(true)}
            aria-label="Tài khoản người dùng"
            title="Tài khoản cá nhân"
            style={{
              width: 32,
              height: 32,
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
              fontSize: "0.78125rem",
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
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ─── LEFT SIDEBAR ────────────────────────────────────────────────── */}
        <aside
          id="app-sidebar"
          aria-label="Điều hướng chính"
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
          {/* Main Navigation tabs */}
          <div style={{ padding: "0.75rem 0.75rem 0.35rem" }}>
            <SideNavItem
              icon={<Calendar size={15} />}
              label="Kế hoạch 3 tuần"
              active={activeTab === "planner"}
              onClick={() => setActiveTab("planner")}
            />
            <SideNavItem
              icon={<Notebook size={15} />}
              label="Ghi chú"
              active={activeTab === "notes"}
              onClick={() => setActiveTab("notes")}
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
              label="Tài liệu tham khảo"
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
            </main>

            <SidePanel
              sideTasks={sideTasks}
              onToggle={handleToggleSideTask}
              onAdd={handleAddSideTask}
              onDelete={handleDeleteSideTask}
            />
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
          onClick={() => setShowTrashModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              width: "100%",
              maxWidth: 440,
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
                onClick={() => setShowTrashModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}
              >
                <X size={15} />
              </button>
            </div>

            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0 0 1rem" }}>
              Các đầu việc đã xóa mềm. Khôi phục sẽ hiển thị lại đầu việc và công việc con trong tuần.
            </p>

            <div style={{ overflowY: "auto", flex: 1, marginBottom: "1rem" }}>
              {archivedGroups.length > 0 ? (
                archivedGroups.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.65rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      marginBottom: "0.4rem",
                      background: "var(--bg-alt)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 9999, background: g.color }} />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 550, color: "var(--text)" }}>{g.name}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button
                        onClick={() => handleRestoreGroup(g.id)}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--border)",
                          background: "#fff",
                          cursor: "pointer",
                          color: "var(--text)",
                        }}
                      >
                        Khôi phục
                      </button>

                      <button
                        onClick={() => handlePermanentDeleteGroup(g.id)}
                        title="Xóa vĩnh viễn"
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.2rem 0.4rem",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "#DC2626",
                        }}
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-faint)", fontSize: "0.8125rem" }}>
                  Thùng rác trống
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowTrashModal(false)}
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
              maxWidth: 500,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 620, color: "var(--text)", margin: 0 }}>
                Tài liệu tham khảo
              </h3>
              <button
                onClick={() => setShowResourceModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.25rem", marginBottom: "1rem" }}>
              {resources.map((res) => (
                <div
                  key={res.id}
                  style={{
                    padding: "0.55rem 0.7rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    marginBottom: "0.45rem",
                    background: "var(--bg-alt)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                      {res.title}
                    </h4>
                    <a
                      href={res.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: "0.75rem",
                        color: "var(--accent)",
                        textDecoration: "none",
                      }}
                    >
                      Mở link <ArrowSquareOut size={12} />
                    </a>
                  </div>
                  {res.description && (
                    <p style={{ fontSize: "0.78125rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                      {res.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateResource} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <input
                  type="text"
                  value={newResTitle}
                  onChange={(e) => setNewResTitle(e.target.value)}
                  placeholder="Tiêu đề tài liệu..."
                  required
                  style={{
                    padding: "0.38rem 0.55rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    fontSize: "0.8125rem",
                    outline: "none",
                  }}
                />
                <input
                  type="url"
                  value={newResLink}
                  onChange={(e) => setNewResLink(e.target.value)}
                  placeholder="Đường dẫn (URL)..."
                  style={{
                    padding: "0.38rem 0.55rem",
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
                  placeholder="Ghi chú ngắn..."
                  style={{
                    padding: "0.38rem 0.55rem",
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
                      padding: "0.35rem 0.7rem",
                      fontSize: "0.8125rem",
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
    </div>
  );
}
