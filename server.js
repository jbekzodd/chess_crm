const express = require('express');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// Bot Tokeni
const BOT_TOKEN = '8793505919:AAHeDxho7-sjluGN8u4UyO_CtH-ZlfNfGdw';
const bot = new Telegraf(BOT_TOKEN);

app.use(express.json());
app.use(express.static(__dirname));

// Render URL manzili
const SERVER_URL = process.env.RENDER_EXTERNAL_URL || 'https://chess-crm.onrender.com';

// --- ADMIN SOZLAMALARI --- //
const superAdmins = ['jovliyev_bekzod'];
let botUsers = new Set();
let subAdmins = [];
let userState = {}; // Sessiya o'rniga xotirada tezkor saqlash

let botSettings = {
  welcomeText: `♞ *Assalomu alaykum!*\n\n*Chess Coach UZ* tizimiga xush kelibsiz.\n\nQuyidagi bo'limlardan birini tanlang yoki lichess o'yin linkingizni tahlil uchun yuboring:`,
  helpText: `♞ *Chess Coach UZ Qo'llanma*\n\n1. Lichess o'yin havolasini yuborib AI tahlil oling.\n2. CRM tizimiga kirish uchun tugmani bosing.\n3. Savollar bo'lsa @jovliyev_bekzod ga murojaat qiling.`
};

function isAdmin(ctx) {
  const user = ctx.from?.username?.toLowerCase();
  return superAdmins.includes(user) || subAdmins.includes(user);
}

// --- /start BUYRUG'I --- //
bot.start(async (ctx) => {
  if (ctx.from?.id) botUsers.add(ctx.from.id);

  try {
    await ctx.telegram.setChatMenuButton({
      chatId: ctx.chat.id,
      menuButton: {
        type: 'web_app',
        text: '📱 CRM-ni Ochish',
        web_app: { url: SERVER_URL }
      }
    });
  } catch (e) {}

  const buttons = [
    [Markup.button.webApp("👨‍🏫 CRM Boshqaruv Paneli", SERVER_URL)],
    [Markup.button.webApp("🎓 Shogird Kabineti (Student App)", `${SERVER_URL}?mode=student`)],
    [Markup.button.callback("ℹ️ Qo'llanma", "help_info")]
  ];

  if (isAdmin(ctx)) {
    buttons.push([Markup.button.callback("👑 Super Admin Paneli", "admin_panel")]);
  }

  return ctx.reply(botSettings.welcomeText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(buttons)
  });
});

// --- ADMIN PANEL --- //
bot.command('admin', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("❌ Kechirasiz, siz Super Admin emassiz!");
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
    [Markup.button.callback("🗑 Adminlar Ro'yxati / Tozalash", "admin_list_admins")],
    [Markup.button.callback("◀️ Yopish", "back_to_main")]
  ]);

  if (ctx.callbackQuery) {
    ctx.editMessageText(panelText, { parse_mode: 'Markdown', ...keyboard });
  } else {
    ctx.reply(panelText, { parse_mode: 'Markdown', ...keyboard });
  }
}

bot.action('admin_broadcast', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  userState[ctx.from.id] = 'waiting_for_broadcast';
  ctx.reply("📢 Reklama xabaringizni yozing (Bekor qilish uchun /cancel):");
});

bot.action('admin_edit_welcome', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  userState[ctx.from.id] = 'waiting_for_welcome';
  ctx.reply("✏️ Yangi Start xabari matnini yuboring:");
});

bot.action('admin_edit_help', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  userState[ctx.from.id] = 'waiting_for_help';
  ctx.reply("✏️ Yangi Yordam matnini yuboring:");
});

bot.action('admin_add_admin', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  userState[ctx.from.id] = 'waiting_for_admin_user';
  ctx.reply("➕ Yangi admin Telegram username'ini yuboring (@ siz):");
});

bot.action('admin_list_admins', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.answerCbQuery();
  let list = `🛡 *Adminlar:* @jovliyev_bekzod\n`;
  subAdmins.forEach((adm, i) => { list += `${i + 1}. @${adm}\n`; });
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
  ctx.answerCbQuery("Adminlar tozalandi!");
  openAdminPanel(ctx);
});

