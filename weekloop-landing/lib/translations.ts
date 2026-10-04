export type AppLanguage = "vi" | "en";

export interface Translations {
  appName: string;
  tagline: string;
  cancel: string;
  save: string;
  create: string;
  delete: string;
  edit: string;
  restore: string;
  undo: string;
  orDivider: string;
  loading: string;
  error: string;
  retry: string;
  language: string;
  vietnamese: string;
  english: string;
  user: string;

  // Auth
  login: string;
  signUp: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  forgotPasswordTitle: string;
  resetPassword: string;
  resetPasswordInstruction: string;
  sendResetLink: string;
  checkYourEmail: string;
  resetConfirmationDesc: string;
  backToLogin: string;
  continueWithGoogle: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  loginSub: string;
  registerSub: string;
  verifyingSession: string;
  loginSuccess: string;
  registerSuccess: string;

  // Navigation & Shell
  planner: string;
  notes: string;
  sideTasks: string;
  prevWeek: string;
  nextWeek: string;
  today: string;
  settings: string;
  trash: string;
  logout: string;
  logoutConfirm: string;
  checkForUpdates: string;
  checkingForUpdates: string;

  // Sidebar
  categoriesSection: string;
  utilitiesSection: string;
  resourcesAndLinks: string;
  createCategory: string;
  createCategoryModalTitle: string;
  categoryName: string;
  categoryColor: string;
  categoryNamePlaceholder: string;
  emptyCategories: string;
  emptyCategoriesSub: string;
  renameTooltip: string;
  archiveTooltip: string;

  // Planner & WeekGrid
  currentWeekBadge: string;
  pastWeekBadge: string;
  upcomingWeekBadge: string;
  readOnlyNotice: string;
  goalBoxTitle: string;
  goalPlaceholder: string;
  addWorkItem: string;
  removeGroupFromWeek: string;
  todoStatus: string;
  inProgressStatus: string;
  doneStatus: string;
  taskCount: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;

  // Side Panel
  sideTasksTitle: string;
  sideTaskInputHint: string;
  noSideTasksEmpty: string;
  noSideTasksSub: string;
  taskCompletedDeleted: string;
  taskDeletedToast: string;

  // Task Detail Modal
  taskDetailTitle: string;
  moveToCurrentWeek: string;
  theme: string;
  darkMode: string;
  lightMode: string;
  taskContentLabel: string;
  taskNoteLabel: string;
  taskStatusLabel: string;
  taskNotePlaceholder: string;
  deleteTask: string;
  deleteConfirm: string;

  // Notes Gallery
  searchNotesHint: string;
  noNotesEmpty: string;
  newNote: string;
  editNote: string;
  noteTitle: string;
  noteContentHint: string;
  category: string;

  // Resources Modal
  resourcesSheetTitle: string;
  noResourcesYet: string;
  addResource: string;
  resourceTitle: string;
  resourceUrl: string;
  resourceDescOptional: string;
  belongsToCategoryOptional: string;
  generalResource: string;

  // Trash Modal
  trashSheetTitle: string;
  trashRetentionNotice: string;
  trashEmpty: string;
  trashEmptyDesc: string;
  restoreBtn: string;
  permanentDeleteBtn: string;
  confirmPermDeleteTitle: string;
  confirmPermDeleteDesc: string;
}

