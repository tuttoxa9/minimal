"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Form
    "form.title": "Apply Now",
    "form.subtitle": "Leave your details and we will contact you",
    "form.name": "Name *",
    "form.name_placeholder": "John Doe",
    "form.phone": "Phone *",
    "form.email": "Email",
    "form.messenger": "Messenger",
    "form.creative": "Creative (Optional)",
    "form.offer": "Offer (Optional)",
    "form.submit": "Submit Application",
    "form.submitting": "Submitting...",
    "form.success.title": "Thank you!",
    "form.success.text": "Your application has been successfully sent.",
    "form.budget": "Budget",
    "form.goal": "Goal",
    // CRM Sidebar
    "crm.actions": "Actions",
    "crm.add_lead": "Add Lead",
    "crm.sections": "Sections",
    "crm.leads": "Leads",
    "crm.analytics": "Analytics",
    "crm.statuses": "Statuses",
    "crm.archive": "Archive",
    "crm.all_leads": "All Leads",
    "crm.logout": "Logout",
    // Analytics
    "analytics.title": "Analytics",
    "analytics.subtitle": "Performance overview and sales funnel",
    "analytics.total_leads": "Total Leads",
    "analytics.deals": "Deals",
    "analytics.conversion": "Conversion",
    "analytics.revenue": "Revenue",
    "analytics.funnel": "Sales Funnel",
    "analytics.sources": "Lead Sources",
    // Statuses
    "status.Новая": "New",
    "status.В работе": "In Progress",
    "status.Повторная связь": "Follow Up",
    "status.Успешно закрыта": "Closed Won",
    "status.Отказ": "Closed Lost",
    // Table / Cards
    "crm.name": "Name",
    "crm.source": "Source",
    "crm.assigned": "Assigned To",
    "crm.comment": "Comment",
    "crm.time": "Time",
    "crm.today": "Today",
    "crm.yesterday": "Yesterday",
    "crm.my_lead": "My lead",
    "crm.other_agent": "Another agent",
    "crm.free": "Unassigned",
    "crm.not_found": "No records found",
    "crm.loading": "Loading data...",
    "crm.show_more": "Show more",
    "crm.found": "Found:",
    "crm.total": "Total:",
    // Add Lead
    "add.title": "New Lead",
    "add.name_label": "Name *",
    "add.phone_label": "Phone *",
    "add.email_label": "Email",
    "add.source_label": "Source",
    "add.market_type_label": "Market Type",
    "add.investment_label": "Investment Amount ($)",
    "add.comment_label": "Comment",
    "add.submit": "Add Lead",
    "add.saving": "Saving...",
    "add.manual": "Manual entry",
    // Drawer
    "drawer.take": "Take Lead",
    "drawer.new_lead_title": "New Lead",
    "drawer.new_lead_desc": "This lead is not assigned to anyone yet.",
    "drawer.assigned": "Assigned To:",
    "drawer.you": "You",
    "drawer.market": "Market",
    "drawer.status": "Lead Status",
    "drawer.schedule": "Schedule Call",
    "drawer.note": "New Note",
    "drawer.note_placeholder": "Enter conversation details...",
    "drawer.history": "Event History",
    "drawer.save": "Save Changes",
    "drawer.saving": "Saving...",
    "drawer.delete_confirm": "Are you sure you want to completely delete this lead? This action cannot be undone.",
    // Global
    "global.unspecified": "Unspecified",
    "global.site": "Site"
  },
  ru: {
    // Form
    "form.title": "Оставить заявку",
    "form.subtitle": "Оставьте свои данные и мы свяжемся с вами",
    "form.name": "Имя *",
    "form.name_placeholder": "Иван Иванов",
    "form.phone": "Телефон *",
    "form.email": "Email",
    "form.messenger": "Мессенджер для связи",
    "form.creative": "Креатив (Необязательно)",
    "form.offer": "Оффер (Необязательно)",
    "form.submit": "Оставить заявку",
    "form.submitting": "Отправка...",
    "form.success.title": "Спасибо!",
    "form.success.text": "Ваша заявка успешно отправлена.",
    "form.budget": "Бюджет",
    "form.goal": "Цель покупки",
    // CRM Sidebar
    "crm.actions": "Действия",
    "crm.add_lead": "Добавить лид",
    "crm.sections": "Разделы",
    "crm.leads": "Лиды",
    "crm.analytics": "Аналитика",
    "crm.statuses": "Статусы",
    "crm.archive": "Архив",
    "crm.all_leads": "Все лиды",
    "crm.logout": "Выйти",
    // Analytics
    "analytics.title": "Аналитика",
    "analytics.subtitle": "Обзор эффективности работы и воронка продаж",
    "analytics.total_leads": "Всего лидов",
    "analytics.deals": "Сделки",
    "analytics.conversion": "Конверсия",
    "analytics.revenue": "Сумма продаж",
    "analytics.funnel": "Воронка продаж",
    "analytics.sources": "Источники лидов",
    // Statuses
    "status.Новая": "Новая",
    "status.В работе": "В работе",
    "status.Повторная связь": "Повторная связь",
    "status.Успешно закрыта": "Успешно закрыта",
    "status.Отказ": "Отказ",
    // Table / Cards
    "crm.name": "Имя",
    "crm.source": "Источник",
    "crm.assigned": "Ответственный",
    "crm.comment": "Комментарий",
    "crm.time": "Время",
    "crm.today": "Сегодня",
    "crm.yesterday": "Вчера",
    "crm.my_lead": "Мой лид",
    "crm.other_agent": "Другой агент",
    "crm.free": "Свободен",
    "crm.not_found": "Записей нет",
    "crm.loading": "Загрузка данных...",
    "crm.show_more": "Показать еще",
    "crm.found": "Найдено:",
    "crm.total": "Всего:",
    // Add Lead
    "add.title": "Новый лид",
    "add.name_label": "Имя *",
    "add.phone_label": "Телефон *",
    "add.email_label": "Email",
    "add.source_label": "Источник",
    "add.market_type_label": "Тип рынка",
    "add.investment_label": "Сумма инвестиций ($)",
    "add.comment_label": "Комментарий",
    "add.submit": "Добавить лид",
    "add.saving": "Сохранение...",
    "add.manual": "Ручное добавление",
    // Drawer
    "drawer.take": "Взять в работу",
    "drawer.new_lead_title": "Новый лид",
    "drawer.new_lead_desc": "Этот лид еще ни за кем не закреплен.",
    "drawer.assigned": "Ответственный:",
    "drawer.you": "Вы",
    "drawer.market": "Рынок",
    "drawer.status": "Статус лида",
    "drawer.schedule": "Запланировать звонок",
    "drawer.note": "Новая заметка",
    "drawer.note_placeholder": "Введите детали разговора...",
    "drawer.history": "История событий",
    "drawer.save": "Сохранить изменения",
    "drawer.saving": "Сохранение...",
    "drawer.delete_confirm": "Вы уверены, что хотите полностью удалить этот лид? Это действие необратимо.",
    // Global
    "global.unspecified": "Не указан",
    "global.site": "Сайт"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en'); // Default english
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('crm_language') as Language;
    if (saved && (saved === 'en' || saved === 'ru')) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('crm_language', lang);
  };

  const t = (key: string): string => {
    return (translations[language] as any)[key] || (translations['en'] as any)[key] || key;
  };

  if (!mounted) {
    // Render hidden content with default language to prevent hydration mismatch while still providing structure
    return (
      <div style={{ visibility: 'hidden' }}>
        <LanguageContext.Provider value={{ language: 'en', setLanguage, t: (key) => (translations['en'] as any)[key] || key }}>
          {children}
        </LanguageContext.Provider>
      </div>
    );
  }
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
