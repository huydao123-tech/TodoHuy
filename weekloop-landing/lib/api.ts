import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import { getMonday, formatWeekDateStr } from "./mockData";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("weekloop_token");
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("weekloop_token", token);
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("weekloop_token");
    localStorage.removeItem("weekloop_user");
  }
}

// Tự động lắng nghe và duy trì trạng thái đăng nhập (Session) trên client
if (typeof window !== "undefined") {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        setAuthToken(token);
        if (!localStorage.getItem("weekloop_user")) {
          localStorage.setItem(
            "weekloop_user",
            JSON.stringify({
              id: user.uid,
              fullName: user.displayName || user.email?.split("@")[0] || "User",
              email: user.email || "",
            })
          );
        }
      } catch {}
    }
  });
}

// Chờ Firebase Auth phục hồi trạng thái đăng nhập từ IndexedDB/LocalStorage
export function getCurrentUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Bắt buộc phải có user đăng nhập, nếu chưa thì chuyển hướng tới /login
export async function requireAuthUser(): Promise<FirebaseUser> {
  const user = await getCurrentUser();
  if (!user) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Người dùng chưa đăng nhập. Vui lòng đăng nhập lại!");
  }
  return user;
}

// Helper khởi tạo 3 nhóm mặc định cho user mới (giống Flutter AuthRepository)
async function seedDefaultTaskGroupsIfEmpty(uid: string) {
  const tgRef = collection(db, "users", uid, "task_groups");
  const snap = await getDocs(tgRef);
  if (snap.empty) {
    const defaults = [
      { name: "Tiếng Nhật", color: "#16A34A", displayOrder: 1, type: "MAIN", isArchived: false },
      { name: "Cờ vua (Chess)", color: "#7C3AED", displayOrder: 2, type: "MAIN", isArchived: false },
      { name: "Thể hình (Gym)", color: "#D97706", displayOrder: 3, type: "MAIN", isArchived: false },
    ];
    for (const g of defaults) {
      await addDoc(tgRef, {
        ...g,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

// ─── AUTH APIs (Dùng chung Firebase Auth với Flutter) ──────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCred.user.getIdToken();
    const uid = userCred.user.uid;

    const userDoc = await getDoc(doc(db, "users", uid));
    let fullName = userCred.user.displayName || email.split("@")[0];
    if (userDoc.exists()) {
      fullName = userDoc.data().fullName || fullName;
    } else {
      await setDoc(doc(db, "users", uid), {
        email,
        fullName,
        role: "USER",
        createdAt: serverTimestamp(),
      });
      await seedDefaultTaskGroupsIfEmpty(uid);
    }

    setAuthToken(token);
    return { token, id: uid, fullName, email: userCred.user.email || email };
  },

  register: async (fullName: string, email: string, password: string) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await updateProfile(userCred.user, { displayName: fullName });
    } catch {}

    const uid = userCred.user.uid;
    await setDoc(doc(db, "users", uid), {
      email,
      fullName,
      role: "USER",
      createdAt: serverTimestamp(),
    });

    await seedDefaultTaskGroupsIfEmpty(uid);

    const token = await userCred.user.getIdToken();
    setAuthToken(token);
    return { token, id: uid, fullName, email };
  },

  loginWithGoogle: async () => {
    const userCred = await signInWithPopup(auth, googleProvider);
    const uid = userCred.user.uid;
    const email = userCred.user.email || "";
    const fullName = userCred.user.displayName || email.split("@")[0] || "Người dùng";

    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", uid), {
        email,
        fullName,
        role: "USER",
        createdAt: serverTimestamp(),
      });
      await seedDefaultTaskGroupsIfEmpty(uid);
    }

    const token = await userCred.user.getIdToken();
    setAuthToken(token);
    return { token, id: uid, fullName, email };
  },

  getProfile: async () => {
    const user = await requireAuthUser();
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const fullName = userDoc.exists() ? userDoc.data().fullName : user.displayName || user.email?.split("@")[0] || "Người dùng";
    return { id: user.uid, fullName, email: user.email || "" };
  },

  logout: async () => {
    await signOut(auth);
    removeAuthToken();
  },

  sendPasswordResetEmail: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};

