const express = require('express');
const path = require('path');
const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Bot Tokeni
const BOT_TOKEN = '8793505919:AAHeDxho7-sjluGN8u4UyO_CtH-ZlfNfGdw';
const bot = new Telegraf(BOT_TOKEN);

app.use(express.static(path.join(__dirname)));
app.use(express.json());
bot.use(session());

let SERVER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// --- BAZA VA SOZLAMALAR (Admin Boshqaruvi uchun) --- //
const superAdmins = ['jovliyev_bekzod']; // Bosh Super Admin

let botSettings = {
  welcomeText: `♞ *Assalomu alaykum!*\n\n*Chess Coach UZ* tizimiga xush kelibsiz.\n\nQuyidagi bo'limlardan birini tanlang yoki lichess o'yin linkingizni tahlil uchun yuboring:`,
  helpText: `♞ *Chess Coach UZ Qo'llanma*\n\n1. Lichess partiya havolasini yuborib AI tahlil oling.\n2. CRM boshqaruviga kirish uchun tugmani bosing.\n3. Savollar bo'lsa @jovliyev_bekzod ga murojaat qiling.`
};

let botUsers = new Set(); // Botga kirgan barcha userlar ro'yxati
let subAdmins = []; // Siz qo'shgan qo'shimcha adminlar ro'yxati

// Adminlikni tekshirish funksiyasi
function isAdmin(ctx) {
  const user = ctx.from?.username?.toLowerCase();
  return superAdmins.includes(user) || subAdmins.includes(user);
}

// --- /start BUYRUG'I --- //
bot.start(async (ctx) => {
  if (ctx.from?.id) botUsers.add(ctx.from.id);
  const user = ctx.from?.username?.toLowerCase();

  try {
    await ctx.telegram.setChatMenuButton({
      chatId: ctx.chat.id,
      menuButton: {
        type: 'web_app',
        text: '📱 CRM-ni Ochish',
        web_app: { url: SERVER_URL }
      }
    });
  } catch (e) {
    console.error("Menu button error:", e);
  }

  const buttons = [
    [Markup.button.webApp("👨‍🏫 CRM Boshqaruv Paneli", SERVER_URL)],
    [Markup.button.webApp("🎓 Shogird Kabineti (Student App)", `${SERVER_URL}?mode=student`)],
    [Markup.button.callback("ℹ️ Qo'llanma", "help_info")]
  ];

  // Agar siz kirsangiz, maxsus Super Admin tugmasi chiqadi
  if (isAdmin(ctx)) {
    buttons.push([Markup.button.callback("👑 Super Admin Paneli", "admin_panel")]);
  }

  ctx.reply(botSettings.welcomeText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(buttons)
  });
});

// --- SUPER ADMIN BOSHQARUV PANELI --- //
bot.command('admin', (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply("❌ Kechirasiz, siz Super Admin emassiz!");
  }
  openAdminPanel(ctx);
});

bot.action('admin_panel', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Ruxsat yo'q!", { show_alert: true });
  ctx.answerCbQuery();
  openAdminPanel(ctx);
});

function openAdminPanel(ctx) {
  const panelText = 
    `👑 *SUPER ADMIN BOSHQARUV PANELI*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Bosh Admin:* @jovliyev_bekzod\n` +
    `👥 *Jami Foydalanuvchilar:* ${botUsers.size} ta\n` +
    `🛡 *Qo'shimcha Adminlar:* ${subAdmins.length} ta\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Kerakli boshqaruv amalini tanlang:`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("📢 Hammaga Reklama / Xabar Yuborish", "admin_broadcast")],
    [Markup.button.callback("✏️ Start Matnini O'zgartirish", "admin_edit_welcome")],
    [Markup.button.callback("✏️ Yordam Matnini O'zgartirish", "admin_edit_help")],
    [Markup.button.callback("➕ Yangi Admin Qo'shish", "admin_add_admin")],
    [Markup.button.callback("🗑 Adminlar Ro'yxati / O'chirish", "admin_list_admins")],
    [Markup.button.callback("◀️ Menyuga qaytish", "back_to_main")]
  ]);

  if (ctx.callbackQuery) {
    ctx.editMessageText(panelText, { parse_mode: 'Markdown', ...keyboard });
  } else {
    ctx.reply(panelText, { parse_mode: 'Markdown', ...keyboard });
  }
}

