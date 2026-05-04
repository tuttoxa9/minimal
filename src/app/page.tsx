"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./form.module.css";
import { useLanguage } from "@/lib/LanguageContext";

export default function PublicForm() {
  const { t, language, setLanguage } = useLanguage();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    messenger: "",
    budget: "",
    goal: "",
    comment: "",
    creative: "",
    offer: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error("Failed to submit");
      
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <>
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            language === 'en' ? 'bg-white text-black shadow-md' : 'bg-black/10 text-black/50 hover:bg-white/50'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('ru')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            language === 'ru' ? 'bg-white text-black shadow-md' : 'bg-black/10 text-black/50 hover:bg-white/50'
          }`}
        >
          RU
        </button>
      </div>

      <main className="min-h-screen flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center bg-white/50 backdrop-blur-xl p-12 rounded-[32px] border border-white/20 shadow-xl"
            >
              <h2 className="text-2xl font-medium tracking-tight text-[#111827] mb-2">
                {t('form.success.title')}
              </h2>
              <p className="text-[#6b7280]">
                {t('form.success.text')}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={styles.container}
            >
              <h2 className={styles.heading}>{t('form.title')}</h2>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <div className={styles.inputField}>
                    <input type="text" id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    <label htmlFor="name">{t('form.name')}</label>
                  </div>
                  
                  <div className={styles.inputField}>
                    <input type="tel" id="phone" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    <label htmlFor="phone">{t('form.phone')}</label>
                  </div>

                  <div className={styles.inputField}>
                    <input type="text" id="messenger" value={formData.messenger} onChange={e => setFormData({ ...formData, messenger: e.target.value })} />
                    <label htmlFor="messenger">{t('form.messenger')}</label>
                  </div>

                  <div className={styles.inputField}>
                    <input type="email" id="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ display: 'block' }} />
                    <label htmlFor="email">{t('form.email')}</label>
                  </div>

                  <div className={styles.inputField}>
                    <input type="text" id="budget" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                    <label htmlFor="budget">{t('form.budget')}</label>
                  </div>
                </div>

                <div className={styles.inputField}>
                  <input type="text" id="goal" value={formData.goal} onChange={e => setFormData({ ...formData, goal: e.target.value })} />
                  <label htmlFor="goal">{t('form.goal')}</label>
                </div>

                <div className={styles.inputField}>
                  <textarea id="comment" value={formData.comment} onChange={e => setFormData({ ...formData, comment: e.target.value })} />
                  <label htmlFor="comment">{t('add.comment')}</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <div className={styles.inputField}>
                    <input type="text" id="creative" value={formData.creative} onChange={e => setFormData({ ...formData, creative: e.target.value })} />
                    <label htmlFor="creative">{t('form.creative')}</label>
                  </div>

                  <div className={styles.inputField}>
                    <input type="text" id="offer" value={formData.offer} onChange={e => setFormData({ ...formData, offer: e.target.value })} />
                    <label htmlFor="offer">{t('form.offer')}</label>
                  </div>
                </div>

                <div className={styles.btnContainer}>
                  <button type="submit" className={styles.btn} disabled={status === "loading"}>
                    {status === "loading" ? t('form.submitting') : t('form.submit')}
                  </button>
                </div>
                
                {status === "error" && (
                  <p className="text-red-500 text-sm mt-2">Error. Please try again.</p>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