// ─── DASHBOARD APIs ────────────────────────────────────────────────────────
export interface DashboardData {
  currentWeekStart: string;
  prevWeekStart: string;
  nextWeekStart: string;
  taskGroups: {
    id: string;
    name: string;
    type: "MAIN" | "SIDE";
    color: string;
    displayOrder: number;
    isArchived: boolean;
  }[];
  weeklyGoals: {
    id: string;
    taskGroupId: string;
    weekStartDate: string;
    goalText: string;
  }[];
  workItems: {
    id: string;
    taskGroupId: string;
    weekStartDate: string;
    content: string;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    note: string;
  }[];
  sideTasks: {
    id: string;
    name: string;
    isDone: boolean;
  }[];
  sideTasksDoneCount: number;
  sideTasksTotalCount: number;
}

export const dashboardApi = {
  getDashboard: async (weekStart?: string): Promise<DashboardData> => {
    const user = await requireAuthUser();
    const uid = user.uid;

    // Đảm bảo user đã có task_groups mặc định
    await seedDefaultTaskGroupsIfEmpty(uid);

    // Tính mốc 3 tuần trượt
    const baseDate = weekStart ? new Date(weekStart) : new Date();
    const currentWeekMonday = getMonday(baseDate);
    const prevWeekMonday = new Date(currentWeekMonday);
    prevWeekMonday.setDate(prevWeekMonday.getDate() - 7);
    const nextWeekMonday = new Date(currentWeekMonday);
    nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);

    const currentWeekStart = formatWeekDateStr(currentWeekMonday);
    const prevWeekStart = formatWeekDateStr(prevWeekMonday);
    const nextWeekStart = formatWeekDateStr(nextWeekMonday);

    // 1. Task Groups
    const tgRef = collection(db, "users", uid, "task_groups");
    const tgSnap = await getDocs(tgRef);
    const taskGroups = tgSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: (data.name as string) || "",
          type: ((data.type as string) || "MAIN") as "MAIN" | "SIDE",
          color: (data.color as string) || "#16A34A",
          displayOrder: (data.displayOrder as number) || 0,
          isArchived: (data.isArchived as boolean) || false,
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // 2. Weekly Goals
    const wgRef = collection(db, "users", uid, "weekly_goals");
    const wgSnap = await getDocs(wgRef);
    const weeklyGoals = wgSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        taskGroupId: (data.taskGroupId as string) || "",
        weekStartDate: (data.weekStartDate as string) || "",
        goalText: (data.goalText as string) || "",
      };
    });

    // 3. Work Items
    const wiRef = collection(db, "users", uid, "work_items");
    const wiSnap = await getDocs(wiRef);
    const workItems = wiSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        taskGroupId: (data.taskGroupId as string) || "",
        weekStartDate: (data.weekStartDate as string) || "",
        content: (data.content as string) || "",
        status: ((data.status as string) || "TODO") as "TODO" | "IN_PROGRESS" | "DONE",
        note: (data.note as string) || "",
      };
    });

    // 4. Side Tasks (chỉ lấy những việc chưa hoàn thành, dọn dẹp các việc đã tick xong)
    const stRef = collection(db, "users", uid, "side_tasks");
    const stSnap = await getDocs(stRef);
    const sideTasks: { id: string; name: string; isDone: boolean }[] = [];
    stSnap.docs.forEach((d) => {
      const data = d.data();
      const isDone = (data.isDone as boolean) || false;
      if (!isDone) {
        sideTasks.push({
          id: d.id,
          name: (data.name as string) || "",
          isDone: false,
        });
      } else {
        // Tự động xóa hẳn các việc phụ đã tick hoàn thành trước đó khỏi DB
        deleteDoc(doc(db, "users", uid, "side_tasks", d.id)).catch(() => {});
      }
    });

    const sideTasksDoneCount = 0;
    const sideTasksTotalCount = sideTasks.length;

    return {
      currentWeekStart,
      prevWeekStart,
      nextWeekStart,
      taskGroups,
      weeklyGoals,
      workItems,
      sideTasks,
      sideTasksDoneCount,
      sideTasksTotalCount,
    };
  },
};

// ─── TASK GROUP APIs ───────────────────────────────────────────────────────
export interface TaskGroupData {
  id: string;
  name: string;
  type: string;
  color: string;
  displayOrder: number;
  isArchived: boolean;
  archivedAt?: string | null;
}

