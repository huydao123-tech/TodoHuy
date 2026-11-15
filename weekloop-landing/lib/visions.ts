/**
 * Tầm nhìn sở hữu danh sách nhóm việc (quan hệ 1-n).
 * Một nhóm việc nằm trong tối đa một tầm nhìn. Không lưu visionId trên nhóm việc.
 */
export type VisionStatus = "active" | "paused" | "achieved";

export interface VisionRecord {
  id: string;
  title: string;
  outcome: string;
  horizon: string;
  status: VisionStatus;
  displayOrder: number;
  taskGroupIds: string[];
}

export interface VisionDraft {
  title: string;
  outcome: string;
  horizon: string;
}

const TITLE_MAX = 80;
const OUTCOME_MAX = 180;
const HORIZON_MAX = 40;

const STATUS_RANK: Record<VisionStatus, number> = {
  active: 0,
  paused: 1,
  achieved: 2,
};

export function normalizeVisionStatus(value: unknown): VisionStatus {
  if (value === "paused" || value === "achieved" || value === "active") return value;
  return "active";
}

export function normalizeTaskGroupIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of value) {
    const id = String(item ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function parseVisionDraft(input: {
  title: string;
  outcome?: string;
  horizon?: string;
}): { ok: true; draft: VisionDraft } | { ok: false; error: "title" } {
  const title = input.title.trim().slice(0, TITLE_MAX);
  if (!title) return { ok: false, error: "title" };
  return {
    ok: true,
    draft: {
      title,
      outcome: (input.outcome ?? "").trim().slice(0, OUTCOME_MAX),
      horizon: (input.horizon ?? "").trim().slice(0, HORIZON_MAX),
    },
  };
}

export function sortVisions<T extends { status: VisionStatus; displayOrder: number; id: string }>(
  visions: T[],
): T[] {
  return [...visions].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      a.displayOrder - b.displayOrder ||
      a.id.localeCompare(b.id),
  );
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/** Nếu một nhóm lỡ nằm ở nhiều tầm nhìn, tầm nhìn đang theo đuổi và tạo sớm hơn được giữ. */
export function exclusiveVisions<T extends VisionRecord>(visions: T[]): T[] {
  const claimOrder = [...visions].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      a.displayOrder - b.displayOrder ||
      a.id.localeCompare(b.id),
  );
  const seen = new Set<string>();
  const kept = new Map<string, string[]>();
  for (const vision of claimOrder) {
    const ids: string[] = [];
    for (const id of vision.taskGroupIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    kept.set(vision.id, ids);
  }
  return visions.map((vision) => {
    const taskGroupIds = kept.get(vision.id) ?? [];
    if (sameIds(taskGroupIds, vision.taskGroupIds)) return vision;
    return { ...vision, taskGroupIds };
  });
}

export function attachGroupToVision<T extends { id: string; taskGroupIds: string[] }>(
  visions: T[],
  visionId: string,
  groupId: string,
): { next: T[]; changedIds: string[]; movedFromId: string | null } {
  const gid = String(groupId).trim();
  const target = visions.find((vision) => vision.id === visionId);
  if (!target || !gid) return { next: visions, changedIds: [], movedFromId: null };

  const owners = visions.filter((vision) => vision.taskGroupIds.includes(gid));
  if (owners.length === 1 && owners[0].id === visionId) {
    return { next: visions, changedIds: [], movedFromId: null };
  }

  const movedFromId = owners.find((vision) => vision.id !== visionId)?.id ?? null;
  const changedIds: string[] = [];
  const next = visions.map((vision) => {
    const without = vision.taskGroupIds.filter((id) => id !== gid);
    if (vision.id === visionId) {
      const taskGroupIds = [...without, gid];
      if (sameIds(taskGroupIds, vision.taskGroupIds)) return vision;
      changedIds.push(vision.id);
      return { ...vision, taskGroupIds };
    }
    if (without.length === vision.taskGroupIds.length) return vision;
    changedIds.push(vision.id);
    return { ...vision, taskGroupIds: without };
  });
  return { next, changedIds, movedFromId };
}

export function detachGroupFromVision<T extends { id: string; taskGroupIds: string[] }>(
  visions: T[],
  visionId: string,
  groupId: string,
): { next: T[]; changedIds: string[] } {
  const gid = String(groupId);
  const changedIds: string[] = [];
  const next = visions.map((vision) => {
    if (vision.id !== visionId || !vision.taskGroupIds.includes(gid)) return vision;
    changedIds.push(vision.id);
    return { ...vision, taskGroupIds: vision.taskGroupIds.filter((id) => id !== gid) };
  });
  return { next: changedIds.length ? next : visions, changedIds };
}

export function stripGroupFromVisions<T extends { id: string; taskGroupIds: string[] }>(
  visions: T[],
  groupId: string,
): { next: T[]; changedIds: string[] } {
  const gid = String(groupId);
  const changedIds: string[] = [];
  const next = visions.map((vision) => {
    if (!vision.taskGroupIds.includes(gid)) return vision;
    changedIds.push(vision.id);
    return { ...vision, taskGroupIds: vision.taskGroupIds.filter((id) => id !== gid) };
  });
  return { next: changedIds.length ? next : visions, changedIds };
}

export function groupsInVision<G extends { id: string | number; displayOrder?: number }>(
  vision: { taskGroupIds: string[] },
  groups: G[],
): G[] {
  const owned = new Set(vision.taskGroupIds);
  return groups.filter((group) => owned.has(String(group.id))).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export function unassignedGroups<G extends { id: string | number }>(
  visions: { taskGroupIds: string[] }[],
  groups: G[],
): G[] {
  const owned = new Set(visions.flatMap((vision) => vision.taskGroupIds));
  return groups.filter((group) => !owned.has(String(group.id)));
}

export function visionOwningGroup<T extends { id: string; title: string; taskGroupIds: string[] }>(
  visions: T[],
  groupId: string | number,
): T | null {
  const gid = String(groupId);
  return visions.find((vision) => vision.taskGroupIds.includes(gid)) ?? null;
}

export function weekProgress(
  groupIds: string[],
  workItemsMap: Record<string, { status: string }[] | undefined>,
  weekOffset = 0,
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const id of groupIds) {
    const items = workItemsMap[`${id}:${weekOffset}`] ?? [];
    total += items.length;
    done += items.filter((item) => item.status === "DONE").length;
  }
  return { done, total };
}