bot.action('back_to_main', (ctx) => {
  ctx.answerCbQuery();
  ctx.deleteMessage();
});

bot.command('cancel', (ctx) => {
  delete userState[ctx.from.id];
  ctx.reply("Bekor qilindi.", Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
});

bot.action('help_info', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(botSettings.helpText, { parse_mode: 'Markdown' });
});

// Xabarlar va Admin holatlari
bot.on('text', async (ctx, next) => {
  if (ctx.from?.id) botUsers.add(ctx.from.id);
  const state = userState[ctx.from?.id];

  if (ctx.message.text.includes('lichess.org/')) return next();

  if (state === 'waiting_for_broadcast' && isAdmin(ctx)) {
    delete userState[ctx.from.id];
    const msg = ctx.message.text;
    let count = 0;
    for (let userId of botUsers) {
      try {
        await ctx.telegram.sendMessage(userId, `📢 *Rasmiy Xabar:*\n\n${msg}`, { parse_mode: 'Markdown' });
        count++;
      } catch (e) {}
    }
    return ctx.reply(`✅ Xabar ${count} ta foydalanuvchiga yuborildi!`, Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  if (state === 'waiting_for_welcome' && isAdmin(ctx)) {
    botSettings.welcomeText = ctx.message.text;
    delete userState[ctx.from.id];
    return ctx.reply("✅ Start matni yangilandi!", Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  if (state === 'waiting_for_help' && isAdmin(ctx)) {
    botSettings.helpText = ctx.message.text;
    delete userState[ctx.from.id];
    return ctx.reply("✅ Yordam matni yangilandi!", Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  if (state === 'waiting_for_admin_user' && isAdmin(ctx)) {
    const newAdmin = ctx.message.text.replace('@', '').toLowerCase().trim();
    if (!subAdmins.includes(newAdmin)) subAdmins.push(newAdmin);
    delete userState[ctx.from.id];
    return ctx.reply(`✅ @${newAdmin} admin qilindi!`, Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  return next();
});

// Lichess AI Tahlil
bot.hears(/lichess\.org\/([a-zA-Z0-9]{8,12})/, async (ctx) => {
  const match = ctx.match[1];
  const gameId = match.substring(0, 8);
  await ctx.reply("🧠 *Chess Coach AI tahlil qilmoqda...*", { parse_mode: 'Markdown' });

  try {
    const res = await axios.get(`https://lichess.org/game/export/${gameId}`, {
      params: { moves: true, tags: true, clocks: false, evals: true, opening: true },
      headers: { 'Accept': 'application/json' }
    });
    const game = res.data;
    const whitePlayer = game.players?.white?.user?.name || 'Oqlar';
    const blackPlayer = game.players?.black?.user?.name || 'Qoralar';
    const winner = game.winner ? (game.winner === 'white' ? `⚪️ Oqlar yutdi` : `⚫️ Qoralar yutdi`) : "🤝 Durang";
    const openingName = game.opening?.name || "Klassik ochilish";

    const report = 
      `📊 *CHESS COACH AI TAHLILI*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚔️ ${whitePlayer} 🆚 ${blackPlayer}\n` +
      `🏆 Natija: *${winner}*\n` +
      `🎯 Debyut: *${openingName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🔗 [Lichess-da ochish](https://lichess.org/${gameId})`;

    ctx.reply(report, { parse_mode: 'Markdown', disable_web_page_preview: true });
  } catch (err) {
    ctx.reply("❌ O'yin ma'lumotlarini tahlil qilib bo'lmadi.");
  }
});

// WEBHOOK YO'LI (To'g'ridan-to'g'ri Express orqali)
const SECRET_PATH = `/telegraf-webhook-${BOT_TOKEN.slice(-10)}`;
app.use(bot.webhookCallback(SECRET_PATH));

// WebApp sayti
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serverni ishga tushirish
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Web Server ${PORT}-portda faol!`);
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.telegram.setWebhook(`${SERVER_URL}${SECRET_PATH}`);
    console.log(`✅ Toza Webhook o'rnatildi: ${SERVER_URL}${SECRET_PATH}`);
  } catch (e) {
    console.error("Webhook xatolik:", e.message);
  }
});