export const taskGroupApi = {
  getAll: async (type?: "MAIN" | "SIDE"): Promise<TaskGroupData[]> => {
    const user = await requireAuthUser();
    const tgRef = collection(db, "users", user.uid, "task_groups");
    const snap = await getDocs(tgRef);
    let items: TaskGroupData[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || "",
        type: data.type || "MAIN",
        color: data.color || "#16A34A",
        displayOrder: data.displayOrder || 0,
        isArchived: data.isArchived || false,
      };
    }).filter((g) => !g.isArchived);

    if (type) items = items.filter((g) => g.type === type);
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  create: async (name: string, type: "MAIN" | "SIDE" = "MAIN", displayOrder: number = 0, color: string = "#16A34A") => {
    const user = await requireAuthUser();
    const tgRef = collection(db, "users", user.uid, "task_groups");
    const docRef = await addDoc(tgRef, {
      name,
      type,
      color,
      displayOrder,
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, name, type, color, displayOrder, isArchived: false };
  },

  update: async (id: string | number, name: string) => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "task_groups", String(id));
    await updateDoc(docRef, {
      name,
      updatedAt: serverTimestamp(),
    });
  },

  delete: async (id: string | number) => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "task_groups", String(id));
    await updateDoc(docRef, {
      isArchived: true,
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  getTrash: async (): Promise<TaskGroupData[]> => {
    const user = await requireAuthUser();
    const tgRef = collection(db, "users", user.uid, "task_groups");
    const snap = await getDocs(tgRef);
    return snap.docs
      .map((d) => {
        const data = d.data();
        const archAt = data.archivedAt as Timestamp | undefined;
        return {
          id: d.id,
          name: data.name || "",
          type: data.type || "MAIN",
          color: data.color || "#16A34A",
          displayOrder: data.displayOrder || 0,
          isArchived: data.isArchived || false,
          archivedAt: archAt ? archAt.toDate().toISOString() : null,
        };
      })
      .filter((g) => g.isArchived);
  },

  restore: async (id: string | number): Promise<TaskGroupData> => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "task_groups", String(id));
    await updateDoc(docRef, {
      isArchived: false,
      archivedAt: null,
      updatedAt: serverTimestamp(),
    });
    const snap = await getDoc(docRef);
    const data = snap.data() || {};
    return {
      id: String(id),
      name: data.name || "",
      type: data.type || "MAIN",
      color: data.color || "#16A34A",
      displayOrder: data.displayOrder || 0,
      isArchived: false,
    };
  },

  permanentDelete: async (id: string | number) => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "task_groups", String(id));
    await deleteDoc(docRef);
  },
};

// ─── NOTE APIs ─────────────────────────────────────────────────────────────
export interface NoteData {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: string;
}

export const noteApi = {
  getAll: async (): Promise<NoteData[]> => {
    const user = await requireAuthUser();
    const nRef = collection(db, "users", user.uid, "notes");
    const snap = await getDocs(nRef);
    return snap.docs.map((d) => {
      const data = d.data();
      const updated = data.updatedAt as Timestamp | undefined;
      return {
        id: d.id,
        title: data.title || "",
        content: data.content || "",
        color: data.color || "stone:Ý tưởng:📝",
        updatedAt: updated ? updated.toDate().toISOString() : new Date().toISOString(),
      };
    });
  },

  create: async (title: string, content = "", color = "stone:Ý tưởng:📝"): Promise<NoteData> => {
    const user = await requireAuthUser();
    const nRef = collection(db, "users", user.uid, "notes");
    const docRef = await addDoc(nRef, {
      title,
      content,
      color,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: docRef.id,
      title,
      content,
      color,
      updatedAt: new Date().toISOString(),
    };
  },

  update: async (id: string | number, data: Partial<Pick<NoteData, "title" | "content" | "color">>): Promise<NoteData> => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "notes", String(id));
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    const snap = await getDoc(docRef);
    const d = snap.data() || {};
    const updated = d.updatedAt as Timestamp | undefined;
    return {
      id: String(id),
      title: d.title || "",
      content: d.content || "",
      color: d.color || "stone:Ý tưởng:📝",
      updatedAt: updated ? updated.toDate().toISOString() : new Date().toISOString(),
    };
  },

  delete: async (id: string | number) => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "notes", String(id));
    await deleteDoc(docRef);
  },
};

