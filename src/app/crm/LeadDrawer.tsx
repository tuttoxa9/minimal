"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { useLanguage } from "@/lib/LanguageContext";

interface LeadDrawerProps {
  leadId: string;
  currentUser: User;
  isAdmin: boolean;
  onClose: () => void;
}

type LeadStatus = 'Новая' | 'В работе' | 'Успешно закрыта' | 'Повторная связь' | 'Отказ';

export default function LeadDrawer({ leadId, currentUser, isAdmin, onClose }: LeadDrawerProps) {
  const { t, language } = useLanguage();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>("Новая");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isChanged, setIsChanged] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`*, notes(*), history(*)`)
        .eq("id", leadId)
        .single();

      if (!error && data) {
        setLead(data);
        setSelectedStatus(data.status);
        if (data.scheduled_date) {
          setScheduledDate(format(parseISO(data.scheduled_date), "yyyy-MM-dd'T'HH:mm"));
        }
      }
      setLoading(false);
    };

    fetchLead();
  }, [leadId]);

  const handleDelete = async () => {
    if (!window.confirm(t('drawer.delete_confirm'))) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId);

    if (error) {
      alert("Ошибка при удалении: " + error.message);
      setLoading(false);
      return;
    }

    onClose();
  };

  const handleTakeLead = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("leads")
      .update({ 
        assigned_to: currentUser.id,
        agent_email: currentUser.email
      })
      .eq("id", leadId);

    if (error) {
      alert("Ошибка при назначении: " + error.message);
      setLoading(false);
      return;
    }

    await supabase.from("history").insert({
      lead_id: leadId,
      action_type: "Смена ответственного",
      old_value: "Нет",
      new_value: currentUser.email || "Агент",
    });

    onClose();
  };

  const handleSave = async () => {
    setLoading(true);

    // 1. Update Status and Scheduled Date
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        status: selectedStatus,
        scheduled_date: scheduledDate || null,
      })
      .eq("id", leadId);

    if (updateError) {
      alert("Ошибка при сохранении");
      setLoading(false);
      return;
    }

    // 2. Add History if status changed
    if (selectedStatus !== lead.status) {
      await supabase.from("history").insert({
        lead_id: leadId,
        action_type: "Смена статуса",
        old_value: lead.status,
        new_value: selectedStatus,
      });
    }

    // 3. Add Note if exists
    if (newNote.trim()) {
      await supabase.from("notes").insert({
        lead_id: leadId,
        text: newNote.trim(),
      });
    }

    onClose();
  };

  useEffect(() => {
    if (!lead) return;
    const hasStatusChanged = selectedStatus !== lead.status;
    const hasDateChanged = scheduledDate !== (lead.scheduled_date ? format(parseISO(lead.scheduled_date), "yyyy-MM-dd'T'HH:mm") : "");
    const hasNoteChanged = newNote.trim().length > 0;
    
    setIsChanged(hasStatusChanged || hasDateChanged || hasNoteChanged);
  }, [selectedStatus, scheduledDate, newNote, lead]);

  if (loading && !lead) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/10 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        className="w-full md:max-w-lg bg-white h-full md:h-screen shadow-2xl rounded-t-[40px] md:rounded-t-none md:rounded-l-[40px] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-[#F0F0F0] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{lead.name}</h2>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-sm text-[#6B7280]">{lead.phone}</p>
              {lead.email && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(lead.email);
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 text-left w-fit flex items-center gap-1.5 group transition-colors"
                  title="Copy Email"
                >
                  {copiedEmail ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  )}
                  {lead.email}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-32">
          {/* Assignment Banner */}
          {(!lead.assigned_to) ? (
             <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">{t('drawer.new_lead_title')}</p>
                  <p className="text-xs text-blue-700 mt-1">{t('drawer.new_lead_desc')}</p>
                </div>
                <button 
                  onClick={handleTakeLead}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                  {t('drawer.take')}
                </button>
             </div>
          ) : (
            <div className="flex items-center gap-2 text-sm bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
              <span className="text-[#9CA3AF]">{t('drawer.assigned')}</span>
              <span className="font-medium">{lead.assigned_to === currentUser.id ? t('drawer.you') : (lead.agent_email || t('crm.other_agent'))}</span>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-6 bg-[#FAFAFA] p-6 rounded-[32px] border border-[#F0F0F0]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('drawer.source')}</p>
              <p className="text-sm font-medium">{lead.source && lead.source !== 'Сайт' ? t(`global.${lead.source}`) !== `global.${lead.source}` ? t(`global.${lead.source}`) : lead.source : t('global.site')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('drawer.market')}</p>
              <p className="text-sm font-medium">{lead.market_type ? t(`add.${lead.market_type === 'Новостройки' ? 'offplan' : lead.market_type === 'Вторичка' ? 'secondary' : lead.market_type === 'Аренда' ? 'rent' : 'unspecified'}`) : t('global.unspecified')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('drawer.messenger')}</p>
              <p className="text-sm font-medium">{lead.messenger || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('drawer.budget')}</p>
              <p className="text-sm font-medium">{lead.investment_amount ? `$${lead.investment_amount}` : lead.budget || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('drawer.goal')}</p>
              <p className="text-sm font-medium">{lead.goal || "—"}</p>
            </div>
            {lead.portal && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('drawer.portal')}</p>
                <p className="text-sm font-medium capitalize text-blue-600">{lead.portal}</p>
              </div>
            )}
            {lead.property_ref && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('drawer.prop_ref')}</p>
                <p className="text-sm font-medium">{lead.property_ref}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('drawer.creative')}</p>
              {lead.creative && (lead.creative.startsWith('http://') || lead.creative.startsWith('https://')) ? (
                <a 
                  href={lead.creative} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm font-medium text-blue-600 hover:underline break-all block"
                >
                  {lead.creative}
                </a>
              ) : (
                <p className="text-sm font-medium break-all text-[#111827]">{lead.creative || "—"}</p>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('drawer.offer')}</p>
              <p className="text-sm font-medium break-words text-[#111827]">{lead.offer || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{t('crm.comment')}</p>
              <p className="text-sm font-medium break-words text-[#111827]">{lead.comment || "—"}</p>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{t('drawer.status')}</p>
            <div className="flex flex-wrap gap-2">
              {['Новая', 'В работе', 'Повторная связь', 'Успешно закрыта', 'Отказ'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                    selectedStatus === status 
                      ? 'bg-[#111827] text-white border-[#111827]' 
                      : 'bg-white text-[#6B7280] border-[#E5E5E5] hover:border-[#111827]'
                  }`}
                >
                  {t(`status.${status}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Call Scheduling */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{t('drawer.schedule')}</p>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E5] focus:outline-none focus:border-[#111827] text-sm"
            />
          </div>

          {/* New Note */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{t('drawer.note')}</p>
            <textarea
              placeholder={t('drawer.note_placeholder')}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border border-[#E5E5E5] focus:outline-none focus:border-[#111827] text-sm min-h-[120px] resize-none"
            />
          </div>

          {/* History / Notes Feed */}
          <div className="space-y-6 pt-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{t('drawer.history')}</p>
             <div className="space-y-6 border-l-2 border-[#F0F0F0] ml-2 pl-6">
                {(lead.notes || []).map((note: any) => (
                  <div key={note.id} className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                    <p className="text-xs text-[#9CA3AF] mb-1">{format(parseISO(note.created_at), "d MMMM, HH:mm", { locale: language === 'ru' ? ru : enUS })}</p>
                    <p className="text-sm text-[#4B5563] bg-[#F9FAFB] p-4 rounded-2xl border border-[#F0F0F0]">{note.text}</p>
                  </div>
                ))}
                {(lead.history || []).map((h: any) => (
                  <div key={h.id} className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 bg-gray-300 rounded-full border-2 border-white" />
                    <p className="text-xs text-[#9CA3AF] mb-1">{format(parseISO(h.created_at), "d MMMM, HH:mm", { locale: language === 'ru' ? ru : enUS })}</p>
                    <p className="text-xs font-medium text-[#6B7280]">
                      {h.action_type}: <span className="text-[#111827]">{h.old_value || "—"}</span> → <span className="text-green-600">{h.new_value}</span>
                    </p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Floating Action Button - FIXED POSITION WITHIN DRAWER */}
        <AnimatePresence>
          {isChanged && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-8 left-8 right-8 z-10"
            >
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full py-4 bg-[#111827] text-white rounded-2xl font-semibold shadow-2xl hover:bg-black transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {loading ? t('drawer.saving') : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {t('drawer.save')}
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