export const translations: Record<AppLanguage, Translations> = {
  vi: {
    appName: "WeekLoop",
    tagline: "Kế hoạch tuần & Quản lý công việc",
    cancel: "Hủy",
    save: "Lưu",
    create: "Tạo mới",
    delete: "Xóa",
    edit: "Sửa",
    restore: "Khôi phục",
    undo: "Hoàn tác",
    orDivider: "HOẶC",
    loading: "Đang tải...",
    error: "Lỗi",
    retry: "Thử lại",
    language: "Ngôn ngữ",
    vietnamese: "Tiếng Việt",
    english: "Tiếng Anh",
    user: "Người dùng",

    // Auth
    login: "Đăng nhập",
    signUp: "Đăng ký",
    fullName: "Họ và tên",
    email: "Địa chỉ Email",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận lại mật khẩu",
    forgotPassword: "Quên mật khẩu?",
    forgotPasswordTitle: "Quên mật khẩu",
    resetPassword: "Đặt lại mật khẩu",
    resetPasswordInstruction:
      "Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.",
    sendResetLink: "Gửi link đặt lại",
    checkYourEmail: "Kiểm tra email của bạn",
    resetConfirmationDesc:
      "Nếu tài khoản tồn tại với địa chỉ này, bạn sẽ nhận được email trong vài phút. Hãy kiểm tra cả thư mục Spam.",
    backToLogin: "Quay lại Đăng nhập",
    continueWithGoogle: "Tiếp tục với Google",
    alreadyHaveAccount: "Đã có tài khoản? Đăng nhập",
    dontHaveAccount: "Chưa có tài khoản? Đăng ký ngay",
    loginSub: "Tiếp tục quản lý mục tiêu và công việc của bạn.",
    registerSub: "Tạo tài khoản mới để bắt đầu lên kế hoạch tuần.",
    verifyingSession: "Đang kiểm tra phiên đăng nhập...",
    loginSuccess: "Đăng nhập thành công!",
    registerSuccess: "Tạo tài khoản thành công!",

    // Navigation & Shell
    planner: "Kế hoạch (Planner)",
    notes: "Ghi chú",
    sideTasks: "Việc phụ",
    prevWeek: "Tuần trước",
    nextWeek: "Tuần sau",
    today: "Hôm nay",
    settings: "Cài đặt",
    trash: "Thùng rác",
    logout: "Đăng xuất",
    logoutConfirm: "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
    checkForUpdates: "Kiểm tra bản cập nhật",
    checkingForUpdates: "Đang kiểm tra bản cập nhật...",

    // Sidebar
    categoriesSection: "DANH MỤC",
    utilitiesSection: "TIỆN ÍCH",
    resourcesAndLinks: "Tài liệu & Link",
    createCategory: "Thêm đầu việc",
    createCategoryModalTitle: "Thêm đầu việc mới",
    categoryName: "Tên đầu việc",
    categoryColor: "Màu nhận diện",
    categoryNamePlaceholder: "Ví dụ: Học tiếng Nhật, Thể hình (Gym)...",
    emptyCategories: "Chưa có đầu việc nào",
    emptyCategoriesSub: "Nhấn vào dấu + bên trên để thêm đầu việc đầu tiên của bạn!",
    renameTooltip: "Sửa tên",
    archiveTooltip: "Lưu trữ vào thùng rác",

    // Planner & WeekGrid
    currentWeekBadge: "Tuần này",
    pastWeekBadge: "Tuần cũ",
    upcomingWeekBadge: "Tuần sau",
    readOnlyNotice: "Tuần cũ chỉ xem — Không thể chỉnh sửa dữ liệu lịch sử",
    goalBoxTitle: "Mục tiêu trọng tâm",
    goalPlaceholder: "Nhập mục tiêu trọng tâm trong tuần...",
    addWorkItem: "Thêm công việc...",
    removeGroupFromWeek: "Bỏ nhóm khỏi tuần này",
    todoStatus: "Chưa làm",
    inProgressStatus: "Đang làm",
    doneStatus: "Đã xong",
    taskCount: "việc",
    mon: "T2",
    tue: "T3",
    wed: "T4",
    thu: "T5",
    fri: "T6",
    sat: "T7",
    sun: "CN",

    // Side Panel
    sideTasksTitle: "Đầu việc phụ",
    sideTaskInputHint: "Thêm việc phụ mới... (Enter)",
    noSideTasksEmpty: "Tuyệt vời! Không còn việc phụ nào.",
    noSideTasksSub: "Nhập việc cần làm vào ô bên dưới để ghi nhanh.",
    taskCompletedDeleted: 'Đã hoàn thành và xóa "{name}"',
    taskDeletedToast: 'Đã xóa "{name}"',

    // Task Detail Modal
    taskDetailTitle: "Chi tiết công việc",
    moveToCurrentWeek: "Dời sang tuần này",
    theme: "Giao diện",
    darkMode: "Giao diện tối",
    lightMode: "Giao diện sáng",
    taskContentLabel: "Nội dung việc",
    taskNoteLabel: "Ghi chú & Chi tiết",
    taskStatusLabel: "Trạng thái",
    taskNotePlaceholder: "Thêm ghi chú, checklist, tài liệu liên quan...",
    deleteTask: "Xóa công việc",
    deleteConfirm: "Bạn có chắc muốn xóa công việc này?",

    // Notes Gallery
    searchNotesHint: "Tìm kiếm ghi chú...",
    noNotesEmpty: "Chưa có ghi chú nào.\nNhấn + để tạo ghi chú đầu tiên.",
    newNote: "Ghi chú mới",
    editNote: "Chỉnh sửa ghi chú",
    noteTitle: "Tiêu đề",
    noteContentHint: "Nội dung ghi chú...",
    category: "Danh mục",

    // Resources Modal
    resourcesSheetTitle: "Tài liệu & Link hữu ích",
    noResourcesYet: "Chưa có tài liệu nào.",
    addResource: "Thêm tài liệu",
    resourceTitle: "Tiêu đề tài liệu",
    resourceUrl: "Đường dẫn (URL)",
    resourceDescOptional: "Mô tả ngắn (tùy chọn)",
    belongsToCategoryOptional: "Thuộc danh mục (tùy chọn)",
    generalResource: "Tài liệu chung (Không thuộc danh mục nào)",

    // Trash Modal
    trashSheetTitle: "Thùng rác danh mục",
    trashRetentionNotice:
      "Các danh mục trong thùng rác sẽ được lưu trữ an toàn. Bạn có thể khôi phục lại bất kỳ lúc nào hoặc xóa vĩnh viễn.",
    trashEmpty: "Thùng rác trống",
    trashEmptyDesc: "Các danh mục đã xóa sẽ xuất hiện tại đây.",
    restoreBtn: "Khôi phục",
    permanentDeleteBtn: "Xóa vĩnh viễn",
    confirmPermDeleteTitle: "Xác nhận xóa vĩnh viễn",
    confirmPermDeleteDesc:
      "Hành động này không thể hoàn tác. Mọi mục tiêu và công việc con thuộc nhóm này sẽ bị xóa khỏi hệ thống.",
  },
  en: {
    appName: "WeekLoop",
    tagline: "Weekly Planning & Task Management",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    delete: "Delete",
    edit: "Edit",
    restore: "Restore",
    undo: "Undo",
    orDivider: "OR",
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    language: "Language",
    vietnamese: "Vietnamese",
    english: "English",
    user: "User",

    // Auth
    login: "Log In",
    signUp: "Sign Up",
    fullName: "Full name",
    email: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
    forgotPassword: "Forgot password?",
    forgotPasswordTitle: "Forgot Password",
    resetPassword: "Reset Password",
    resetPasswordInstruction:
      "Enter your email and we will send a password reset link.",
    sendResetLink: "Send reset link",
    checkYourEmail: "Check your email",
    resetConfirmationDesc:
      "If an account exists with this email, you will receive an email shortly. Please also check your Spam folder.",
    backToLogin: "Back to Login",
    continueWithGoogle: "Continue with Google",
    alreadyHaveAccount: "Already have an account? Log in",
    dontHaveAccount: "Don't have an account? Sign up",
    loginSub: "Continue managing your goals and tasks.",
    registerSub: "Create a new account to start weekly planning.",
    verifyingSession: "Verifying session...",
    loginSuccess: "Signed in successfully!",
    registerSuccess: "Account created successfully!",

    // Navigation & Shell
    planner: "Planner",
    notes: "Notes",
    sideTasks: "Side Tasks",
    prevWeek: "Previous week",
    nextWeek: "Next week",
    today: "Today",
    settings: "Settings",
    trash: "Trash",
    logout: "Log out",
    logoutConfirm: "Are you sure you want to log out?",
    checkForUpdates: "Check for Updates",
    checkingForUpdates: "Checking for updates...",

    // Sidebar
    categoriesSection: "CATEGORIES",
    utilitiesSection: "UTILITIES",
    resourcesAndLinks: "Resources & Links",
    createCategory: "Add category",
    createCategoryModalTitle: "Add New Category",
    categoryName: "Category name",
    categoryColor: "Color tag",
    categoryNamePlaceholder: "e.g. Japanese Study, Gym Workout...",
    emptyCategories: "No categories yet",
    emptyCategoriesSub: "Click the + button above to create your first category!",
    renameTooltip: "Rename",
    archiveTooltip: "Move to trash",

    // Planner & WeekGrid
    currentWeekBadge: "This week",
    pastWeekBadge: "Past week",
    upcomingWeekBadge: "Next week",
    readOnlyNotice: "Past week read-only — Historical data cannot be edited",
    goalBoxTitle: "Core Goal",
    goalPlaceholder: "Enter core goal for this week...",
    addWorkItem: "Add task...",
    removeGroupFromWeek: "Remove category from this week",
    todoStatus: "To Do",
    inProgressStatus: "In Progress",
    doneStatus: "Done",
    taskCount: "tasks",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",

    // Side Panel
    sideTasksTitle: "Side Tasks",
    sideTaskInputHint: "Add a side task... (Enter)",
    noSideTasksEmpty: "All caught up! No side tasks.",
    noSideTasksSub: "Enter a task in the field below for quick capture.",
    taskCompletedDeleted: 'Completed & deleted "{name}"',
    taskDeletedToast: 'Deleted "{name}"',

    // Task Detail Modal
    taskDetailTitle: "Task Details",
    moveToCurrentWeek: "Move to this week",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    taskContentLabel: "Task content",
    taskNoteLabel: "Notes & Details",
    taskStatusLabel: "Status",
    taskNotePlaceholder: "Add notes, checklist, related links...",
    deleteTask: "Delete task",
    deleteConfirm: "Are you sure you want to delete this task?",

    // Notes Gallery
    searchNotesHint: "Search notes...",
    noNotesEmpty: "No notes yet.\nTap + to create your first note.",
    newNote: "New Note",
    editNote: "Edit Note",
    noteTitle: "Title",
    noteContentHint: "Note content...",
    category: "Category",

    // Resources Modal
    resourcesSheetTitle: "Useful Resources & Links",
    noResourcesYet: "No resources yet.",
    addResource: "Add Resource",
    resourceTitle: "Resource title",
    resourceUrl: "URL Link",
    resourceDescOptional: "Short description (optional)",
    belongsToCategoryOptional: "Category (optional)",
    generalResource: "General resource (No category)",

    // Trash Modal
    trashSheetTitle: "Archived Categories",
    trashRetentionNotice:
      "Categories in the trash are safely stored. You can restore them anytime or permanently delete them.",
    trashEmpty: "Trash is empty",
    trashEmptyDesc: "Deleted categories will appear here.",
    restoreBtn: "Restore",
    permanentDeleteBtn: "Delete permanently",
    confirmPermDeleteTitle: "Confirm permanent deletion",
    confirmPermDeleteDesc:
      "This action cannot be undone. All goals and tasks belonging to this category will be permanently erased.",
  },
};
