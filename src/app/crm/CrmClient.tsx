"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, isToday, isYesterday, isPast, startOfDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import LeadDrawer from "./LeadDrawer";

type LeadStatus = 'Новая' | 'В работе' | 'Успешно закрыта' | 'Повторная связь' | 'Отказ';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  comment: string;
  status: LeadStatus;
  scheduled_date: string;
  created_at: string;
}

const STATUSES: LeadStatus[] = ['Новая', 'В работе', 'Повторная связь', 'Успешно закрыта', 'Отказ'];

export default function CrmClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'Все'>('Новая');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date>(new Date());

  const [limit, setLimit] = useState(30);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const statusMatch = selectedStatus === 'Все' || lead.status === selectedStatus;
      
      // Для вкладки "Все" игнорируем фильтр по дате
      if (selectedStatus === 'Все') return statusMatch;

      const leadDate = startOfDay(parseISO(lead.created_at));
      const targetDate = startOfDay(filterDate);
      
      if (isToday(targetDate)) {
        return statusMatch && (isToday(leadDate) || isPast(leadDate));
      }
      return statusMatch && leadDate.getTime() === targetDate.getTime();
    });
  }, [leads, selectedStatus, filterDate]);

  const displayedLeads = useMemo(() => {
    return filteredLeads.slice(0, limit);
  }, [filteredLeads, limit]);

  const groupedLeads = useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    
    displayedLeads.forEach(lead => {
      const date = parseISO(lead.created_at);
      let label = "";
      
      if (isToday(date)) label = "Сегодня";
      else if (isYesterday(date)) label = "Вчера";
      else label = format(date, "d MMMM", { locale: ru });
      
      if (!groups[label]) groups[label] = [];
      groups[label].push(lead);
    });
    
    return groups;
  }, [displayedLeads]);

  return (
    <div className="flex h-screen bg-white text-[#111827] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#F0F0F0] flex flex-col bg-[#FAFAFA]">
        <div className="p-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-8">CRM</h1>
          
          <nav className="space-y-1">
            <button
              onClick={() => {
                setSelectedStatus('Все');
                setLimit(30);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                selectedStatus === 'Все' ? 'bg-white shadow-sm text-black' : 'text-[#6b7280] hover:bg-gray-100'
              }`}
            >
              Все лиды
            </button>
            <div className="h-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 px-4">Статусы</p>
            {STATUSES.map(status => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setLimit(30);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  selectedStatus === status ? 'bg-white shadow-sm text-black border border-[#F0F0F0]' : 'text-[#6b7280] hover:bg-gray-100'
                }`}
              >
                {status}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[#F0F0F0]">
           <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-2xl transition-colors font-medium"
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Header with Date Selector */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                {selectedStatus === 'Все' ? 'Все заявки' : selectedStatus}
              </h2>
              <p className="text-[#6b7280] text-sm mt-1">
                {selectedStatus === 'Все' ? `Всего в базе: ${leads.length}` : `Найдено: ${filteredLeads.length}`}
              </p>
            </div>
            
            {selectedStatus !== 'Все' && (
              <div className="flex bg-[#F5F5F5] p-1 rounded-2xl shadow-inner">
                <button 
                  onClick={() => setFilterDate(new Date())}
                  className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${isToday(filterDate) ? 'bg-white shadow-sm' : 'text-[#6b7280]'}`}
                >
                  Сегодня
                </button>
                <input 
                  type="date"
                  onChange={(e) => setFilterDate(new Date(e.target.value))}
                  className="bg-transparent px-4 py-2 text-sm focus:outline-none text-[#6b7280]"
                />
              </div>
            )}
          </div>

          {loading && leads.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-sm text-gray-400">Загрузка данных...</div>
          ) : Object.keys(groupedLeads).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-gray-400 text-sm">Нет заявок за выбранный период</p>
            </div>
          ) : (
            <div className="space-y-12 pb-20">
              {Object.entries(groupedLeads).map(([date, items]) => (
                <section key={date}>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-6 px-1">{date}</h3>
                  <div className="bg-white border border-[#F0F0F0] rounded-[32px] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Имя</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Телефон</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Email</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Комментарий</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Время</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F0F0]">
                        {items.map(lead => (
                          <tr 
                            key={lead.id} 
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
                          >
                            <td className="px-6 py-5">
                              <span className="font-medium text-sm group-hover:text-black">{lead.name}</span>
                            </td>
                            <td className="px-6 py-5 text-sm text-[#4B5563]">{lead.phone}</td>
                            <td className="px-6 py-5 text-sm text-[#4B5563]">{lead.email || "—"}</td>
                            <td className="px-6 py-5 text-sm text-[#6B7280] max-w-xs truncate">{lead.comment || "—"}</td>
                            <td className="px-6 py-5 text-sm text-[#9CA3AF]">
                              {format(parseISO(lead.created_at), "HH:mm")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}

              {filteredLeads.length > limit && (
                <div className="flex justify-center pt-8">
                  <button 
                    onClick={() => setLimit(prev => prev + 30)}
                    className="px-8 py-3 bg-white border border-[#E5E5E5] rounded-2xl text-sm font-medium hover:bg-[#FAFAFA] transition-colors shadow-sm"
                  >
                    Показать еще
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {selectedLeadId && (
        <LeadDrawer 
          leadId={selectedLeadId} 
          onClose={() => {
            setSelectedLeadId(null);
            fetchLeads();
          }} 
        />
      )}
    </div>
  );
}
