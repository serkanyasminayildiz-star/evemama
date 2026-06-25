// Kategori bazlı SEO içeriği. kategoriler tablosunda açıklama kolonu olmadığı
// için anahtar kelime odaklı landing metni burada tutulur; hem page.tsx
// (title/description + FAQ schema) hem KategoriClient (görünür metin) kullanır.
// Yeni kategori eklemek için slug anahtarıyla yeni kayıt yaz — gerisi otomatik.

export type KategoriSeo = {
  title: string;          // <title> (template "%s | evemama.net" otomatik ekler)
  description: string;    // meta description (~155-165 karakter)
  h1: string;
  intro: string[];        // tanıtım paragrafları
  faq: { soru: string; cevap: string }[];
};

export const kategoriSeo: Record<string, KategoriSeo> = {
  "acik-mamalar": {
    title: "Açık Mama — Royal Canin Açık Kedi & Köpek Maması",
    description:
      "Açık mama mı arıyorsunuz? Royal Canin açık kedi ve köpek mamaları %100 orijinal, minimum 2027 SKT'li ve istediğiniz kiloda. 14 gün şartsız iade, hızlı kargo — evemama.net.",
    h1: "Açık Mama",
    intro: [
      "Açık mama, büyük orijinal paketlerden tartılarak istediğiniz kiloda satın alabileceğiniz mamadır. Kedinizin ya da köpeğinizin sevdiği mamayı koca bir torba almak zorunda kalmadan, ihtiyacınız kadar — örneğin 1 kg — temin etmenizi sağlar. Hem ekonomiktir hem de yeni bir mamayı küçük miktarla denemek için idealdir.",
      "evemama.net olarak açık mama alırken yaşanan en büyük endişeyi — “sahte mi, bayat mı, SKT'si geçmiş mi?” — çok iyi biliyoruz. Bu yüzden gönderdiğimiz tüm açık mamalar %100 orijinal ve minimum 2027 son kullanma tarihlidir. Ürünler hijyenik koşullarda, taze şekilde ve açıklanan kiloda tartılıp güvenli biçimde paketlenir.",
      "Açık kedi maması ve açık köpek maması çeşitlerimizde Royal Canin başta olmak üzere güvenilir markalar yer alır: yavru kediler için Kitten, yetişkin kediler için Fit 32, kısırlaştırılmış kediler için Sterilised; köpekler için Maxi Puppy, Medium Adult, Maxi Adult, Giant Junior ve Giant Adult. Beğenmez veya şüphe duyarsanız 14 gün içinde paranızın tamamını şartsız iade alabilirsiniz.",
    ],
    faq: [
      {
        soru: "Açık mama orijinal mi, sahte olma riski var mı?",
        cevap:
          "Hayır. evemama.net'te satılan tüm açık mamalar %100 orijinal ürünlerdir; büyük orijinal paketlerden bölünerek hazırlanır. Açık mamalarımıza %100 orijinal garantisi veriyoruz; şüphe duyarsanız 14 gün içinde şartsız iade hakkınız var.",
      },
      {
        soru: "Açık mamanın son kullanma tarihi ne kadar olur?",
        cevap:
          "Gönderdiğimiz tüm açık mamalar minimum 2027 SKT'lidir. Bayat veya son kullanma tarihi geçmiş ürün göndermeyiz; mamalar taze stoktan, açıklanan kiloda hazırlanır.",
      },
      {
        soru: "Açık mamayı istediğim kiloda alabilir miyim?",
        cevap:
          "Evet. Açık mama, ihtiyacınız kadar — örneğin 1 kg — açıklanan kiloda tartılarak hazırlanır. Böylece büyük paket almak zorunda kalmadan mamayı küçük miktarda deneyebilir ya da düzenli olarak alabilirsiniz.",
      },
      {
        soru: "Açık mama nasıl paketlenir, hijyenik mi?",
        cevap:
          "Açık mamalar temiz ve hijyenik koşullarda, tazeliğini koruyacak şekilde özel olarak paketlenir ve hızlı, güvenli kargoyla adresinize gönderilir.",
      },
      {
        soru: "Açık mamayı beğenmezsem iade edebilir miyim?",
        cevap:
          "Evet. Açık mamalarımızı deneyebilirsiniz; beğenmez veya şüphe duyarsanız 14 gün içinde paranızın tamamını şartsız ve kolay şekilde iade alabilirsiniz.",
      },
    ],
  },
};
