"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

const STORAGE_KEY = "toeicState";
const DAY_MS = 24 * 60 * 60 * 1000;

type ViewId = "dashboard" | "schedule" | "analysis" | "memos" | "settings";
type NoticeKind = "info" | "success" | "warning" | "error";
type Difficulty = "基礎" | "標準" | "高難度";
type IconName =
  | "dashboard"
  | "calendar"
  | "chart"
  | "note"
  | "settings"
  | "target"
  | "clock"
  | "book"
  | "headphones"
  | "grammar"
  | "trash"
  | "plus"
  | "check"
  | "spark"
  | "play"
  | "download";

type Task = {
  id: string;
  title: string;
  category: string;
  detail: string;
  durationMinutes: number;
  timeSlot: string;
  difficulty: Difficulty;
  completed: boolean;
};

type Memo = {
  id: string;
  title: string;
  content: string;
  tag: string;
};

type PlannerSettings = {
  currentScore: number;
  targetScore: number;
  examDate: string;
  dailyStudyMinutes: number;
};

type PlannerState = {
  tasks: Task[];
  memos: Memo[];
  settings: PlannerSettings;
  studyStreak: number;
};

type Notice = {
  kind: NoticeKind;
  text: string;
};

type TaskDraft = {
  title: string;
  category: string;
  detail: string;
  durationMinutes: number;
};

type MemoDraft = {
  title: string;
  tag: string;
  content: string;
};

const views: Array<{ id: ViewId; label: string; icon: IconName }> = [
  { id: "dashboard", label: "ダッシュボード", icon: "dashboard" },
  { id: "schedule", label: "スケジュール", icon: "calendar" },
  { id: "analysis", label: "分析", icon: "chart" },
  { id: "memos", label: "メモ", icon: "note" },
  { id: "settings", label: "設定", icon: "settings" },
];

const emptyTaskDraft: TaskDraft = {
  title: "",
  category: "語彙",
  detail: "",
  durationMinutes: 30,
};