// 1. REKLAMA TARQATISH
bot.action('admin_broadcast', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  ctx.session = { step: 'waiting_for_broadcast' };
  ctx.reply("📢 Barcha foydalanuvchilarga yubormoqchi bo'lgan reklama matnini yoki postingizni yuboring (Bekor qilish uchun /cancel):");
});

// 2. START MATNINI TAHRIRLASH
bot.action('admin_edit_welcome', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  ctx.session = { step: 'waiting_for_welcome' };
  ctx.reply("✏️ Yangi Start xabari matnini yuboring (Bekor qilish uchun /cancel):");
});

// 3. YORDAM MATNINI TAHRIRLASH
bot.action('admin_edit_help', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  ctx.session = { step: 'waiting_for_help' };
  ctx.reply("✏️ Yangi Yordam xabari matnini yuboring (Bekor qilish uchun /cancel):");
});

// 4. ADMIN QO'SHISH
bot.action('admin_add_admin', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  ctx.session = { step: 'waiting_for_admin_user' };
  ctx.reply("➕ Yangi admin qilmoqchi bo'lgan shaxsning Telegram username'ini yuboring (Masalan: `usernomi`, @ belgisisiz):", { parse_mode: 'Markdown' });
});

// 5. ADMINLAR RO'YXATI
bot.action('admin_list_admins', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  let list = `🛡 *Adminlar Ro'yxati:*\n\n👑 *Bosh Admin:* @jovliyev_bekzod\n`;
  if (subAdmins.length === 0) {
    list += `\nQo'shimcha adminlar mavjud emas.`;
  } else {
    subAdmins.forEach((adm, i) => {
      list += `${i + 1}. @${adm}\n`;
    });
  }
  ctx.reply(list, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback("🗑 Adminlarni Tozalash", "admin_clear_admins")],
      [Markup.button.callback("◀️ Orqaga", "admin_panel")]
    ])
  });
});

bot.action('admin_clear_admins', (ctx) => {
  if (!isAdmin(ctx)) return;
  subAdmins = [];
  ctx.answerCbQuery("Barcha yordamchi adminlar o'chirildi!");
  openAdminPanel(ctx);
});

bot.action('back_to_main', (ctx) => {
  ctx.answerCbQuery();
  ctx.deleteMessage();
});