// ─── RESOURCE APIs ─────────────────────────────────────────────────────────
export interface ResourceApiData {
  id: string;
  taskGroupId: string | null;
  title: string;
  link: string;
  description: string;
}

export const resourceApi = {
  getAll: async (groupId?: string | number): Promise<ResourceApiData[]> => {
    const user = await requireAuthUser();
    const rRef = collection(db, "users", user.uid, "resources");
    const snap = await getDocs(rRef);
    let items = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        taskGroupId: data.taskGroupId ? String(data.taskGroupId) : null,
        title: data.title || "",
        link: data.link || "",
        description: data.description || "",
      };
    });
    if (groupId) {
      items = items.filter((r) => r.taskGroupId === String(groupId));
    }
    return items;
  },

  create: async (title: string, link = "", description = "", taskGroupId?: string | number | null): Promise<ResourceApiData> => {
    const user = await requireAuthUser();
    const rRef = collection(db, "users", user.uid, "resources");
    const docRef = await addDoc(rRef, {
      title,
      link,
      description,
      taskGroupId: taskGroupId ? String(taskGroupId) : null,
      createdAt: serverTimestamp(),
    });
    return {
      id: docRef.id,
      taskGroupId: taskGroupId ? String(taskGroupId) : null,
      title,
      link,
      description,
    };
  },

  delete: async (id: string | number) => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "resources", String(id));
    await deleteDoc(docRef);
  },
};

// ─── WEEKLY GOAL APIs (Upsert tương tự Flutter) ────────────────────────────
export const weeklyGoalApi = {
  update: async (taskGroupId: string | number, weekStart: string, goalText: string) => {
    const user = await requireAuthUser();
    const wgRef = collection(db, "users", user.uid, "weekly_goals");
    const q = query(
      wgRef,
      where("taskGroupId", "==", String(taskGroupId)),
      where("weekStartDate", "==", weekStart)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, "users", user.uid, "weekly_goals", snap.docs[0].id), {
        goalText,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(wgRef, {
        taskGroupId: String(taskGroupId),
        weekStartDate: weekStart,
        goalText,
        updatedAt: serverTimestamp(),
      });
    }
  },
};

// ─── WORK ITEM APIs ────────────────────────────────────────────────────────
export interface WorkItemApiData {
  id: string;
  taskGroupId: string;
  weekStartDate: string;
  content: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  note: string;
}

export const workItemApi = {
  create: async (
    taskGroupId: string | number,
    weekStartDate: string,
    content: string,
    note = ""
  ): Promise<WorkItemApiData> => {
    const user = await requireAuthUser();
    const wiRef = collection(db, "users", user.uid, "work_items");
    const docRef = await addDoc(wiRef, {
      taskGroupId: String(taskGroupId),
      weekStartDate,
      content,
      status: "TODO",
      note: note || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: docRef.id,
      taskGroupId: String(taskGroupId),
      weekStartDate,
      content,
      status: "TODO",
      note: note || "",
    };
  },

  update: async (
    id: string | number,
    data: { content?: string; status?: "TODO" | "IN_PROGRESS" | "DONE"; note?: string }
  ) => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "work_items", String(id));
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  delete: async (id: string | number) => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "work_items", String(id));
    await deleteDoc(docRef);
  },
};

// ─── SIDE TASK APIs ────────────────────────────────────────────────────────
export interface SideTaskApiData {
  id: string;
  name: string;
  isDone: boolean;
}

export const sideTaskApi = {
  getAll: async (): Promise<SideTaskApiData[]> => {
    const user = await requireAuthUser();
    const stRef = collection(db, "users", user.uid, "side_tasks");
    const snap = await getDocs(stRef);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: (data.name as string) || "",
          isDone: (data.isDone as boolean) || false,
        };
      })
      .filter((t) => !t.isDone);
  },

  create: async (name: string): Promise<SideTaskApiData> => {
    const user = await requireAuthUser();
    const stRef = collection(db, "users", user.uid, "side_tasks");
    const docRef = await addDoc(stRef, {
      name,
      isDone: false,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, name, isDone: false };
  },

  completeAndRemove: async (id: string | number) => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "side_tasks", String(id));
    await deleteDoc(docRef);
  },

  delete: async (id: string | number) => {
    const user = await requireAuthUser();
    const docRef = doc(db, "users", user.uid, "side_tasks", String(id));
    await deleteDoc(docRef);
  },
};
