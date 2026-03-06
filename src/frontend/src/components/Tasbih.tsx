import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddTasbihCounter,
  useDeleteTasbihCounter,
  useGetTasbihCounters,
  useIncrementTasbihCounter,
  useResetTasbihCounter,
} from "../hooks/useQueries";
import { playTasbihClick, playTasbihGoal } from "../utils/sounds";

interface LocalCounter {
  name: string;
  count: number;
  target: number;
}

const DEFAULT_COUNTERS: LocalCounter[] = [
  { name: "Субханаллах", count: 0, target: 33 },
  { name: "Альхамдулиллах", count: 0, target: 33 },
  { name: "Аллаху Акбар", count: 0, target: 34 },
];

const ARABIC_NAMES: Record<string, string> = {
  Субханаллах: "سُبْحَانَ اللهِ",
  Альхамдулиллах: "الحَمْدُ لِلهِ",
  "Аллаху Акбар": "اللهُ أَكْبَرُ",
};

const LS_KEY = "tasbih_counters";

function loadFromLS(): LocalCounter[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_COUNTERS;
}

function saveToLS(counters: LocalCounter[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(counters));
}

function CircleProgress({ value, max }: { value: number; max: number }) {
  const size = 52;
  const strokeWidth = 4;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(value / max, 1);
  const dash = circumference * progress;
  const gap = circumference - dash;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
      aria-label="Прогресс"
      role="img"
    >
      <title>Прогресс</title>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={progress >= 1 ? "#4ade80" : "#f97316"}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        className="tasbih-ring"
      />
    </svg>
  );
}

interface CounterCardProps {
  counter: LocalCounter;
  index: number;
  onIncrement: (name: string) => void;
  onReset: (name: string) => void;
  onDelete: (name: string) => void;
}

