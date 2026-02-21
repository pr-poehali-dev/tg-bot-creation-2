import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/9c978ab8-71e6-4b9e-85ae-5fedb7a47fde";

type Repeat = "once" | "daily" | "weekly" | "monthly";

interface Reminder {
  id: number;
  text: string;
  remind_at: string;
  repeat: Repeat;
  done: boolean;
  sent: boolean;
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
  const [chatId, setChatId] = useState(() => localStorage.getItem("tg_chat_id") || "");
  const [chatIdInput, setChatIdInput] = useState("");
  const [showChatSetup, setShowChatSetup] = useState(false);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const isReady = !!chatId;

  const loadReminders = async () => {
    if (!chatId) return;
    setLoading(true);
    const res = await fetch(`${API_URL}?chat_id=${chatId}`);
    const data = await res.json();
    setReminders(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadReminders();
  }, [chatId]);

  const saveChatId = () => {
    const val = chatIdInput.trim();
    if (!val) return;
    localStorage.setItem("tg_chat_id", val);
    setChatId(val);
    setShowChatSetup(false);
    setChatIdInput("");
  };

  const filtered = reminders.filter((r) => {
    if (filter === "active") return !r.done;
    if (filter === "done") return r.done;
    return true;
  });

  const addReminder = async () => {
    if (!form.text.trim() || !form.date || !form.time || !chatId) return;
    const remind_at = `${form.date}T${form.time}:00`;
    await fetch(`${API_URL}?chat_id=${chatId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: form.text, remind_at, repeat: form.repeat }),
    });
    setForm(defaultForm);
    setShowForm(false);
    loadReminders();
  };

  const toggleDone = async (r: Reminder) => {
    await fetch(`${API_URL}?chat_id=${chatId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, done: !r.done }),
    });
    loadReminders();
  };

  const deleteReminder = async (id: number) => {
    await fetch(`${API_URL}?chat_id=${chatId}&id=${id}`, { method: "DELETE" });
    loadReminders();
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-stone-50 font-golos flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 max-w-sm w-full space-y-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center">
              <Icon name="Send" size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">Подключи Telegram</p>
              <p className="text-xs text-stone-400">Для получения уведомлений</p>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-xs text-stone-500">
            <p className="font-medium text-stone-700">Как узнать свой Chat ID:</p>
            <p>1. Открой Telegram, найди <span className="font-mono bg-stone-100 px-1 rounded">@userinfobot</span></p>
            <p>2. Напиши ему <span className="font-mono bg-stone-100 px-1 rounded">/start</span></p>
            <p>3. Он пришлёт твой Chat ID — скопируй его сюда</p>
          </div>

          <div className="space-y-3">
            <input
              className="w-full text-sm border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-stone-400 transition-colors bg-stone-50 placeholder:text-stone-300 font-mono"
              placeholder="123456789"
              value={chatIdInput}
              onChange={(e) => setChatIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveChatId()}
            />
            <button
              onClick={saveChatId}
              className="w-full text-sm bg-stone-900 text-white py-2.5 rounded-xl hover:bg-stone-700 transition-colors font-medium"
            >
              Подключить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-golos">
      <header className="bg-white border-b border-stone-100 px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight">Напоминания</h1>
            <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1.5">
              <Icon name="Send" size={11} />
              Telegram · ID {chatId}
              <button onClick={() => { localStorage.removeItem("tg_chat_id"); setChatId(""); }} className="text-stone-300 hover:text-red-400 transition-colors ml-1">
                <Icon name="LogOut" size={11} />
              </button>
            </p>
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
          {loading && (
            <div className="text-center py-10 text-stone-300">
              <Icon name="Loader" size={28} className="animate-spin mx-auto" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-stone-300">
              <Icon name="BellOff" size={36} />
              <p className="mt-3 text-sm">Нет напоминаний</p>
            </div>
          )}

          {!loading && filtered.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border px-5 py-4 flex items-start gap-4 transition-all animate-fade-in ${
                r.done ? "border-stone-100 opacity-50" : "border-stone-100 hover:border-stone-200"
              }`}
            >
              <button
                onClick={() => toggleDone(r)}
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
                    <Icon name="Clock" size={12} />
                    {formatDate(r.remind_at)}
                  </span>
                  {r.repeat !== "once" && (
                    <span className="flex items-center gap-1 text-xs text-stone-400">
                      <Icon name="RefreshCw" size={12} />
                      {REPEAT_LABELS[r.repeat]}
                    </span>
                  )}
                  {r.sent && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <Icon name="Send" size={12} />
                      Отправлено
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
