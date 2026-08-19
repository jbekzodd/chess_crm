const express = require('express');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const ChessModule = require('chess.js');
const Chess = ChessModule.Chess || ChessModule;

const app = express();
const PORT = process.env.PORT || 10000;

// Render Environment Variables'dan tokenni olish (agar bo'lmasa o'zidagini oladi)
const BOT_TOKEN = process.env.BOT_TOKEN || '8793505919:AAHeDxho7-sjluGN8u4UyO_CtH-ZlfNfGdw';
const bot = new Telegraf(BOT_TOKEN);

app.use(express.json());
app.use(express.static(__dirname));

const SERVER_URL = process.env.RENDER_EXTERNAL_URL || 'https://chess-crm.onrender.com';

// --- ADMIN SOZLAMALARI --- //
const superAdmins = ['jovliyev_bekzod'];
let botUsers = new Set();
let subAdmins = [];
let userState = {};

let botSettings = {
  welcomeText: `♞ *Assalomu alaykum!*\n\n*Chess Coach UZ* tizimiga xush kelibsiz.\n\nQuyidagi bo'limlardan birini tanlang yoki *Lichess o'yin havolasi / PGN matnini* tahlil uchun yuboring:`,
  helpText: `♞ *Chess Coach UZ Qo'llanma*\n\n1. Lichess o'yin havolasini yoki PGN formatdagi yurishlarni yuboring — AI murabbiy professional tahlil beradi.\n2. CRM platformasiga kirish uchun tugmani bosing.\n3. Savollar bo'lsa @jovliyev_bekzod ga murojaat qiling.`
};

function isAdmin(ctx) {
  const user = ctx.from?.username?.toLowerCase();
  return superAdmins.includes(user) || subAdmins.includes(user);
}

