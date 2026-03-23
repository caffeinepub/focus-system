import { Toaster } from "@/components/ui/sonner";
import { ChevronRight, Flame, Sword, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Task } from "./backend.d";
import {
  useCompleteTask,
  useInitializeProfile,
  useProfile,
} from "./hooks/useQueries";

// ─── Types ──────────────────────────────────────────────────────────────────
interface SystemMessage {
  id: number;
  text: string;
  type: "info" | "success" | "warning";
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function calcWeekMultiplier(streak: number): number {
  const weeks = Math.floor(streak / 7);
  return 1 + weeks * 0.05;
}

function getScaledAmount(base: bigint, streak: number): number {
  const mult = calcWeekMultiplier(streak);
  return Math.round(Number(base) * mult);
}

// ─── XP Progress Bar ────────────────────────────────────────────────────────
function XPBar({
  xp,
  maxXp,
  animated = true,
}: { xp: number; maxXp: number; animated?: boolean }) {
  const pct = maxXp > 0 ? Math.min((xp / maxXp) * 100, 100) : 0;
  return (
    <div
      className="xp-bar-track h-3 rounded-full overflow-hidden"
      data-ocid="progress.xp_bar"
    >
      <motion.div
        className="xp-bar-fill h-full rounded-full"
        initial={{ width: animated ? "0%" : `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
      />
    </div>
  );
}

// ─── Quest Card ─────────────────────────────────────────────────────────────
function QuestCard({
  task,
  index,
  streak,
  onComplete,
  isPending,
}: {
  task: Task;
  index: number;
  streak: number;
  onComplete: (name: string) => void;
  isPending: boolean;
}) {
  const scaled = getScaledAmount(task.baseAmount, streak);
  const unit =
    task.name.toLowerCase().includes("walk") ||
    task.name.toLowerCase().includes("run")
      ? "km"
      : "reps";
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
        task.completed
          ? "border-success/40 bg-success/5"
          : "border-border bg-secondary hover:border-gold/40"
      }`}
      data-ocid={`quest.item.${index + 1}`}
    >
      {task.completed && (
        <div className="absolute inset-0 rounded-lg bg-success/3 pointer-events-none" />
      )}
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
            task.completed
              ? "border-success/60 bg-success/15 text-success"
              : "border-gold/40 bg-gold/10 text-gold"
          }`}
        >
          {task.completed ? "✓" : index + 1}
        </div>
        <div>
          <p
            className={`font-semibold text-sm uppercase tracking-wide ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
          >
            {task.name}
          </p>
          <p className="text-xs text-muted-foreground">
            <span
              className={
                task.completed ? "line-through" : "text-gold font-bold"
              }
            >
              {scaled}
            </span>{" "}
            <span className="text-muted-foreground">{unit}</span>
          </p>
        </div>
      </div>
      {task.completed ? (
        <span className="text-success text-xs font-bold uppercase tracking-widest glow-green px-3 py-1 rounded-full border border-success/30 bg-success/10">
          Complete
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onComplete(task.name)}
          disabled={isPending}
          className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-success/50 bg-success/10 text-success hover:bg-success/20 hover:border-success transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-green"
          data-ocid={`quest.complete_button.${index + 1}`}
        >
          ✔ Complete
        </button>
      )}
    </motion.div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const initProfile = useInitializeProfile();
  const completeTask = useCompleteTask();

  const [weight, setWeight] = useState("");
  const [messages, setMessages] = useState<SystemMessage[]>([
    {
      id: 1,
      text: "System initialized. Enter your weight to begin.",
      type: "info",
    },
    {
      id: 2,
      text: "Complete all tasks to gain XP and level up.",
      type: "info",
    },
    { id: 3, text: "Failure will reset your streak.", type: "warning" },
  ]);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (profile?.quest) {
      setMessages((prev) => {
        const has = prev.some((m) => m.text.includes("daily quest received"));
        if (has) return prev;
        return [
          {
            id: Date.now(),
            text: "You have received your daily quest.",
            type: "success",
          },
          {
            id: Date.now() + 1,
            text: "Complete all tasks to level up.",
            type: "info",
          },
          {
            id: Date.now() + 2,
            text: "Failure will reset your streak.",
            type: "warning",
          },
        ];
      });
    }
  }, [profile?.quest]);

  const handleGenerateQuest = async () => {
    const w = Number.parseFloat(weight);
    if (!w || w < 20 || w > 300) {
      toast.error("Please enter a valid weight between 20 and 300 kg.");
      return;
    }
    try {
      await initProfile.mutateAsync(w);
      toast.success("Daily quest generated! Complete your tasks.");
      setMessages([
        {
          id: Date.now(),
          text: "You have received your daily quest.",
          type: "success",
        },
        {
          id: Date.now() + 1,
          text: "Complete all tasks to level up.",
          type: "info",
        },
        {
          id: Date.now() + 2,
          text: "Failure will reset your streak.",
          type: "warning",
        },
      ]);
    } catch {
      toast.error("Failed to generate quest. Please try again.");
    }
  };

  const handleCompleteTask = async (taskName: string) => {
    try {
      await completeTask.mutateAsync(taskName);
      toast.success(`Task "${taskName}" completed! XP awarded.`);
      setMessages((prev) => [
        {
          id: Date.now(),
          text: `Task "${taskName}" completed. Keep going!`,
          type: "success",
        },
        ...prev.slice(0, 4),
      ]);
    } catch {
      toast.error("Failed to complete task.");
    }
  };

  const level = profile ? Number(profile.level) : 1;
  const xp = profile ? Number(profile.xp) : 0;
  const streak = profile ? Number(profile.streak) : 0;
  const xpPerLevel = 100;

  const xpProgress = xp % xpPerLevel;
  const xpPct = Math.round((xpProgress / xpPerLevel) * 100);

  const tasks: Task[] = profile?.quest?.tasks ?? [
    { name: "Push-ups", completed: false, baseAmount: BigInt(40) },
    { name: "Squats", completed: false, baseAmount: BigInt(50) },
    { name: "Sit-ups", completed: false, baseAmount: BigInt(40) },
    { name: "Walking", completed: false, baseAmount: BigInt(3) },
  ];

  const allDone = tasks.length > 0 && tasks.every((t) => t.completed);

  const weeks = [
    { week: "Week 1", label: "Base tasks", mod: "+0%" },
    { week: "Week 2", label: "+5% difficulty", mod: "+5%" },
    { week: "Week 3", label: "+10% difficulty", mod: "+10%" },
    { week: "Week 4", label: "+15% difficulty", mod: "+15%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" theme="dark" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sword className="w-5 h-5 text-gold" />
            <span className="text-gold font-bold text-sm uppercase tracking-[0.2em] glow-gold-text">
              Focus System
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              LVL <span className="text-gold font-bold text-sm">{level}</span>
            </span>
            <span className="text-muted-foreground hidden sm:block">
              <span className="text-foreground">{xpPct}%</span> to LVL{" "}
              {level + 1}
            </span>
            <span className="text-muted-foreground">
              XP <span className="text-gold font-bold">{xp}</span>
            </span>
          </div>
        </div>
        {/* XP strip */}
        <div className="max-w-6xl mx-auto px-4 pb-2">
          <XPBar xp={xpProgress} maxXp={xpPerLevel} animated={false} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* ── Hero ── */}
        <AnimatePresence>
          {heroVisible && (
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-center py-12"
              data-ocid="hero.section"
            >
              <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tight text-gold glow-gold-text mb-4">
                ⚔️ Focus System
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-8">
                Complete your daily quest and level up your body and mind.
              </p>
              <a
                href="#initialize"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-md bg-gold text-primary-foreground font-bold uppercase tracking-widest text-sm hover:bg-gold-light transition-all duration-200 glow-gold animate-pulse-gold"
                data-ocid="hero.primary_button"
              >
                Start Your Journey <ChevronRight className="w-4 h-4" />
              </a>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Initialize System ── */}
        <motion.section
          id="initialize"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="border border-border rounded-lg bg-card p-6 md:p-8"
          data-ocid="weight.section"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-border" />
            <h2 className="text-gold text-xs font-bold uppercase tracking-[0.25em]">
              Initialize System
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Enter your body weight to receive your personalized daily quest.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="number"
              min="20"
              max="300"
              placeholder="Enter your weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="flex-1 bg-secondary border border-input rounded-md px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all"
              data-ocid="weight.input"
            />
            <button
              type="button"
              onClick={handleGenerateQuest}
              disabled={initProfile.isPending}
              className="px-6 py-2.5 rounded-md bg-gold text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-gold-light transition-all duration-200 glow-gold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              data-ocid="weight.submit_button"
            >
              {initProfile.isPending ? "Generating..." : "Generate Daily Quest"}
            </button>
          </div>
        </motion.section>

        {/* ── 2-col grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Quest Board */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 border border-border rounded-lg bg-card p-6"
            data-ocid="quest.section"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-sm">
                📜 Daily Quest Board
              </h2>
              {allDone && (
                <span className="text-xs font-bold uppercase text-success tracking-widest border border-success/40 rounded-full px-3 py-1 bg-success/10 glow-green">
                  Quest Complete!
                </span>
              )}
            </div>
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <QuestCard
                  key={task.name}
                  task={task}
                  index={i}
                  streak={streak}
                  onComplete={handleCompleteTask}
                  isPending={completeTask.isPending}
                />
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Complete all tasks to gain XP and level up.
            </p>
          </motion.section>

          {/* Right column */}
          <div className="space-y-6">
            {/* System Messages */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="border border-border rounded-lg bg-card p-5"
              data-ocid="messages.section"
            >
              <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-4">
                🧠 System Messages
              </h2>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {messages.slice(0, 5).map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-2 items-start text-xs p-2.5 rounded border-l-2 ${
                        msg.type === "success"
                          ? "border-l-success bg-success/5 text-success"
                          : msg.type === "warning"
                            ? "border-l-yellow-500 bg-yellow-500/5 text-yellow-400"
                            : "border-l-gold/60 bg-gold/5 text-muted-foreground"
                      }`}
                      data-ocid="messages.item.1"
                    >
                      <span className="leading-relaxed">{msg.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>

            {/* Difficulty Scaling */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="border border-border rounded-lg bg-card p-5"
            >
              <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-1">
                🔥 Difficulty Scaling
              </h2>
              <p className="text-muted-foreground text-xs mb-4">
                Every week your tasks increase by{" "}
                <span className="text-gold font-bold">5%</span>. Stay
                consistent.
              </p>
              <div className="space-y-2">
                {weeks.map((w, i) => (
                  <div
                    key={w.week}
                    className={`flex items-center justify-between text-xs px-3 py-2 rounded border ${
                      i === 0
                        ? "border-gold/30 bg-gold/8 text-gold"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    <span className="font-semibold">{w.week}</span>
                    <span>{w.label}</span>
                    <span
                      className={
                        i === 0
                          ? "text-gold font-bold"
                          : "text-muted-foreground"
                      }
                    >
                      {w.mod}
                    </span>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>
        </div>

        {/* ── Progress + Quote wide card ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="border border-border rounded-lg bg-card overflow-hidden"
          data-ocid="progress.section"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Stats */}
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border">
              <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-xs mb-6">
                📊 Your Progress
              </h2>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-gold/60 bg-gold/10 flex items-center justify-center glow-gold">
                    <span className="text-2xl font-bold text-gold">
                      {level}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Current Level
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      LVL {level}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span className="text-gold font-bold">XP</span>
                    <span>
                      {xpProgress} / {xpPerLevel}
                    </span>
                  </div>
                  <XPBar xp={xpProgress} maxXp={xpPerLevel} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {xpPct}% to Level {level + 1}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-gold" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total XP
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gold">{xp}</p>
                  </div>
                  <div className="bg-secondary border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        Streak
                      </span>
                    </div>
                    <p className="text-xl font-bold text-orange-400">
                      {streak} Days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 50%, oklch(0.72 0.086 76), transparent 70%)",
                }}
              />
              <span className="text-gold/30 text-8xl font-serif leading-none mb-4 select-none">
                "
              </span>
              <blockquote className="text-xl md:text-2xl font-bold text-foreground leading-tight relative z-10">
                Discipline is the real power.
              </blockquote>
              <div className="mt-4 w-12 h-px bg-gold/40" />
              <p className="text-xs text-muted-foreground mt-3 uppercase tracking-widest">
                System Principle
              </p>
            </div>
          </div>
        </motion.section>

        {/* Loading state */}
        {profileLoading && (
          <div
            className="flex items-center justify-center py-8"
            data-ocid="app.loading_state"
          >
            <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Sword className="w-4 h-4 text-gold/60" />
            <span>Focus System © {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold/70 hover:text-gold transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