const emptyMemoDraft: MemoDraft = {
  title: "",
  tag: "文法",
  content: "",
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function daysUntil(examDate: string) {
  const diff = parseIsoDate(examDate).getTime() - startOfToday().getTime();
  return Math.ceil(diff / DAY_MS);
}

function formatDate(value: string) {
  const date = parseIsoDate(value);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getDefaultState(): PlannerState {
  const examDate = toIsoDate(new Date(Date.now() + 90 * DAY_MS));

  return {
    settings: {
      currentScore: 500,
      targetScore: 800,
      examDate,
      dailyStudyMinutes: 60,
    },
    studyStreak: 12,
    tasks: [
      {
        id: "default-vocabulary",
        title: "金のフレーズ 1-100",
        category: "語彙",
        detail: "頻出単語を音声とセットで確認し、例文まで声に出す。",
        durationMinutes: 15,
        timeSlot: "07:00 - 07:15",
        difficulty: "基礎",
        completed: false,
      },
      {
        id: "default-listening",
        title: "公式問題集 Part 3",
        category: "リスニング",
        detail: "3問単位で先読み、解答、スクリプト確認、シャドーイング。",
        durationMinutes: 20,
        timeSlot: "20:00 - 20:20",
        difficulty: "標準",
        completed: true,
      },
      {
        id: "default-grammar",
        title: "文法特急 第1章",
        category: "文法",
        detail: "品詞問題と時制問題を中心に、間違えた根拠をメモに残す。",
        durationMinutes: 30,
        timeSlot: "20:35 - 21:05",
        difficulty: "標準",
        completed: false,
      },
    ],
    memos: [
      {
        id: "memo-grammar",
        title: "Part 5 引っ掛け",
        content: "despite は前置詞、although は接続詞。後ろに続く形を先に見る。",
        tag: "文法",
      },
      {
        id: "memo-vocabulary",
        title: "頻出単語",
        content: "implement: 実行する\ncomplement: 補完する\ncompliment: 褒める",
        tag: "語彙",
      },
      {
        id: "memo-listening",
        title: "Part 3 先読み",
        content: "設問の主語と動詞だけを素早くマークする。選択肢は名詞句を優先。",
        tag: "リスニング",
      },
    ],
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseCategory(meta: string) {
  if (meta.includes("リスニング")) return "リスニング";
  if (meta.includes("リーディング")) return "リーディング";
  if (meta.includes("文法")) return "文法";
  if (meta.includes("語彙")) return "語彙";
  return "その他";
}

function parseDuration(meta: string, fallback: number) {
  const match = meta.match(/(\d+)\s*分/);
  return match ? Number(match[1]) : fallback;
}

function normalizeTask(item: unknown, index: number): Task | null {
  const record = asRecord(item);
  if (!record) return null;

  const title = asString(record.title).trim();
  if (!title) return null;

  const meta = asString(record.meta);
  const category = asString(record.category, parseCategory(meta));
  const difficulty = asString(record.difficulty, "標準") as Difficulty;

  return {
    id: String(record.id ?? `task-${index}-${uid()}`),
    title,
    category,
    detail: asString(record.detail, meta || "今日の重点タスクとして取り組みます。"),
    durationMinutes: clamp(asNumber(record.durationMinutes, parseDuration(meta, 30)), 5, 480),
    timeSlot: asString(record.timeSlot, "時間未定"),
    difficulty: ["基礎", "標準", "高難度"].includes(difficulty) ? difficulty : "標準",
    completed: Boolean(record.completed),
  };
}

function normalizeMemo(item: unknown, index: number): Memo | null {
  const record = asRecord(item);
  if (!record) return null;

  const title = asString(record.title).trim();
  const content = asString(record.content).trim();
  if (!title || !content) return null;

  return {
    id: String(record.id ?? `memo-${index}-${uid()}`),
    title,
    content,
    tag: asString(record.tag, "一般"),
  };
}

function normalizeState(raw: unknown): PlannerState {
  const fallback = getDefaultState();
  const record = asRecord(raw);
  if (!record) return fallback;

  const savedSettings = asRecord(record.settings);
  const settings: PlannerSettings = {
    currentScore: clamp(asNumber(savedSettings?.currentScore, fallback.settings.currentScore), 10, 990),
    targetScore: clamp(asNumber(savedSettings?.targetScore, fallback.settings.targetScore), 10, 990),
    examDate: asString(savedSettings?.examDate, fallback.settings.examDate),
    dailyStudyMinutes: clamp(
      asNumber(savedSettings?.dailyStudyMinutes, fallback.settings.dailyStudyMinutes),
      15,
      240,
    ),
  };

  const tasks = Array.isArray(record.tasks)
    ? record.tasks.map(normalizeTask).filter((task): task is Task => Boolean(task))
    : fallback.tasks;

  const memos = Array.isArray(record.memos)
    ? record.memos.map(normalizeMemo).filter((memo): memo is Memo => Boolean(memo))
    : fallback.memos;

  return {
    settings,
    tasks: tasks.length ? tasks : fallback.tasks,
    memos: memos.length ? memos : fallback.memos,
    studyStreak: clamp(asNumber(record.studyStreak, fallback.studyStreak), 0, 365),
  };
}

function getReadiness(state: PlannerState) {
  const { currentScore, targetScore, examDate } = state.settings;
  const completedMinutes = state.tasks
    .filter((task) => task.completed)
    .reduce((total, task) => total + task.durationMinutes, 0);
  const plannedMinutes = state.tasks.reduce((total, task) => total + task.durationMinutes, 0);
  const completion = plannedMinutes ? completedMinutes / plannedMinutes : 0;
  const scoreProgress = currentScore / Math.max(targetScore, 1);
  const urgencyBoost = daysUntil(examDate) <= 30 ? 0.08 : 0;

  return clamp(Math.round((scoreProgress * 0.55 + completion * 0.37 + urgencyBoost) * 100), 5, 99);
}

function getRequiredDailyMinutes(settings: PlannerSettings) {
  const gap = settings.targetScore - settings.currentScore;
  const remainingDays = daysUntil(settings.examDate);

  if (gap <= 0 || remainingDays <= 0) {
    return 0;
  }

  const totalHoursNeeded = (gap / 100) * 250;
  return Math.ceil((totalHoursNeeded * 60) / remainingDays);
}

function addMinutes(hour: number, minute: number, duration: number) {
  const total = hour * 60 + minute + duration;
  return {
    hour: Math.floor(total / 60),
    minute: total % 60,
  };
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function makeSchedule(settings: PlannerSettings) {
  const gap = settings.targetScore - settings.currentScore;
  const remainingDays = daysUntil(settings.examDate);

  if (gap <= 0) {
    return { tasks: [] as Task[], notice: "目標スコアは現在のスコアより高く設定してください。" };
  }

  if (remainingDays <= 0) {
    return { tasks: [] as Task[], notice: "試験日は明日以降に設定してください。" };
  }

  const requiredDailyMinutes = getRequiredDailyMinutes(settings);
  const plannedMinutes = clamp(Math.min(requiredDailyMinutes, settings.dailyStudyMinutes), 15, 240);
  const generated: Task[] = [];
  let currentHour = 7;
  let currentMinute = 0;

  const addTask = (
    title: string,
    category: string,
    detail: string,
    difficulty: Difficulty,
    ratio: number,
  ) => {
    const durationMinutes = Math.max(10, Math.round(plannedMinutes * ratio));
    const start = formatTime(currentHour, currentMinute);
    const end = addMinutes(currentHour, currentMinute, durationMinutes);
    const endTime = formatTime(end.hour, end.minute);

    generated.push({
      id: uid(),
      title,
      category,
      detail,
      durationMinutes,
      timeSlot: `${start} - ${endTime}`,
      difficulty,
      completed: false,
    });

    const afterBreak = addMinutes(end.hour, end.minute, 15);
    currentHour = afterBreak.hour;
    currentMinute = afterBreak.minute;

    if (currentHour >= 11 && currentHour < 20) {
      currentHour = 20;
      currentMinute = 0;
    }
  };

  if (settings.currentScore < 600) {
    addTask(
      "基礎単語の暗記",
      "語彙",
      "金のフレーズなどで頻出語を音声と例文込みで確認する。",
      "基礎",
      0.4,
    );
    addTask("文法の復習", "文法", "品詞、時制、接続詞を中心にPart 5の土台を固める。", "標準", 0.35);
    addTask(
      "Part 1/2 リスニング基礎",
      "リスニング",
      "短い発話を聞き取り、疑問詞と応答パターンを復習する。",
      "標準",
      0.25,
    );
  } else {
    addTask("Part 7 長文読解", "リーディング", "設問先読みと根拠行の確認をセットで進める。", "高難度", 0.35);
    addTask(
      "Part 3/4 シャドーイング",
      "リスニング",
      "会話と説明文を音読し、聞き逃した接続表現をメモする。",
      "高難度",
      0.35,
    );
    addTask("難単語とコロケーション", "語彙", "ビジネス文脈の頻出表現を例文で覚える。", "標準", 0.2);
    addTask("Part 5 高速演習", "文法", "1問30秒を目安に、根拠を短く言語化する。", "標準", 0.1);
  }

  const notice =
    requiredDailyMinutes > settings.dailyStudyMinutes
      ? `目標達成には1日約${requiredDailyMinutes}分が目安です。設定時間の${settings.dailyStudyMinutes}分に収まる範囲で、優先度の高いタスクを作成しました。`
      : `1日約${plannedMinutes}分の学習プランを作成しました。`;

  return { tasks: generated, notice };
}

function categoryIcon(category: string): IconName {
  if (category.includes("リスニング")) return "headphones";
  if (category.includes("文法")) return "grammar";
  return "book";
}

function categoryClass(category: string) {
  if (category.includes("リスニング")) return "category-listening";
  if (category.includes("リーディング")) return "category-reading";
  if (category.includes("文法")) return "category-grammar";
  if (category.includes("語彙")) return "category-vocabulary";
  return "category-general";
}

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const commonProps = {
    className: `icon ${className}`,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <path d="M4 4h7v7H4V4ZM13 4h7v5h-7V4ZM13 11h7v9h-7v-9ZM4 13h7v7H4v-7Z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...commonProps}>
          <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...commonProps}>
          <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-9" />
        </svg>
      );
    case "note":
      return (
        <svg {...commonProps}>
          <path d="M6 4h9l3 3v13H6V4ZM14 4v4h4M9 11h6M9 15h6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...commonProps}>
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
          <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
        </svg>
      );
    case "target":
      return (
        <svg {...commonProps}>
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
          <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...commonProps}>
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "book":
      return (
        <svg {...commonProps}>
          <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
          <path d="M8 17h9M8 4v13" />
        </svg>
      );
    case "headphones":
      return (
        <svg {...commonProps}>
          <path d="M4 13a8 8 0 0 1 16 0" />
          <path d="M4 13v4a2 2 0 0 0 2 2h2v-7H6a2 2 0 0 0-2 1ZM20 13v4a2 2 0 0 1-2 2h-2v-7h2a2 2 0 0 1 2 1Z" />
        </svg>
      );
    case "grammar":
      return (
        <svg {...commonProps}>
          <path d="M4 6h16M4 12h10M4 18h16" />
          <path d="m16 11 2 2 4-5" />
        </svg>
      );
    case "trash":
      return (
        <svg {...commonProps}>
          <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...commonProps}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "check":
      return (
        <svg {...commonProps}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case "spark":
      return (
        <svg {...commonProps}>
          <path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5L12 3Z" />
        </svg>
      );
    case "play":
      return (
        <svg {...commonProps}>
          <path d="M8 5v14l11-7L8 5Z" />
        </svg>
      );
    case "download":
      return (
        <svg {...commonProps}>
          <path d="M12 4v10M8 10l4 4 4-4M5 20h14" />
        </svg>
      );
  }
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="progress-ring" aria-label={`${label}: ${value}%`}>
      <svg viewBox="0 0 100 100">
        <circle className="progress-ring-track" cx="50" cy="50" r={radius} />
        <circle
          className="progress-ring-value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-ring-label">
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function ToeicPlanner() {
  const [state, setState] = useState<PlannerState | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [memoDraft, setMemoDraft] = useState<MemoDraft>(emptyMemoDraft);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        setState(saved ? normalizeState(JSON.parse(saved)) : getDefaultState());
      } catch {
        setState(getDefaultState());
        setNotice({
          kind: "warning",
          text: "保存データを読み込めなかったため、初期状態で開始しました。",
        });
      } finally {
        setHasLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoaded || !state) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hasLoaded, state]);

  const metrics = useMemo(() => {
    if (!state) return null;

    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter((task) => task.completed).length;
    const totalMinutes = state.tasks.reduce((total, task) => total + task.durationMinutes, 0);
    const completedMinutes = state.tasks
      .filter((task) => task.completed)
      .reduce((total, task) => total + task.durationMinutes, 0);
    const remainingDays = Math.max(0, daysUntil(state.settings.examDate));
    const readiness = getReadiness(state);
    const estimatedScore = clamp(
      Math.round(
        state.settings.currentScore +
          ((state.settings.targetScore - state.settings.currentScore) * readiness) / 100,
      ),
      state.settings.currentScore,
      990,
    );
    const listeningScore = clamp(Math.round(estimatedScore * 0.54), 5, 495);
    const readingScore = clamp(estimatedScore - listeningScore, 5, 495);
    const requiredDailyMinutes = getRequiredDailyMinutes(state.settings);

    return {
      totalTasks,
      completedTasks,
      totalMinutes,
      completedMinutes,
      remainingDays,
      readiness,
      estimatedScore,
      listeningScore,
      readingScore,
      requiredDailyMinutes,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [state]);

  const updateState = (updater: (current: PlannerState) => PlannerState) => {
    setState((current) => (current ? updater(current) : current));
  };

  const updateSettings = <Key extends keyof PlannerSettings>(key: Key, value: PlannerSettings[Key]) => {
    updateState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: value,
      },
    }));
  };

  const toggleTask = (id: string) => {
    updateState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    }));
  };

  const deleteTask = (id: string) => {
    updateState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id),
    }));
    setNotice({ kind: "info", text: "タスクを削除しました。" });
  };

  const deleteMemo = (id: string) => {
    updateState((current) => ({
      ...current,
      memos: current.memos.filter((memo) => memo.id !== id),
    }));
    setNotice({ kind: "info", text: "メモを削除しました。" });
  };

  const completeNextTask = () => {
    if (!state) return;
    const nextTask = state.tasks.find((task) => !task.completed);
    if (!nextTask) {
      setNotice({ kind: "success", text: "今日のタスクはすべて完了しています。" });
      return;
    }

    toggleTask(nextTask.id);
    setNotice({ kind: "success", text: `「${nextTask.title}」を完了にしました。` });
  };

  const generatePlan = () => {
    if (!state) return;
    const result = makeSchedule(state.settings);

    if (!result.tasks.length) {
      setNotice({ kind: "error", text: result.notice });
      return;
    }

    updateState((current) => ({
      ...current,
      tasks: result.tasks,
    }));
    setNotice({
      kind: result.notice.includes("目標達成には") ? "warning" : "success",
      text: result.notice,
    });
    setActiveView("schedule");
  };

  const submitTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = taskDraft.title.trim();

    if (!title) {
      setNotice({ kind: "error", text: "タスク名を入力してください。" });
      return;
    }

    updateState((current) => ({
      ...current,
      tasks: [
        ...current.tasks,
        {
          id: uid(),
          title,
          category: taskDraft.category.trim() || "その他",
          detail: taskDraft.detail.trim() || "手動で追加した学習タスクです。",
          durationMinutes: clamp(taskDraft.durationMinutes, 5, 480),
          timeSlot: "時間未定",
          difficulty: "標準",
          completed: false,
        },
      ],
    }));
    setTaskDraft(emptyTaskDraft);
    setShowTaskForm(false);
    setNotice({ kind: "success", text: "タスクを追加しました。" });
  };

  const submitMemo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = memoDraft.title.trim();
    const content = memoDraft.content.trim();

    if (!title || !content) {
      setNotice({ kind: "error", text: "メモのタイトルと内容を入力してください。" });
      return;
    }

    updateState((current) => ({
      ...current,
      memos: [
        {
          id: uid(),
          title,
          content,
          tag: memoDraft.tag.trim() || "一般",
        },
        ...current.memos,
      ],
    }));
    setMemoDraft(emptyMemoDraft);
    setNotice({ kind: "success", text: "メモを保存しました。" });
  };

  if (!state || !metrics) {
    return (
      <main className="planner-shell planner-loading">
        <section className="planner-card loading-card">
          <div className="loading-mark" />
          <h1>TOEIC Study Planner</h1>
          <p>学習データを準備しています。</p>
        </section>
      </main>
    );
  }

  const firstOpenTask = state.tasks.find((task) => !task.completed);
  const topTasks = state.tasks.slice(0, 3);
  const partScores = [
    { label: "Part 1", value: clamp(metrics.listeningScore / 4.95 + 6, 30, 96) },
    { label: "Part 2", value: clamp(metrics.listeningScore / 5.4, 30, 96) },
    { label: "Part 3", value: clamp(metrics.listeningScore / 5.1 - 2, 30, 96) },
    { label: "Part 4", value: clamp(metrics.listeningScore / 5.2, 30, 96) },
    { label: "Part 5", value: clamp(metrics.readingScore / 4.9 + 8, 30, 96) },
    { label: "Part 6", value: clamp(metrics.readingScore / 5.4, 30, 96) },
    { label: "Part 7", value: clamp(metrics.readingScore / 5.6 - 4, 30, 96) },
  ];
  const historyScores = [0.72, 0.8, 0.89, 1].map((ratio, index) => ({
    label: `第${index + 1}回`,
    listening: clamp(Math.round(metrics.listeningScore * ratio), 5, 495),
    reading: clamp(Math.round(metrics.readingScore * ratio), 5, 495),
  }));

  return (
    <div className="planner-app">
      <header className="top-app-bar">
        <div className="brand-lockup">
          <span className="brand-icon">
            <Icon name="target" />
          </span>
          <div>
            <p>TOEICスコアアップ計画</p>
            <span>Success Planner</span>
          </div>
        </div>

        <nav className="desktop-nav" aria-label="メインナビゲーション">
          {views.map((view) => (
            <button
              className={activeView === view.id ? "nav-button active" : "nav-button"}
              key={view.id}
              onClick={() => setActiveView(view.id)}
              type="button"
            >
              <Icon name={view.icon} />
              {view.label}
            </button>
          ))}
        </nav>

        <div className="profile-pill" aria-label="ユーザー">
          U
        </div>
      </header>

      <main className="planner-shell">
        {notice ? (
          <div className={`notice notice-${notice.kind}`} role="status">
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="通知を閉じる">
              ×
            </button>
          </div>
        ) : null}

        {activeView === "dashboard" ? (
          <div className="dashboard-grid">
            <section className="planner-card welcome-card">
              <div>
                <p className="eyebrow">今日の学習</p>
                <h1>おはようございます。</h1>
                <p className="lead">集中を維持しましょう。目標スコアはもうすぐそこです。</p>
              </div>
              <div className="countdown-panel">
                <span className="metric-icon">
                  <Icon name="calendar" />
                </span>
                <div>
                  <p>次回のTOEICテスト</p>
                  <strong>{metrics.remainingDays > 0 ? `残り${metrics.remainingDays}日` : "試験日を確認"}</strong>
                </div>
                <button type="button" className="ghost-button" onClick={() => setActiveView("settings")}>
                  詳細
                </button>
              </div>
            </section>

            <section className="planner-card readiness-card">
              <div className="section-heading">
                <p>現在の準備状況</p>
                <Icon name="chart" />
              </div>
              <ProgressRing value={metrics.readiness} label="準備度" />
              <div className="mini-panel">
                予想スコア: <strong>{metrics.estimatedScore}</strong> / {state.settings.targetScore}
              </div>
            </section>

            <section className="planner-card focus-card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">Today&apos;s Focus</p>
                  <h2>今日の重点学習</h2>
                </div>
                <button type="button" className="link-button" onClick={() => setActiveView("schedule")}>
                  すべて見る
                </button>
              </div>
              <div className="task-list">
                {topTasks.map((task) => (
                  <article className={task.completed ? "task-row completed" : "task-row"} key={task.id}>
                    <span className={`task-icon ${categoryClass(task.category)}`}>
                      <Icon name={categoryIcon(task.category)} />
                    </span>
                    <div className="task-row-body">
                      <h3>{task.title}</h3>
                      <p>{task.detail}</p>
                    </div>
                    <div className="task-meta-stack">
                      <span className={`difficulty difficulty-${task.difficulty}`}>{task.difficulty}</span>
                      <span className="time-chip">
                        <Icon name="clock" />
                        {task.durationMinutes}分
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="quick-column">
              <section className="study-action">
                <Icon name="play" />
                <h2>学習を記録する</h2>
                <p>{firstOpenTask ? firstOpenTask.title : "今日のタスクは完了済みです。"}</p>
                <button type="button" onClick={completeNextTask}>
                  <Icon name="check" />
                  次のタスクを完了
                </button>
              </section>

              <section className="planner-card streak-card">
                <span className="metric-icon warm">
                  <Icon name="spark" />
                </span>
                <div>
                  <p>学習継続</p>
                  <strong>{state.studyStreak}日</strong>
                </div>
              </section>
            </aside>
          </div>
        ) : null}

        {activeView === "schedule" ? (
          <div className="content-stack">
            <header className="page-heading">
              <div>
                <p className="eyebrow">Study Schedule</p>
                <h1>学習スケジュール</h1>
                <p>試験まであと{metrics.remainingDays}日。今日やることを明確に保ちます。</p>
              </div>
              <div className="target-date-panel">
                <Icon name="calendar" />
                <div>
                  <span>目標テスト日</span>
                  <strong>{formatDate(state.settings.examDate)}</strong>
                </div>
              </div>
            </header>

            <div className="schedule-layout">
              <section className="planner-card schedule-card">
                <div className="card-header">
                  <div>
                    <p className="eyebrow">Timeline</p>
                    <h2>今日のタスク</h2>
                  </div>
                  <button type="button" className="secondary-button" onClick={() => setShowTaskForm((value) => !value)}>
                    <Icon name="plus" />
                    タスク追加
                  </button>
                </div>

                {showTaskForm ? (
                  <form className="inline-form" onSubmit={submitTask}>
                    <label>
                      タスク名
                      <input
                        value={taskDraft.title}
                        onChange={(event) => setTaskDraft((draft) => ({ ...draft, title: event.target.value }))}
                        placeholder="例: Part 7 ダブルパッセージ"
                      />
                    </label>
                    <label>
                      カテゴリ
                      <input
                        value={taskDraft.category}
                        onChange={(event) => setTaskDraft((draft) => ({ ...draft, category: event.target.value }))}
                        placeholder="例: リーディング"
                      />
                    </label>
                    <label>
                      時間
                      <input
                        type="number"
                        min={5}
                        max={480}
                        value={taskDraft.durationMinutes}
                        onChange={(event) =>
                          setTaskDraft((draft) => ({ ...draft, durationMinutes: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="form-wide">
                      内容
                      <textarea
                        value={taskDraft.detail}
                        onChange={(event) => setTaskDraft((draft) => ({ ...draft, detail: event.target.value }))}
                        placeholder="学習内容や意識するポイント"
                        rows={3}
                      />
                    </label>
                    <div className="form-actions">
                      <button type="submit" className="primary-button">
                        追加
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="timeline">
                  {state.tasks.map((task, index) => {
                    const status = task.completed ? "完了" : index === state.tasks.findIndex((item) => !item.completed) ? "学習中" : "予定";

                    return (
                      <article className={`timeline-item ${task.completed ? "done" : ""}`} key={task.id}>
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-topline">
                            <div>
                              <strong>{task.timeSlot}</strong>
                              <span>{task.category}</span>
                            </div>
                            <span className={`status-pill status-${status}`}>{status}</span>
                          </div>
                          <div className="timeline-task">
                            <label className="check-control">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTask(task.id)}
                                aria-label={`${task.title}を完了にする`}
                              />
                              <span />
                            </label>
                            <div>
                              <h3>{task.title}</h3>
                              <p>{task.detail}</p>
                              <div className="task-chips">
                                <span>{task.durationMinutes}分</span>
                                <span>{task.difficulty}</span>
                              </div>
                            </div>
                            <button type="button" className="icon-button danger" onClick={() => deleteTask(task.id)} aria-label={`${task.title}を削除`}>
                              <Icon name="trash" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className="planner-card summary-card">
                <p className="eyebrow">Readiness</p>
                <ProgressRing value={metrics.readiness} label="予測" />
                <div className="progress-list">
                  <div>
                    <span>完了タスク</span>
                    <strong>
                      {metrics.completedTasks}/{metrics.totalTasks}
                    </strong>
                  </div>
                  <div>
                    <span>学習時間</span>
                    <strong>
                      {metrics.completedMinutes}/{metrics.totalMinutes}分
                    </strong>
                  </div>
                  <div>
                    <span>必要目安</span>
                    <strong>{metrics.requiredDailyMinutes || "-"}分/日</strong>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : null}

        {activeView === "analysis" ? (
          <div className="content-stack">
            <header className="page-heading">
              <div>
                <p className="eyebrow">Score Analysis</p>
                <h1>スコア分析</h1>
                <p>最新の学習状況から、スコア到達度と弱点を確認します。</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setNotice({ kind: "info", text: "レポート出力は今後の拡張用です。" })}>
                <Icon name="download" />
                レポート
              </button>
            </header>

            <div className="analysis-grid">
              <section className="planner-card score-card">
                <ProgressRing value={metrics.readiness} label="推定" />
                <div className="score-copy">
                  <p className="eyebrow">Estimated Score</p>
                  <h2>{metrics.estimatedScore}</h2>
                  <p>現在のスコア {state.settings.currentScore} から、目標 {state.settings.targetScore} に向けた到達度です。</p>
                </div>
              </section>

              <section className="planner-card bars-card">
                <div className="card-header">
                  <div>
                    <p className="eyebrow">Listening / Reading</p>
                    <h2>セクション別推定</h2>
                  </div>
                </div>
                <div className="section-bars">
                  <div>
                    <span>リスニング</span>
                    <strong>{metrics.listeningScore} / 495</strong>
                    <div className="bar-track">
                      <span style={{ width: `${(metrics.listeningScore / 495) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <span>リーディング</span>
                    <strong>{metrics.readingScore} / 495</strong>
                    <div className="bar-track accent">
                      <span style={{ width: `${(metrics.readingScore / 495) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="planner-card part-card">
                <p className="eyebrow">Part 1-7</p>
                <h2>パート別分析</h2>
                <div className="part-bars">
                  {partScores.map((part) => (
                    <div key={part.label}>
                      <span>{part.label}</span>
                      <div className="bar-track compact">
                        <span style={{ width: `${part.value}%` }} />
                      </div>
                      <strong>{Math.round(part.value)}%</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="planner-card history-card">
                <p className="eyebrow">Mock Test</p>
                <h2>模試の推移</h2>
                <div className="history-bars">
                  {historyScores.map((score) => (
                    <div key={score.label}>
                      <div className="history-columns">
                        <span style={{ height: `${(score.listening / 495) * 100}%` }} />
                        <span className="accent" style={{ height: `${(score.reading / 495) * 100}%` }} />
                      </div>
                      <p>{score.label}</p>
                    </div>
                  ))}
                </div>
                <div className="legend-row">
                  <span>
                    <i className="legend-primary" /> リスニング
                  </span>
                  <span>
                    <i className="legend-accent" /> リーディング
                  </span>
                </div>
              </section>

              <section className="planner-card insight-card">
                <p className="eyebrow">Advice</p>
                <h2>学習アドバイス</h2>
                <div className="insight warning">
                  <strong>Part 2の強化が必要</strong>
                  <p>応答問題は疑問詞と似た発音の聞き分けを重点的に復習しましょう。</p>
                </div>
                <div className="insight success">
                  <strong>Part 5は伸びやすい状態です</strong>
                  <p>文法メモを残しながら、1問30秒の高速演習を継続しましょう。</p>
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {activeView === "memos" ? (
          <div className="content-stack">
            <header className="page-heading">
              <div>
                <p className="eyebrow">Review Notes</p>
                <h1>学習メモ・復習</h1>
                <p>間違えた理由、覚えたい語彙、次回の注意点を残します。</p>
              </div>
            </header>

            <section className="planner-card memo-form-card">
              <form className="memo-form" onSubmit={submitMemo}>
                <label>
                  タイトル
                  <input
                    value={memoDraft.title}
                    onChange={(event) => setMemoDraft((draft) => ({ ...draft, title: event.target.value }))}
                    placeholder="例: Part 5の前置詞"
                  />
                </label>
                <label>
                  タグ
                  <input
                    value={memoDraft.tag}
                    onChange={(event) => setMemoDraft((draft) => ({ ...draft, tag: event.target.value }))}
                    placeholder="例: 文法"
                  />
                </label>
                <label className="form-wide">
                  内容
                  <textarea
                    value={memoDraft.content}
                    onChange={(event) => setMemoDraft((draft) => ({ ...draft, content: event.target.value }))}
                    placeholder="復習したい内容"
                    rows={4}
                  />
                </label>
                <div className="form-actions">
                  <button type="submit" className="primary-button">
                    <Icon name="plus" />
                    メモ作成
                  </button>
                </div>
              </form>
            </section>

            <section className="notes-grid">
              {state.memos.map((memo) => (
                <article className="note-card" key={memo.id}>
                  <div>
                    <span>{memo.tag}</span>
                    <h2>{memo.title}</h2>
                    <p>{memo.content}</p>
                  </div>
                  <button type="button" className="icon-button danger" onClick={() => deleteMemo(memo.id)} aria-label={`${memo.title}を削除`}>
                    <Icon name="trash" />
                  </button>
                </article>
              ))}
            </section>
          </div>
        ) : null}

        {activeView === "settings" ? (
          <div className="settings-screen">
            <header className="setup-hero">
              <span className="setup-icon">
                <Icon name="target" />
              </span>
              <p className="eyebrow">初期設定</p>
              <h1>目標を設定しましょう</h1>
              <p>現在の実力と目標を入力すると、目標スコアへの学習ルートを作成します。</p>
            </header>

            <section className="planner-card settings-card">
              <div className="settings-grid">
                <label>
                  現在のスコア
                  <input
                    type="number"
                    min={10}
                    max={990}
                    step={5}
                    value={state.settings.currentScore}
                    onChange={(event) => updateSettings("currentScore", clamp(Number(event.target.value), 10, 990))}
                  />
                </label>
                <label>
                  目標スコア
                  <input
                    type="number"
                    min={10}
                    max={990}
                    step={5}
                    value={state.settings.targetScore}
                    onChange={(event) => updateSettings("targetScore", clamp(Number(event.target.value), 10, 990))}
                  />
                </label>
                <label className="form-wide">
                  試験日
                  <input
                    type="date"
                    value={state.settings.examDate}
                    onChange={(event) => updateSettings("examDate", event.target.value)}
                  />
                </label>
                <label className="form-wide slider-label">
                  <span>
                    1日の学習時間
                    <strong>{state.settings.dailyStudyMinutes}分</strong>
                  </span>
                  <input
                    type="range"
                    min={15}
                    max={240}
                    step={15}
                    value={state.settings.dailyStudyMinutes}
                    onChange={(event) => updateSettings("dailyStudyMinutes", Number(event.target.value))}
                  />
                  <small>
                    <span>15分</span>
                    <span>1時間</span>
                    <span>2時間</span>
                    <span>4時間</span>
                  </small>
                </label>
              </div>
              <div className="settings-actions">
                <button type="button" className="secondary-button" onClick={() => setNotice({ kind: "success", text: "設定を保存しました。" })}>
                  保存のみ
                </button>
                <button type="button" className="primary-button large" onClick={generatePlan}>
                  <Icon name="spark" />
                  学習プランを作成する
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>

      <nav className="bottom-nav" aria-label="モバイルナビゲーション">
        {views.map((view) => (
          <button
            className={activeView === view.id ? "bottom-nav-button active" : "bottom-nav-button"}
            key={view.id}
            onClick={() => setActiveView(view.id)}
            type="button"
          >
            <Icon name={view.icon} />
            <span>{view.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
