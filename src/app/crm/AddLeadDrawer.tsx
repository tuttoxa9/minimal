import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { User } from "@supabase/supabase-js";

interface AddLeadDrawerProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddLeadDrawer({ currentUser, onClose, onSuccess }: AddLeadDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    source: "Ручное добавление",
    market_type: "Не указан",
    investment_amount: "",
    comment: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amount = parseInt(formData.investment_amount.replace(/\D/g, ''));

    const { error } = await supabase.from("leads").insert({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      source: formData.source,
      market_type: formData.market_type,
      investment_amount: isNaN(amount) ? null : amount,
      comment: formData.comment,
      assigned_to: currentUser.id,
      agent_email: currentUser.email,
      status: 'Новая'
    });

    setLoading(false);
    if (!error) {
      onSuccess();
    } else {
      alert("Ошибка при добавлении: " + error.message);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      <motion.div initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col border-l border-[#F0F0F0]">
        <div className="p-6 md:p-8 border-b border-[#F0F0F0] flex justify-between items-center bg-[#FAFAFA]">
          <h2 className="text-xl font-semibold tracking-tight">Новый лид</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form id="add-lead-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="Иван Иванов" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
            <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="+971 50 123 4567" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="ivan@example.com" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Источник</label>
              <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white">
                <option>Ручное добавление</option>
                <option>WhatsApp</option>
                <option>Telegram</option>
                <option>Instagram</option>
                <option>Личный контакт</option>
                <option>Холодный звонок</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип рынка</label>
              <select value={formData.market_type} onChange={e => setFormData({...formData, market_type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white">
                <option>Не указан</option>
                <option>Новостройки</option>
                <option>Вторичка</option>
                <option>Аренда</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма инвестиций ($)</label>
            <input type="number" value={formData.investment_amount} onChange={e => setFormData({...formData, investment_amount: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="Например: 500000" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
            <textarea value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="Детали запроса..." />
          </div>
        </form>

        <div className="p-6 md:p-8 border-t border-[#F0F0F0] bg-[#FAFAFA]">
          <button type="submit" form="add-lead-form" disabled={loading || !formData.name || !formData.phone} className="w-full py-4 bg-[#0070f3] text-white rounded-xl font-medium disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-sm">
            {loading ? "Сохранение..." : "Добавить лид"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