function CounterCard({
  counter,
  index,
  onIncrement,
  onReset,
  onDelete,
}: CounterCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isComplete = counter.count >= counter.target;
  const arabicName = ARABIC_NAMES[counter.name];

  const ocidBase = `tasbih.counter.item.${index}`;

  return (
    <div
      className={`glass-card rounded-2xl p-4 relative overflow-hidden transition-all duration-300 ${
        isComplete ? "border-green-500/30" : "border-orange-500/10"
      }`}
      data-ocid={`tasbih.counter.item.${index}`}
    >
      {isComplete && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <Check size={12} className="text-green-400" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Progress ring */}
        <div className="relative shrink-0">
          <CircleProgress value={counter.count} max={counter.target} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-foreground/70">
              {counter.count >= counter.target
                ? "✓"
                : `${Math.round((counter.count / counter.target) * 100)}%`}
            </span>
          </div>
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-sm truncate">
            {counter.name}
          </div>
          {arabicName && (
            <div
              className="text-foreground/40 text-xs"
              style={{ direction: "rtl", fontFamily: "serif" }}
            >
              {arabicName}
            </div>
          )}
          <div className="text-foreground/50 text-xs mt-0.5">
            {counter.count} / {counter.target}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1">
          <Button
            size="sm"
            className={`h-9 px-5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
              isComplete
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                : "bg-primary text-primary-foreground hover:bg-orange-400"
            }`}
            onClick={() => onIncrement(counter.name)}
            data-ocid={`tasbih.increment.button.${index}`}
          >
            +1
          </Button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-foreground/40 hover:text-orange-400"
              onClick={() => onReset(counter.name)}
              data-ocid={`tasbih.reset.button.${index}`}
              title="Сбросить"
            >
              <RotateCcw size={12} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-foreground/40 hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              data-ocid={`tasbih.delete_button.${index}`}
              title="Удалить"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-foreground/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-green-500" : "bg-orange-500"}`}
          style={{
            width: `${Math.min((counter.count / counter.target) * 100, 100)}%`,
          }}
        />
      </div>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Удалить счётчик?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/60">
              «{counter.name}» будет удалён без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-secondary text-foreground"
              data-ocid={`${ocidBase}.cancel_button`}
            >
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => onDelete(counter.name)}
              data-ocid={`${ocidBase}.confirm_button`}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TasbihTab() {
  const [localCounters, setLocalCounters] =
    useState<LocalCounter[]>(loadFromLS);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("33");

  const { identity } = useInternetIdentity();
  const { user: firebaseUser } = useFirebaseAuth();
  const isAuthorLoggedIn = sessionStorage.getItem("author_session") === "1";
  const isLoggedIn = !!identity || !!firebaseUser || isAuthorLoggedIn;

  const { data: backendCounters } = useGetTasbihCounters();
  const { mutate: addCounter } = useAddTasbihCounter();
  const { mutate: incrementCounter } = useIncrementTasbihCounter();
  const { mutate: resetCounter } = useResetTasbihCounter();
  const { mutate: deleteCounter } = useDeleteTasbihCounter();

  // Sync backend to local when logged in
  useEffect(() => {
    if (isLoggedIn && backendCounters && backendCounters.length > 0) {
      const synced: LocalCounter[] = backendCounters.map((c) => ({
        name: c.name,
        count: Number(c.count),
        target: Number(c.target),
      }));
      setLocalCounters(synced);
    }
  }, [backendCounters, isLoggedIn]);

  // Save to localStorage whenever changed
  useEffect(() => {
    if (!isLoggedIn) {
      saveToLS(localCounters);
    }
  }, [localCounters, isLoggedIn]);

  const handleIncrement = useCallback(
    (name: string) => {
      let goalReached = false;
      setLocalCounters((prev) =>
        prev.map((c) => {
          if (c.name === name) {
            const newCount = c.count + 1;
            if (newCount === c.target) {
              goalReached = true;
              toast.success(`${name} — цель достигнута! 🎉`, {
                duration: 2000,
              });
            }
            return { ...c, count: newCount };
          }
          return c;
        }),
      );
      // Play sound
      if (goalReached) {
        playTasbihGoal();
      } else {
        playTasbihClick();
      }
      // Track total tasbih count for achievements
      const prev = Number(localStorage.getItem("tasbih_total_count") || "0");
      localStorage.setItem("tasbih_total_count", String(prev + 1));

      if (isLoggedIn) {
        incrementCounter(name);
      }
    },
    [isLoggedIn, incrementCounter],
  );

  const handleReset = useCallback(
    (name: string) => {
      setLocalCounters((prev) =>
        prev.map((c) => (c.name === name ? { ...c, count: 0 } : c)),
      );
      if (isLoggedIn) {
        resetCounter(name);
      }
    },
    [isLoggedIn, resetCounter],
  );

  const handleDelete = useCallback(
    (name: string) => {
      setLocalCounters((prev) => prev.filter((c) => c.name !== name));
      if (isLoggedIn) {
        deleteCounter(name);
      }
    },
    [isLoggedIn, deleteCounter],
  );

  const handleAdd = () => {
    const name = newName.trim();
    const target = Number.parseInt(newTarget);
    if (!name) {
      toast.error("Введите название");
      return;
    }
    if (Number.isNaN(target) || target < 1) {
      toast.error("Цель должна быть больше 0");
      return;
    }
    if (localCounters.find((c) => c.name === name)) {
      toast.error("Такой счётчик уже существует");
      return;
    }
    const newCounter: LocalCounter = { name, count: 0, target };
    setLocalCounters((prev) => [...prev, newCounter]);
    if (isLoggedIn) {
      addCounter({ name, count: BigInt(0), target: BigInt(target) });
    }
    setNewName("");
    setNewTarget("33");
    setAddOpen(false);
    toast.success("Счётчик добавлен");
  };

  const totalProgress = localCounters.reduce(
    (acc, c) => ({ count: acc.count + c.count, target: acc.target + c.target }),
    { count: 0, target: 0 },
  );

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-gradient-orange">
            Тасбих
          </h2>
          <p className="text-foreground/40 text-xs">
            {totalProgress.count} / {totalProgress.target} всего
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-orange-400 gap-1"
              data-ocid="tasbih.add.open_modal_button"
            >
              <Plus size={14} />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-card border-border"
            data-ocid="tasbih.add.dialog"
          >
            <DialogHeader>
              <DialogTitle className="text-foreground font-display">
                Новый счётчик
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-foreground/70">
                  Название (дуа или зикр)
                </Label>
                <Input
                  placeholder="Например: Астагфируллах"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/70">Цель (количество)</Label>
                <Input
                  type="number"
                  placeholder="33"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  min={1}
                  max={9999}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setAddOpen(false)}
                className="text-foreground/60"
                data-ocid="tasbih.add.cancel_button"
              >
                Отмена
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-orange-400"
                onClick={handleAdd}
                data-ocid="tasbih.add.submit_button"
              >
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sync notice */}
      {isLoggedIn ? (
        <div className="glass-card rounded-xl p-3 mb-4 border border-green-500/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          <p className="text-xs text-foreground/60">
            Вход завершён — синхронизация счётчиков и сохранение идёт в ваш
            профиль
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-3 mb-4 border border-orange-500/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
          <p className="text-xs text-foreground/50">
            Войдите для синхронизации счётчиков между устройствами
          </p>
        </div>
      )}

      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-foreground/40 mb-1">
          <span>Общий прогресс</span>
          <span>
            {Math.round((totalProgress.count / totalProgress.target) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((totalProgress.count / totalProgress.target) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Counters */}
      <div className="space-y-3 stagger-children">
        {localCounters.length === 0 ? (
          <div
            className="text-center py-12 text-foreground/30"
            data-ocid="tasbih.empty_state"
          >
            <div className="text-4xl mb-3">📿</div>
            <p className="text-sm">Нет счётчиков</p>
            <p className="text-xs mt-1">Нажмите «Добавить» для создания</p>
          </div>
        ) : (
          localCounters.map((counter, i) => (
            <CounterCard
              key={counter.name}
              counter={counter}
              index={i + 1}
              onIncrement={handleIncrement}
              onReset={handleReset}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Quick dhikr reminder */}
      <div className="mt-6 glass-card rounded-xl p-4 border border-orange-500/10 space-y-2">
        <div
          className="text-center text-base text-orange-400/60 leading-relaxed"
          style={{ fontFamily: "serif", direction: "rtl" }}
        >
          سُبْحَانَ اللهِ · الحَمْدُ لِلهِ · اللهُ أَكْبَرُ
        </div>
        <p className="text-center text-foreground/40 text-xs leading-relaxed">
          «Тот, кто произносит{" "}
          <span className="text-orange-400">Субханаллах</span> 33 раза,{" "}
          <span className="text-orange-400">Альхамдулиллах</span> 33 раза и{" "}
          <span className="text-orange-400">Аллаху Акбар</span> 34 раза после
          намаза, — тому простятся грехи, даже если их столько, сколько морской
          пены.»
        </p>
        <p className="text-center text-foreground/25 text-[10px]">
          (Муслим, 597)
        </p>
      </div>
    </div>
  );
}
