"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";

export default function SettingsView() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [agents, setAgents] = useState<{ id: string; email: string; created_at: string }[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("key", "notifications_enabled")
        .single();

      if (!error && data) {
        setNotificationsEnabled(data.value === "true");
      }
      setLoading(false);
    };

    const fetchAgents = async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (data) {
        setAgents(data);
      }
    };

    fetchSettings();
    fetchAgents();
  }, []);

  const handleToggle = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);

    const { error } = await supabase
      .from("settings")
      .upsert({ key: "notifications_enabled", value: newValue ? "true" : "false" });

    if (error) {
      alert("Ошибка при сохранении настроек: " + error.message);
      setNotificationsEnabled(!newValue); // revert
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Загрузка настроек...</div>;
  }

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto animate-in fade-in duration-300">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">Настройки</h2>
      
      <div className="space-y-6">
        <div className="bg-white border border-[#F0F0F0] rounded-[32px] overflow-hidden shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#111827]">Уведомления в Telegram</h3>
              <p className="text-sm text-[#6B7280] mt-1">Отправка новых заявок и напоминаний о звонках в Telegram группу.</p>
            </div>
            
            <button 
              onClick={handleToggle}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span 
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-8' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#F0F0F0] rounded-[32px] overflow-hidden shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Зарегистрированные агенты ({agents.length})</h3>
          <div className="space-y-2">
            {agents.length === 0 ? (
              <p className="text-sm text-gray-400">Список агентов пуст или таблица 'profiles' еще не создана.</p>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-2xl border border-[#F0F0F0]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {agent.email ? agent.email[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{agent.email}</p>
                      <p className="text-[10px] text-gray-500">{agent.id}</p>
                    </div>
                  </div>
                  {agent.email === 'admin@x.com' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">Админ</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