// /cancel buyrug'i
bot.command('cancel', (ctx) => {
  ctx.session = null;
  ctx.reply("❌ Amal bekor qilindi.", Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
});

// --- MATNLARNI QABUL QILISH VA ISHLOV BERISH --- //
bot.on('text', async (ctx, next) => {
  if (ctx.from?.id) botUsers.add(ctx.from.id);
  const step = ctx.session?.step;

  // Lichess linki bo'lsa navbatdagi tahlil moduliga o'tkazish
  if (ctx.message.text.includes('lichess.org/')) {
    return next();
  }

  if (step === 'waiting_for_broadcast' && isAdmin(ctx)) {
    ctx.session = null;
    const msg = ctx.message.text;
    let count = 0;
    ctx.reply("🚀 Xabar barcha foydalanuvchilarga yuborilmoqda...");

    for (let userId of botUsers) {
      try {
        await ctx.telegram.sendMessage(userId, `📢 *Rasmiy Xabar:*\n\n${msg}`, { parse_mode: 'Markdown' });
        count++;
      } catch (e) {
        // Bloklagan bo'lsa o'tkazib yuboriladi
      }
    }
    return ctx.reply(`✅ Xabar muvaffaqiyatli ${count} ta foydalanuvchiga yuborildi!`, Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  if (step === 'waiting_for_welcome' && isAdmin(ctx)) {
    botSettings.welcomeText = ctx.message.text;
    ctx.session = null;
    return ctx.reply("✅ Start matni muvaffaqiyatli yangilandi!", Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  if (step === 'waiting_for_help' && isAdmin(ctx)) {
    botSettings.helpText = ctx.message.text;
    ctx.session = null;
    return ctx.reply("✅ Yordam matni muvaffaqiyatli yangilandi!", Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  if (step === 'waiting_for_admin_user' && isAdmin(ctx)) {
    const newAdmin = ctx.message.text.replace('@', '').toLowerCase().trim();
    if (!subAdmins.includes(newAdmin)) {
      subAdmins.push(newAdmin);
    }
    ctx.session = null;
    return ctx.reply(`✅ @${newAdmin} muvaffaqiyatli admin etib tayinlandi!`, Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  return next();
});

// --- LICHESS AI ANALIZ DVIJOKI --- //
bot.hears(/lichess\.org\/([a-zA-Z0-9]{8,12})/, async (ctx) => {
  const match = ctx.match[1];
  const gameId = match.substring(0, 8);

  await ctx.reply("🧠 *Chess Coach AI o'yinni o'rganmoqda va tahlil qilmoqda...*", { parse_mode: 'Markdown' });

  try {
    const res = await axios.get(`https://lichess.org/game/export/${gameId}`, {
      params: { moves: true, tags: true, clocks: false, evals: true, opening: true },
      headers: { 'Accept': 'application/json' }
    });

    const game = res.data;
    const whitePlayer = game.players?.white?.user?.name || (game.players?.white?.aiLevel ? `Bot (Daraja ${game.players.white.aiLevel})` : 'Oqlar');
    const blackPlayer = game.players?.black?.user?.name || (game.players?.black?.aiLevel ? `Bot (Daraja ${game.players.black.aiLevel})` : 'Qoralar');
    
    let resultText = "🤝 Durang";
    if (game.winner === 'white') resultText = `⚪️ Oqlar (${whitePlayer}) g'alaba qozondi`;
    if (game.winner === 'black') resultText = `⚫️ Qoralar (${blackPlayer}) g'alaba qozondi`;

    const openingName = game.opening?.name || "Klassik / Erkin debyut";
    const openingEco = game.opening?.eco ? `[${game.opening.eco}]` : "";
    const moves = game.moves ? game.moves.split(' ') : [];
    const movesCount = Math.ceil(moves.length / 2);

    let aiDiagnosis = [];
    if (movesCount <= 4 && game.winner) {
      aiDiagnosis.push("⚠️ *Tezkor mot (Bolalar moti / xato):* Shoh himoyasi erta ochilgan. Dastlabki yurishlarda markazni egallab, toshlarni rivojlantirish zarur.");
    } else if (movesCount < 15 && game.winner) {
      aiDiagnosis.push("⚡️ *Debyutdagi taktik xato:* 10-15 yurishdayoq muhim figura yoki markaziy nazorat boy berilgan.");
    } else {
      aiDiagnosis.push("♟ *Pozitsion kurash:* Partiya uzoq davom etgan. O'rta o'yin yoki endshpilda kombinatsiyalar hal qiluvchi rol o'ynagan.");
    }

    aiDiagnosis.push("🎯 *Murabbiy tavsiyasi:* Murabbiyingiz bilan partiyadagi noaniq yurishlar va taktik variantlarni ko'rib chiqing.");

    const report = 
      `📊 *CHESS COACH AI — PROFESSIONAL TAHLIL*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚔️ *O'yinchilar:* ${whitePlayer} 🆚 ${blackPlayer}\n` +
      `🏆 *Natija:* ${resultText}\n` +
      `⏱ *Yurishlar:* ${movesCount} ta yurish\n` +
      `📖 *Debyut:* ${openingName} ${openingEco}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🤖 *AI Xulosalari:*\n\n` +
      aiDiagnosis.map(d => `• ${d}`).join('\n\n') +
      `\n\n🔗 [Lichess-da to'liq ko'rish](https://lichess.org/${gameId})`;

    ctx.reply(report, { parse_mode: 'Markdown', disable_web_page_preview: true });

  } catch (err) {
    ctx.reply("❌ O'yin ma'lumotlarini tahlil qilib bo'lmadi. Havola ochiq o'yinga tegishli ekanligini tekshiring.");
  }
});

bot.action('help_info', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(botSettings.helpText, { parse_mode: 'Markdown' });
});

bot.launch()
  .then(() => console.log('🤖 Telegram Bot Super Admin (@jovliyev_bekzod) bilan ishga tushdi!'))
  .catch(err => console.error('Bot error:', err));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT}-portda ishlamoqda`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
