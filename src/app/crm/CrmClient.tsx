"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { format, isToday, isYesterday, isPast, startOfDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import LeadDrawer from "./LeadDrawer";
import AddLeadDrawer from "./AddLeadDrawer";
import AnalyticsView from "./AnalyticsView";
import SettingsView from "./SettingsView";
import { useLanguage } from "@/lib/LanguageContext";

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
  assigned_to?: string | null;
  source?: string;
  market_type?: string;
  investment_amount?: number;
  agent_email?: string;
  portal?: string;
  property_ref?: string;
}

const STATUSES: LeadStatus[] = ['Новая', 'В работе', 'Повторная связь', 'Успешно закрыта', 'Отказ'];

export default function CrmClient() {
  const { t, language, setLanguage } = useLanguage();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'Все'>('Новая');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const [mobileView, setMobileView] = useState<'statuses' | 'leads'>('statuses');
  const [limit, setLimit] = useState(30);
  const [currentTab, setCurrentTab] = useState<'leads' | 'analytics' | 'settings'>('leads');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchLeads = async (user: User, adminStatus: boolean) => {
    setLoading(true);
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });

    if (!adminStatus) {
      // Если не админ: видит только свои лиды
      query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query;
    if (!error && data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const adminStatus = user.email === 'admin@x.com';
      setCurrentUser(user);
      setIsAdmin(adminStatus);
      fetchLeads(user, adminStatus);
    };
    init();
  }, []);

  // Real-time subscription for leads table
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        () => {
          // Silently re-fetch leads when any change occurs
          fetchLeads(currentUser, isAdmin);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, isAdmin]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUSES.forEach(s => counts[s] = 0);
    counts['Все'] = leads.length;
    
    leads.forEach(lead => {
      if (counts[lead.status] !== undefined) {
        counts[lead.status]++;
      }
    });
    return counts;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const statusMatch = selectedStatus === 'Все' || lead.status === selectedStatus;
      if (selectedStatus === 'Все') return statusMatch;

      const dateToUse = lead.scheduled_date ? parseISO(lead.scheduled_date) : parseISO(lead.created_at);
      const leadDate = startOfDay(dateToUse);
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
      const dateToUse = lead.scheduled_date ? parseISO(lead.scheduled_date) : parseISO(lead.created_at);
      const date = startOfDay(dateToUse);
      let label = isToday(date) ? t('crm.today') : isYesterday(date) ? t('crm.yesterday') : format(date, "d MMMM", { locale: language === 'ru' ? ru : undefined });
      if (!groups[label]) groups[label] = [];
      groups[label].push(lead);
    });
    return groups;
  }, [displayedLeads, t, language]);

  const handleStatusClick = (status: LeadStatus | 'Все') => {
    setSelectedStatus(status);
    setMobileView('leads');
    setLimit(30);
  };

  return (
    <div className="flex h-screen bg-white text-[#111827] overflow-hidden relative">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 border-r border-[#F0F0F0] flex-col bg-[#FAFAFA]">
        <div className="p-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-8">CRM</h1>
          <nav className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 px-4">{t('crm.actions')}</p>
            <button
              onClick={() => setIsAddDrawerOpen(true)}
              className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium text-white bg-[#0070f3] hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 mb-6 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              {t('crm.add_lead')}
            </button>

            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 px-4">{t('crm.sections')}</p>
            <button
              onClick={() => setCurrentTab('leads')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                currentTab === 'leads' ? 'bg-white shadow-sm text-black border border-[#F0F0F0]' : 'text-[#6b7280] hover:bg-gray-100'
              }`}
            >
              {t('crm.leads')}
            </button>
            <button
              onClick={() => setCurrentTab('analytics')}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                currentTab === 'analytics' ? 'bg-white shadow-sm text-black border border-[#F0F0F0]' : 'text-[#6b7280] hover:bg-gray-100'
              }`}
            >
              {t('crm.analytics')}
            </button>
            {isAdmin && (
              <button
                onClick={() => setCurrentTab('settings')}
                className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  currentTab === 'settings' ? 'bg-white shadow-sm text-black border border-[#F0F0F0]' : 'text-[#6b7280] hover:bg-gray-100'
                }`}
              >
                Настройки
              </button>
            )}

            {currentTab === 'leads' && (
              <div className="mt-6">
                <div className="h-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 px-4">{t('crm.statuses')}</p>
                <button
                  onClick={() => handleStatusClick('Все')}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all flex justify-between items-center ${
                    selectedStatus === 'Все' ? 'bg-white shadow-sm text-black border border-[#F0F0F0]' : 'text-[#6b7280] hover:bg-gray-100'
                  }`}
                >
                  <span>{t('crm.all_leads')}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedStatus === 'Все' ? 'bg-[#F0F0F0] text-black' : 'bg-gray-200 text-gray-500'}`}>
                    {statusCounts['Все'] || 0}
                  </span>
                </button>
                {STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusClick(status)}
                    className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all flex justify-between items-center ${
                      selectedStatus === status ? 'bg-white shadow-sm text-black border border-[#F0F0F0]' : 'text-[#6b7280] hover:bg-gray-100'
                    }`}
                  >
                    <span>{t(`status.${status}`)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedStatus === status ? 'bg-[#F0F0F0] text-black' : 'bg-gray-200 text-gray-500'}`}>
                      {statusCounts[status] || 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-[#F0F0F0] flex flex-col gap-4">
          <div className="flex bg-[#F5F5F5] p-1 rounded-xl">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${language === 'en' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>EN</button>
            <button onClick={() => setLanguage('ru')} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${language === 'ru' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>RU</button>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} className="w-full py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-2xl transition-colors font-medium">{t('crm.logout')}</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white relative">
        {/* Mobile Statuses Grid */}
        <div className={`md:hidden ${mobileView === 'statuses' ? 'block' : 'hidden'} p-6 space-y-6`}>
          <div className="flex justify-between items-center mb-4 pt-4">
            <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
            <div className="flex items-center gap-4">
              <div className="flex bg-[#F5F5F5] p-1 rounded-xl">
                <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-colors ${language === 'en' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>EN</button>
                <button onClick={() => setLanguage('ru')} className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-colors ${language === 'ru' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>RU</button>
              </div>
              <button onClick={() => setIsAddDrawerOpen(true)} className="w-10 h-10 bg-[#0070f3] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} className="text-red-500 text-sm font-medium">{t('crm.logout')}</button>
            </div>
          </div>
          
          <div className="flex gap-2 mb-6">
            <button onClick={() => setCurrentTab('leads')} className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${currentTab === 'leads' ? 'bg-[#111827] text-white' : 'bg-[#F5F5F5] text-gray-600'}`}>{t('crm.leads')}</button>
            <button onClick={() => setCurrentTab('analytics')} className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${currentTab === 'analytics' ? 'bg-[#111827] text-white' : 'bg-[#F5F5F5] text-gray-600'}`}>{t('crm.analytics')}</button>
            {isAdmin && (
              <button onClick={() => setCurrentTab('settings')} className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${currentTab === 'settings' ? 'bg-[#111827] text-white' : 'bg-[#F5F5F5] text-gray-600'}`}>Настройки</button>
            )}
          </div>

          {currentTab === 'leads' ? (
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => handleStatusClick('Все')} className="p-6 bg-[#FAFAFA] border border-[#F0F0F0] rounded-[32px] text-left shadow-sm active:scale-95 transition-all">
                <span className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">{t('crm.archive')}</span>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xl font-semibold">{t('crm.all_leads')}</p>
                  <span className="text-sm font-bold bg-[#F0F0F0] px-3 py-1 rounded-full text-[#6B7280]">{statusCounts['Все'] || 0}</span>
                </div>
              </button>
              {STATUSES.map(status => (
                <button key={status} onClick={() => handleStatusClick(status)} className="p-6 bg-white border border-[#F0F0F0] rounded-[32px] text-left shadow-sm active:scale-95 transition-all">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">{t('crm.statuses')}</span>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xl font-semibold">{t(`status.${status}`)}</p>
                    <span className="text-sm font-bold bg-[#F0F0F0] px-3 py-1 rounded-full text-[#6B7280]">{statusCounts[status] || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : currentTab === 'analytics' ? (
            <AnalyticsView leads={leads} />
          ) : (
            <SettingsView />
          )}
        </div>

        {/* Main View (Desktop & Mobile when mobileView is 'leads') */}
        <div className={`h-full ${mobileView === 'statuses' ? 'hidden md:block' : 'block'}`}>
          {currentTab === 'settings' ? (
             <div className="animate-in fade-in duration-300">
               <div className="md:hidden p-6 pb-0 flex items-center gap-4">
                  <button onClick={() => setMobileView('statuses')} className="p-2 bg-[#F5F5F5] rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  </button>
                  <h2 className="text-2xl font-semibold">Настройки</h2>
               </div>
               <SettingsView />
             </div>
          ) : currentTab === 'analytics' ? (
            <div className="animate-in fade-in duration-300">
               <div className="md:hidden p-6 pb-0 flex items-center gap-4">
                  <button onClick={() => setMobileView('statuses')} className="p-2 bg-[#F5F5F5] rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  </button>
                  <h2 className="text-2xl font-semibold">Аналитика</h2>
               </div>
               <AnalyticsView leads={leads} />
            </div>
          ) : (
            <div className="p-6 md:p-12 max-w-6xl mx-auto animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                  <button onClick={() => setMobileView('statuses')} className="md:hidden p-2 bg-[#F5F5F5] rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  </button>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{selectedStatus === 'Все' ? t('crm.all_leads') : t(`status.${selectedStatus}`)}</h2>
                    <p className="text-[#6b7280] text-sm mt-1">
                      {selectedStatus === 'Все' ? `${t('crm.total')} ${leads.length}` : `${t('crm.found')} ${filteredLeads.length}`}
                    </p>
                  </div>
                </div>
                
                {selectedStatus !== 'Все' && (
                  <div className="flex bg-[#F5F5F5] p-1 rounded-2xl shadow-inner w-full md:w-auto">
                    <button onClick={() => setFilterDate(new Date())} className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-medium transition-all ${isToday(filterDate) ? 'bg-white shadow-sm text-black' : 'text-[#6b7280]'}`}>{t('crm.today')}</button>
                    <input type="date" value={format(filterDate, "yyyy-MM-dd")} onChange={(e) => setFilterDate(new Date(e.target.value))} className="bg-transparent px-4 py-2 text-sm focus:outline-none text-[#6b7280] flex-1 md:flex-none" />
                  </div>
                )}
              </div>

              {/* Data Display */}
              {loading && leads.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-sm text-gray-400 font-medium">{t('crm.loading')}</div>
              ) : Object.keys(groupedLeads).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-400 text-sm">{t('crm.not_found')}</p>
                </div>
              ) : (
                <div className="space-y-12 pb-20">
                  {Object.entries(groupedLeads).map(([date, items]) => (
                    <section key={date}>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-6 px-1">{date}</h3>
                      
                      {/* Desktop Table */}
                      <div className="hidden md:block bg-white border border-[#F0F0F0] rounded-[32px] overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{t('crm.name')}</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{t('crm.source')}</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{t('crm.assigned')}</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{t('crm.comment')}</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{t('crm.time')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F0F0F0]">
                            {items.map(lead => (
                              <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className="hover:bg-[#F9FAFB] cursor-pointer transition-colors group">
                                <td className="px-6 py-5 font-medium text-sm">
                                  {lead.name}
                                  <a 
                                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#6B7280] font-normal mt-0.5 hover:text-[#25D366] transition-colors flex items-center gap-1 w-fit"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Написать в WhatsApp"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    {lead.phone}
                                  </a>
                                </td>
                                <td className="px-6 py-5 text-sm text-[#4B5563]">
                                  <div className="flex flex-col gap-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#F5F5F5] text-xs font-medium text-[#4B5563] w-fit">
                                      {lead.source && lead.source !== 'Сайт' ? t(`global.${lead.source}`) !== `global.${lead.source}` ? t(`global.${lead.source}`) : lead.source : t('global.site')}
                                    </span>
                                    {lead.portal && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit ${
                                        lead.portal === 'propertyfinder' ? 'bg-red-100 text-red-700' : 
                                        lead.portal === 'bayut' ? 'bg-green-100 text-green-700' : 
                                        'bg-purple-100 text-purple-700'
                                      }`}>
                                        {lead.portal}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-sm">
                                  {lead.assigned_to === currentUser?.id ? (
                                    <span className="text-green-600 font-medium">{t('crm.my_lead')}</span>
                                  ) : lead.assigned_to ? (
                                    <span className="text-[#9CA3AF]">{lead.agent_email || t('crm.other_agent')}</span>
                                  ) : (
                                    <span className="text-blue-500 font-medium">{t('crm.free')}</span>
                                  )}
                                </td>
                                <td className="px-6 py-5 text-sm text-[#6B7280] max-w-xs truncate">{lead.comment || "—"}</td>
                                <td className="px-6 py-5 text-sm text-[#9CA3AF]">{format(parseISO(lead.scheduled_date || lead.created_at), "HH:mm")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-4">
                        {items.map(lead => (
                          <button key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className="w-full p-6 bg-white border border-[#F0F0F0] rounded-[32px] text-left shadow-sm active:scale-[0.98] transition-all flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-lg font-semibold">{lead.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <a 
                                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#6B7280] hover:text-[#25D366] transition-colors flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Написать в WhatsApp"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    {lead.phone}
                                  </a>
                                  {lead.portal && (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      lead.portal === 'propertyfinder' ? 'bg-red-100 text-red-700' : 
                                      lead.portal === 'bayut' ? 'bg-green-100 text-green-700' : 
                                      'bg-purple-100 text-purple-700'
                                    }`}>
                                      {lead.portal === 'propertyfinder' ? 'PF' : lead.portal === 'bayut' ? 'BY' : 'DZ'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-medium text-[#9CA3AF]">{format(parseISO(lead.scheduled_date || lead.created_at), "HH:mm")}</span>
                            </div>
                            {lead.comment && (
                              <p className="text-sm text-[#4B5563] line-clamp-2 bg-[#F9FAFB] p-3 rounded-xl border border-[#F0F0F0]">
                                {lead.comment}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}

                  {filteredLeads.length > limit && (
                    <div className="flex justify-center pt-8">
                      <button onClick={() => setLimit(prev => prev + 30)} className="px-8 py-4 bg-[#111827] text-white rounded-[24px] text-sm font-semibold shadow-xl">{t('crm.show_more')}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {selectedLeadId && currentUser && (
          <LeadDrawer 
            leadId={selectedLeadId} 
            currentUser={currentUser}
            isAdmin={isAdmin}
            onClose={() => { 
              setSelectedLeadId(null); 
              fetchLeads(currentUser, isAdmin); 
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddDrawerOpen && currentUser && (
          <AddLeadDrawer 
            currentUser={currentUser}
            onClose={() => setIsAddDrawerOpen(false)}
            onSuccess={() => { 
              setIsAddDrawerOpen(false); 
              fetchLeads(currentUser, isAdmin); 
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
