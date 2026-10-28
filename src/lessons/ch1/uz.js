export default {
  title: "Yangi ish stoli",
  summary: "Ish stoli, oynalar, vazifalar paneli va Start menyusi bilan tanishamiz.",
  steps: {
    welcome: {
      title: "Xush kelibsiz",
      message: "Bu sizning yangi ish joyingiz. Ekrandagi kompyuter ishlaydi: har bir bosish natija beradi. Xato qilsangiz ham hech narsa buzilmaydi — qaytadan urinib ko‘rishingiz mumkin.",
    },
    "select-icon": {
      title: "Belgini tanlash",
      message: "Ish stolidagi rasmchalar belgilar (ikonkalar) deyiladi. Belgini bir marta bosish uni tanlaydi. Keling, “Hujjatlar” belgisini bir marta bosamiz.",
      hints: ["Chapdagi, yorug‘ qilib ko‘rsatilgan “Hujjatlar” papkasini toping.", "Sichqonchani shu belgi ustiga olib boring va chap tugmani bir marta bosing."],
      wrong: {
        wallpaper: "Bu ish stolining orqa foni. Bosish hech narsani tanlamaydi. “Hujjatlar” belgisini bosing.",
        otherIcon: "Bu boshqa belgi. Yorug‘ qilib ko‘rsatilgan “Hujjatlar” belgisini bosing.",
      },
    },
    "open-icon": {
      title: "Papkani ochish",
      message: "Belgini ochish uchun uni tez-tez ikki marta bosish kerak (ikki marta bosish, ya’ni double click). Telefonda — ikki marta tez bosing.",
      hints: ["Tanlangan “Hujjatlar” belgisini yana bir marta, lekin ikki marta ketma-ket tez bosing.", "Ikki bosish orasida pauza qilmang — bir soniyadan kam bo‘lsin."],
      wrong: { single: "Bir marta bosish faqat tanlaydi. Ochish uchun ikki marta tez bosing." },
    },
    maximize: {
      title: "Oynani kattalashtirish",
      message: "Har bir oynaning yuqori o‘ng burchagida uchta tugma bor. O‘rtadagisi oynani butun ekranga yoyadi — katta oynada ishlash qulayroq.",
      hints: ["Oynaning yuqori o‘ng burchagidagi yorug‘ qilingan kvadrat tugmani bosing."],
    },
    "restore-size": {
      title: "Oynani qaytarish",
      message: "Xuddi shu tugma endi oynani avvalgi o‘lchamiga qaytaradi. Bir tugma ikki ish qiladi — hozirgi holatga qarab.",
      hints: ["Yana o‘sha tugmani bosing."],
    },
    minimize: {
      title: "Oynani yig‘ish",
      message: "Chap tomondagi tire (—) tugmasi oynani yashiradi, lekin yopmaydi. Oyna pastdagi vazifalar panelida qoladi — ishingiz saqlanadi.",
      hints: ["Yorug‘ qilingan tire shaklidagi tugmani bosing."],
    },
    "taskbar-restore": {
      title: "Vazifalar paneli",
      message: "Ekranning pastki qismi — vazifalar paneli. Unda ochiq dasturlar ko‘rinadi. Yashirilgan oynani qaytarish uchun uning tugmasini bosing.",
      hints: ["Pastdagi panelga qarang — “Hujjatlar” yozilgan tugma bor.", "Shu tugmani bir marta bosing."],
    },
    "close-window": {
      title: "Oynani yopish",
      message: "Ish tugagach oynani yopamiz. Yopish tugmasi (×) o‘ng tomonda. Yopilgan oyna vazifalar panelidan ham yo‘qoladi.",
      hints: ["Oynaning yuqori o‘ng burchagidagi × tugmasini bosing."],
    },
    "open-start": {
      title: "Start menyusi",
      message: "Start tugmasi — barcha dasturlarga eshik. Uni vazifalar panelining chap tomonida topasiz.",
      hints: ["Pastki chapdagi yorug‘ qilingan Start tugmasini bosing."],
    },
    "open-notes": {
      title: "Dasturni ishga tushirish",
      message: "Menyudan kerakli dasturni tanlaymiz. “Bloknot” — oddiy matn yozish dasturi.",
      hints: ["Menyudagi “Bloknot” qatorini bosing."],
    },
    "type-text": {
      title: "Matn yozish",
      message: "Oyna ichida yozish maydoni bor. Uni bosing va klaviaturadan istalgan so‘zni yozing — matn darrov paydo bo‘ladi.",
      hints: ["Oq maydonni bosing, so‘ng kamida uch harf yozing."],
      wrong: { check: "Hech bo‘lmaganda uchta belgi yozing." },
    },
    "close-notes": {
      title: "Bloknotni yopish",
      message: "Bu mashq uchun saqlash shart emas. Haqiqiy kompyuterda saqlanmagan matn bo‘lsa, dastur so‘raydi — buni keyingi boblarda o‘rganamiz.",
      hints: ["Bloknot oynasidagi × tugmasini bosing."],
    },
    finish: {
      title: "Birinchi bob tugadi",
      message: "Siz belgini tanladingiz va ochdingiz, oynani boshqardingiz, Start menyusidan dastur ishga tushirdingiz. Keyingi bobda fayl va papkalar bilan ishlaymiz.",
    },
  },
};
