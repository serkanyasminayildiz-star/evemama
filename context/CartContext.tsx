"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { clarityEvent } from "../lib/clarity";

interface CartItem {
  id: number;
  name: string;
  price: number;
  emoji: string;
  quantity: number;
  resim_url?: string;
  slug?: string;        // ürün sayfası linki için (sepet/ödeme özetinde tıklanabilir ad)
}
interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  totalItems: number;
  totalPrice: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [yuklendi, setYuklendi] = useState(false);

  // Sayfa açılınca localStorage'dan yükle.
  // localStorage bir dış sistem ve SSR'da YOK → boş state ile başlayıp mount'tan
  // SONRA yüklüyoruz (server/client hydration mismatch'ini önler). Buradaki
  // set-state-in-effect KASITLI ve doğru desen, o yüzden bu effect'te kapatıyoruz.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const kayitli = localStorage.getItem("evemama_sepet");
      if (kayitli) setItems(JSON.parse(kayitli));
    } catch {}
    setYuklendi(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Her değişiklikte localStorage'a kaydet
  useEffect(() => {
    if (yuklendi) {
      localStorage.setItem("evemama_sepet", JSON.stringify(items));
    }
  }, [items, yuklendi]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    clarityEvent("sepete-ekleme"); // funnel: kaç oturum sepete ürün atıyor
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("evemama_sepet");
    // KUPON DA TEMİZLENİR (2 Eyl 2026). Uygulanan kupon kodu
    // localStorage("evemama_kupon")'a yazılıyor ve sepet/ödeme sayfaları
    // açılışta onu SESSİZCE yeniden doğrulayıp uyguluyor — sepet↔ödeme
    // taşınması için kasıtlı. Ama sipariş tamamlandığında temizlenmediği için
    // kod tarayıcıda KALICI oluyordu: bir kez YENILE10 giren müşteri sonraki
    // her siparişinde de %10 indirim alıyordu. Kampanya kuponu tek seferlik
    // olmalı; sepet boşaldığında kupon da düşer.
    localStorage.removeItem("evemama_kupon");
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, totalItems, totalPrice, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}