// --- PROFESSIONAL SHAXMAT TAHLILI FUNKSIYASI --- //
function analyzeChessGame(gameData) {
  const chess = new Chess();
  const moves = gameData.moves ? gameData.moves.split(' ') : [];
  let moveCount = 0;

  for (let m of moves) {
    try {
      const res = chess.move(m, { sloppy: true });
      if (res) moveCount++;
    } catch (e) {
      break;
    }
  }

  const whitePlayer = gameData.players?.white?.user?.name || gameData.white || 'Oqlar';
  const blackPlayer = gameData.players?.black?.user?.name || gameData.black || 'Qoralar';
  const whiteRating = gameData.players?.white?.rating || gameData.whiteRating || '—';
  const blackRating = gameData.players?.black?.rating || gameData.blackRating || '—';

  let winnerText = "🤝 Durang";
  if (gameData.winner === 'white' || gameData.result === '1-0') winnerText = `⚪️ Oqlar (${whitePlayer}) g'alaba qozondi`;
  if (gameData.winner === 'black' || gameData.result === '0-1') winnerText = `⚫️ Qoralar (${blackPlayer}) g'alaba qozondi`;

  const opening = gameData.opening?.name || gameData.openingName || "Klassik / Erkin debyut";
  const eco = gameData.opening?.eco ? `[${gameData.opening.eco}]` : "";

  let advice = [];
  const totalRounds = Math.ceil(moveCount / 2);

  if (totalRounds <= 6 && (gameData.winner || gameData.result)) {
    advice.push("⚠️ *Kritik Debyut Xatosi:* Partiya dastlabki bir necha yurishdayoq yakunlangan. Shoh atrofidagi himoya erta ochilib ketgan. Dastlabki yurishlarda markazni egallab, yengil toshlarni rivojlantiring.");
  } else if (totalRounds < 18 && (gameData.winner || gameData.result)) {
    advice.push("⚡️ *Taktik Zarba / Qoplama:* O'rta o'yinga o'tish arafasida muhim figura yoki markaziy nazorat boy berilgan. Raqibning hujum variantlariga nisbatan yetarli profilaktika qilinmagan.");
  } else {
    advice.push("♟ *Pozitsion Kurash & Endshpil:* Uzoq va keskin kurash kechgan. G'alaba toshlar faolligi, shoh xavfsizligi va o'tkinchi piyodalarning to'g'ri qo'llanilishi orqali hal qilingan.");
  }

  advice.push("🎯 *Murabbiy Tavsiyasi:* Qaysi yurishda ustunlik boy berilganini ko'rish uchun partiyani *Chess Coach CRM -> Tahlil* taxtasiga yuklang.");

  return `📊 *CHESS COACH AI — PROFESSIONAL TAHLIL*\n` +
         `━━━━━━━━━━━━━━━━━━━━\n` +
         `⚔️ *O'yin:* ${whitePlayer} (${whiteRating}) 🆚 ${blackPlayer} (${blackRating})\n` +
         `🏆 *Natija:* ${winnerText}\n` +
         `📖 *Debyut:* ${opening} ${eco}\n` +
         `⏱ *Davomiyligi:* ${totalRounds} ta yurish\n` +
         `━━━━━━━━━━━━━━━━━━━━\n\n` +
         `🤖 *AI Murabbiy Xulosalari:*\n\n` +
         advice.map(a => `• ${a}`).join('\n\n') +
         (gameData.id ? `\n\n🔗 [Lichess-da partiyani ko'rish](https://lichess.org/${gameData.id})` : '');
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

// --- ADMIN BUYRUQLARI --- //
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

// --- XABARLARNI MONITORING QILISH VA LICHESS TAHLIL --- //
bot.on('text', async (ctx) => {
  if (ctx.from?.id) botUsers.add(ctx.from.id);
  const text = ctx.message.text.trim();
  const state = userState[ctx.from?.id];

  if (state === 'waiting_for_broadcast' && isAdmin(ctx)) {
    delete userState[ctx.from.id];
    let count = 0;
    for (let userId of botUsers) {
      try {
        await ctx.telegram.sendMessage(userId, `📢 *Rasmiy Xabar:*\n\n${text}`, { parse_mode: 'Markdown' });
        count++;
      } catch (e) {}
    }
    return ctx.reply(`✅ Xabar ${count} ta foydalanuvchiga yuborildi!`, Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  if (state === 'waiting_for_welcome' && isAdmin(ctx)) {
    botSettings.welcomeText = text;
    delete userState[ctx.from.id];
    return ctx.reply("✅ Start matni yangilandi!", Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  if (state === 'waiting_for_help' && isAdmin(ctx)) {
    botSettings.helpText = text;
    delete userState[ctx.from.id];
    return ctx.reply("✅ Yordam matni yangilandi!", Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  if (state === 'waiting_for_admin_user' && isAdmin(ctx)) {
    const newAdmin = text.replace('@', '').toLowerCase().trim();
    if (!subAdmins.includes(newAdmin)) subAdmins.push(newAdmin);
    delete userState[ctx.from.id];
    return ctx.reply(`✅ @${newAdmin} admin qilindi!`, Markup.inlineKeyboard([[Markup.button.callback("👑 Admin Panel", "admin_panel")]]));
  }

  // Lichess URL tahlili
  const lichessMatch = text.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/);
  if (lichessMatch) {
    const gameId = lichessMatch[1].substring(0, 8);
    await ctx.reply("🧠 *Chess Coach AI o'yinni o'rganib tahlil qilmoqda...*", { parse_mode: 'Markdown' });

    try {
      const res = await axios.get(`https://lichess.org/game/export/${gameId}`, {
        params: { moves: true, tags: true, clocks: false, evals: true, opening: true },
        headers: { 'Accept': 'application/json' }
      });
      const report = analyzeChessGame({ ...res.data, id: gameId });
      return ctx.reply(report, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (err) {
      return ctx.reply("❌ O'yin ma'lumotlarini tahlil qilib bo'lmadi. Havola to'g'riligini tekshiring.");
    }
  }

  // PGN matn tahlili
  if (text.startsWith('1.') || text.includes('[Event ') || text.includes('1. e4') || text.includes('1. d4')) {
    await ctx.reply("🧠 *Chess Coach AI PGN partiyani tahlil qilmoqda...*", { parse_mode: 'Markdown' });
    try {
      const tempChess = new Chess();
      const loaded = tempChess.load_pgn(text);
      if (loaded) {
        const moves = tempChess.history().join(' ');
        const report = analyzeChessGame({
          moves: moves,
          white: 'Oqlar',
          black: 'Qoralar',
          result: tempChess.in_checkmate() ? (tempChess.turn() === 'b' ? '1-0' : '0-1') : '*'
        });
        return ctx.reply(report, { parse_mode: 'Markdown' });
      }
    } catch (e) {}
  }
});

// Express veb sahifa
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serverni tinglash va Botni ishga tushirish
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Web Server ${PORT}-portda faol!`);
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    bot.launch();
    console.log(`🤖 Telegram Bot muvaffaqiyatli ishga tushdi!`);
  } catch (err) {
    console.error("Bot ishga tushishida xatolik:", err.message);
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
