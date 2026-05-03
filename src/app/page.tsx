"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./form.module.css";

export default function PublicForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    comment: "",
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
    <main className="min-h-screen flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h2 className="text-2xl font-medium tracking-tight text-[#111827] mb-2">
              Спасибо за заявку.
            </h2>
            <p className="text-[#6b7280]">
              Мы свяжемся с вами в ближайшее время.
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
            <h2 className={styles.heading}>Оставить заявку</h2>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputField}>
                <input 
                  type="text" 
                  id="name" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <label htmlFor="name">Имя</label>
              </div>
              
              <div className={styles.inputField}>
                <input 
                  type="tel" 
                  id="phone" 
                  required 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                <label htmlFor="phone">Телефон</label>
              </div>

              <div className={styles.inputField}>
                <input 
                  type="email" 
                  id="email" 
                  required={false}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ display: 'block' }} // Ensuring :valid triggers correctly if empty but not required
                />
                <label htmlFor="email">Email</label>
              </div>

              <div className={styles.inputField}>
                <textarea 
                  id="comment" 
                  value={formData.comment}
                  onChange={e => setFormData({ ...formData, comment: e.target.value })}
                  required={false}
                />
                <label htmlFor="comment">Комментарий</label>
              </div>

              <div className={styles.btnContainer}>
                <button 
                  type="submit" 
                  className={styles.btn}
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Отправка..." : "Отправить"}
                </button>
              </div>
              
              {status === "error" && (
                <p className="text-red-500 text-sm mt-2">Произошла ошибка. Попробуйте еще раз.</p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
