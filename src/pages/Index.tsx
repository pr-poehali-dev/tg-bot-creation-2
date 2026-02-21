import { useState } from "react";
import Icon from "@/components/ui/icon";

type Repeat = "once" | "daily" | "weekly" | "monthly";

interface Reminder {
  id: number;
  text: string;
  date: string;
  time: string;
  repeat: Repeat;
  done: boolean;
}

const REPEAT_LABELS: Record<Repeat, string> = {
  once: "Однажды",
  daily: "Каждый день",
  weekly: "Каждую неделю",
  monthly: "Каждый месяц",
};

const REPEAT_OPTIONS: Repeat[] = ["once", "daily", "weekly", "monthly"];

const defaultForm = { text: "", date: "", time: "", repeat: "once" as Repeat };

export default function Index() {
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: 1, text: "Позвонить клиенту Ивану", date: "2026-02-22", time: "10:00", repeat: "once", done: false },
    { id: 2, text: "Отправить отчёт команде", date: "2026-02-21", time: "18:00", repeat: "weekly", done: false },
    { id: 3, text: "Выпить воды", date: "2026-02-21", time: "09:00", repeat: "daily", done: true },
  ]);
  const [form, setForm] = useState(defaultForm);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const filtered = reminders.filter((r) => {
    if (filter === "active") return !r.done;
    if (filter === "done") return r.done;
    return true;
  });

  const addReminder = () => {
    if (!form.text.trim() || !form.date || !form.time) return;
    setReminders((prev) => [{ id: Date.now(), ...form, done: false }, ...prev]);
    setForm(defaultForm);
    setShowForm(false);
  };

  const toggleDone = (id: number) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
  };

  const deleteReminder = (id: number) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-stone-50 font-golos">
      <header className="bg-white border-b border-stone-100 px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight">Напоминания</h1>
            <p className="text-xs text-stone-400 mt-0.5">Telegram-бот · уведомления</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 bg-stone-900 text-white text-sm px-4 py-2 rounded-xl hover:bg-stone-700 transition-colors"
          >
            <Icon name={showForm ? "X" : "Plus"} size={15} />
            {showForm ? "Закрыть" : "Добавить"}
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-6 space-y-5">
        {showForm && (
          <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm animate-fade-in space-y-4">
            <p className="text-sm font-medium text-stone-700">Новое напоминание</p>

            <input
              className="w-full text-sm border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-stone-400 transition-colors bg-stone-50 placeholder:text-stone-300"
              placeholder="Текст напоминания..."
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-400 mb-1 block">Дата</label>
                <input
                  type="date"
                  className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-stone-400 transition-colors bg-stone-50"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">Время</label>
                <input
                  type="time"
                  className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-stone-400 transition-colors bg-stone-50"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-400 mb-1.5 block">Повторение</label>
              <div className="flex gap-2 flex-wrap">
                {REPEAT_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setForm({ ...form, repeat: r })}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      form.repeat === r
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {REPEAT_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={addReminder}
              className="w-full text-sm bg-stone-900 text-white py-2.5 rounded-xl hover:bg-stone-700 transition-colors font-medium"
            >
              Сохранить
            </button>
          </div>
        )}

        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          {(["all", "active", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium ${
                filter === f ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {f === "all" ? "Все" : f === "active" ? "Активные" : "Выполненные"}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-stone-300">
              <Icon name="BellOff" size={36} />
              <p className="mt-3 text-sm">Нет напоминаний</p>
            </div>
          )}

          {filtered.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border px-5 py-4 flex items-start gap-4 transition-all ${
                r.done ? "border-stone-100 opacity-50" : "border-stone-100 hover:border-stone-200"
              }`}
            >
              <button
                onClick={() => toggleDone(r.id)}
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  r.done ? "bg-stone-900 border-stone-900" : "border-stone-300 hover:border-stone-500"
                }`}
              >
                {r.done && <Icon name="Check" size={11} className="text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm text-stone-800 font-medium leading-snug ${r.done ? "line-through" : ""}`}>
                  {r.text}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <Icon name="Calendar" size={12} />
                    {formatDate(r.date)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <Icon name="Clock" size={12} />
                    {r.time}
                  </span>
                  {r.repeat !== "once" && (
                    <span className="flex items-center gap-1 text-xs text-stone-400">
                      <Icon name="RefreshCw" size={12} />
                      {REPEAT_LABELS[r.repeat]}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteReminder(r.id)}
                className="flex-shrink-0 text-stone-200 hover:text-red-400 transition-colors"
              >
                <Icon name="Trash2" size={15} />
              </button>
            </div>
          ))}
        </div>

        {reminders.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: "Всего", value: reminders.length, icon: "Bell" },
              { label: "Активных", value: reminders.filter((r) => !r.done).length, icon: "Clock" },
              { label: "Выполнено", value: reminders.filter((r) => r.done).length, icon: "CheckCircle" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
                <Icon name={s.icon} size={18} className="text-stone-300 mx-auto mb-2" />
                <p className="text-2xl font-semibold text-stone-800">{s.value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}