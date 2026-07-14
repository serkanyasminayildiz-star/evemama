"use client";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { clarityIdentify, claritySet } from "../lib/clarity";

// Giriş yapmış üyeyi Clarity'ye tanıtır (layout'ta her sayfada çalışır) —
// aynı müşteri farklı cihaz/oturumlarda TEK ziyaretçi olarak birleşir.
// E-posta Clarity tarafından İSTEMCİDE hash'lenir (düz PII gitmez).
// Sayfa geçişleri hard-redirect olduğundan (window.location) her sayfada
// yeniden mount olur → girişten sonraki ilk sayfada kimlik otomatik oturur.
export default function ClarityKimlik() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      if (email) {
        clarityIdentify(email);
        claritySet("uyelik", "uye");
      } else {
        claritySet("uyelik", "misafir");
      }
    }).catch(() => { /* analitik asla akışı bozmaz */ });
  }, []);
  return null;
}
