export default {
  title: "Fayllar va tartib",
  summary: "Papka yaratamiz, faylni nusxalaymiz, nomini o‘zgartiramiz, o‘chiramiz, tiklaymiz va qidiramiz.",
  steps: {
    intro: {
      title: "Tartib — tezlik",
      message: "Fayllar tartibli saqlansa, kerakli hujjat soniyalarda topiladi. Bu bobda haqiqiy amallar bajaramiz: papka yaratamiz, nusxalaymiz, o‘chiramiz va tiklaymiz. Fayl va papka nomlari (Loyiha, Hisobot.txt) aynan shunday yoziladi.",
    },
    "open-documents": {
      title: "Hujjatlar papkasini ochish",
      message: "Fayllarimiz “Hujjatlar” papkasida turadi. Uni oching — belgini ikki marta tez bosing.",
      hints: ["Ish stolidagi yorug‘ “Hujjatlar” belgisini ikki marta tez bosing."],
      wrong: { single: "Bir marta bosish faqat tanlaydi. Ochish uchun ikki marta tez bosing." },
    },
    "new-folder": {
      title: "Yangi papka",
      message: "Papka — o‘xshash fayllar uchun quti. Yuqoridagi “Yangi papka” tugmasi bo‘sh papka yaratadi.",
      hints: ["Oyna tepasidagi yorug‘ “Yangi papka” tugmasini bosing."],
    },
    "name-folder": {
      title: "Papkaga nom berish",
      message: "Papka nomi tahrirlanmoqda. Mazmunini aks ettiruvchi nom bering: “Loyiha” deb yozing va Enter bosing.",
      hints: ["Nom maydoniga Loyiha deb yozing (bosh harf bilan).", "So‘ng Enter tugmasini bosing."],
      wrong: {
        name: "Bu mashq uchun papka nomi aynan “Loyiha” bo‘lishi kerak. Papkani tanlab, “Nomini o‘zgartirish” tugmasini bosing va qayta yozing.",
        check: "Papka “Loyiha” nomi bilan topilmadi. Nomni tekshirib, qayta urinib ko‘ring.",
      },
    },
    "open-folder": {
      title: "Papka ichiga kirish",
      message: "Yangi papkani oching — ichida nima borligini ko‘rasiz. Hozircha bo‘sh.",
      hints: ["“Loyiha” papkasini ikki marta tez bosing."],
    },
    "go-up": {
      title: "Bir pog‘ona orqaga",
      message: "Yuqoriga strelka (↑) tugmasi bir daraja yuqori papkaga olib chiqadi. “Orqaga” tugmasi ham xuddi shunday ishlaydi.",
      hints: ["Yuqoridagi yorug‘ ↑ tugmasini bosing."],
    },
    "select-file": {
      title: "Faylni tanlash",
      message: "Faylga biror amal qilishdan oldin uni tanlash kerak. “Hisobot.txt” faylini bir marta bosing.",
      hints: ["Ro‘yxatdagi “Hisobot.txt” ustiga bir marta bosing."],
    },
    "copy-file": {
      title: "Nusxalash",
      message: "“Nusxalash” faylni xotiraga (buferga) qo‘yadi, lekin joyidan siljitmaydi. Bufer — vaqtinchalik “cho‘ntak”.",
      hints: ["Yuqoridagi yorug‘ “Nusxalash” tugmasini bosing.", "Kerak bo‘lsa avval faylni tanlang."],
    },
    "enter-folder": {
      title: "Manzilga borish",
      message: "Nusxa xotirada turibdi. Endi uni qo‘yadigan joyga — “Loyiha” papkasiga kiramiz.",
      hints: ["“Loyiha” papkasini ikki marta tez bosing."],
    },
    "paste-file": {
      title: "Qo‘yish",
      message: "“Qo‘yish” xotiradagi nusxani shu papkaga joylaydi. Asl fayl “Hujjatlar”da o‘z joyida qoladi.",
      hints: ["Yuqoridagi yorug‘ “Qo‘yish” tugmasini bosing.", "Tugma faqat xotirada nusxa bo‘lganda faol bo‘ladi."],
    },
    "begin-rename": {
      title: "Nomini o‘zgartirish",
      message: "Yaxshi nom — tartibning yarmi. Qo‘yilgan fayl tanlangan; “Nomini o‘zgartirish” tugmasini bosing.",
      hints: ["Yorug‘ “Nomini o‘zgartirish” tugmasini bosing."],
    },
    "rename-file": {
      title: "Yangi nom",
      message: "Hujjatga sana qo‘shsak, versiyalarni ajratish oson. “Hisobot-2026.txt” deb yozing va Enter bosing. Kengaytma (.txt) o‘zgarmasin.",
      hints: ["Eski nomni o‘chirib, Hisobot-2026.txt deb yozing.", "Enter bosib tasdiqlang."],
      wrong: {
        name: "Aynan “Hisobot-2026.txt” yozing. Faylni tanlab, “Nomini o‘zgartirish” tugmasini bosib qayta urinib ko‘ring.",
        check: "Fayl “Hisobot-2026.txt” nomi bilan “Loyiha”da topilmadi.",
      },
    },
    "delete-file": {
      title: "O‘chirish",
      message: "O‘chirilgan fayl darrov yo‘qolmaydi — “Savat”ga tushadi. Shuning uchun xatoni tuzatish mumkin.",
      hints: ["Fayl tanlanganiga ishonch hosil qiling.", "Yuqoridagi yorug‘ “O‘chirish” tugmasini bosing."],
    },
    "open-trash": {
      title: "Savatni ochish",
      message: "O‘chirilgan narsalar “Savat”da turadi. Chap ro‘yxatdan uni oching.",
      hints: ["Chapdagi yorug‘ “Savat” qatorini bosing."],
    },
    "select-trashed": {
      title: "Faylni topish",
      message: "Mana o‘chirgan faylingiz. Tiklash uchun avval uni tanlang.",
      hints: ["“Hisobot-2026.txt” faylini bir marta bosing."],
    },
    "restore-file": {
      title: "Tiklash",
      message: "“Tiklash” faylni o‘zi turgan joyga — “Loyiha” papkasiga qaytaradi.",
      hints: ["Yorug‘ “Tiklash” tugmasini bosing."],
    },
    "search-file": {
      title: "Fayl qidirish",
      message: "Fayl qayerdaligini unutsangiz, qidiruv yordam beradi. Qidiruv maydoniga “hisobot” deb yozing — barcha papkalardan mos fayllar chiqadi.",
      hints: ["Yuqori o‘ngdagi qidiruv maydonini bosing.", "hisobot so‘zini yozing."],
    },
    finish: {
      title: "Ikkinchi bob tugadi",
      message: "Siz papka yaratdingiz, faylni nusxaladingiz, nomini o‘zgartirdingiz, o‘chirdingiz, tikladingiz va qidirdingiz. Haqiqiy kompyuterda ham xuddi shu amallar: Ctrl+C, Ctrl+V, F2, Delete.",
    },
  },
};
