const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Siz taqdim etgan Bot Tokeni to'g'ridan-to'g'ri ulandi
const BOT_TOKEN = '8793505919:AAHeDxho7-sjluGN8u4UyO_CtH-ZlfNfGdw';
const bot = new Telegraf(BOT_TOKEN);

// CRM WebApp havolasi (Render/Vercel yoki Netlify linkingizni kiriting)
const WEB_APP_URL = 'https://sizning-crm-saytingiz.vercel.app'; 

// --- /start BUYRUG'I --- //
bot.start((ctx) => {
  const userName = ctx.from.first_name || 'Foydalanuvchi';
  const welcomeText = 
    `♞ *Assalomu alaykum, ${userName}!*\n\n` +
    `*Chess Coach UZ* — shaxmat akademiyalarini boshqarish va tahlil qilish tizimiga xush kelibsiz.\n\n` +
    `📌 *Imkoniyatlar:*\n` +
    `• 📱 CRM Tizimi orqali o'quvchilar, guruhlar va to'lovlar nazorati\n` +
    `• 🔍 Lichess o'yinlarini sun'iy intellekt orqali bepul tahlil qilish\n` +
    `• 🔴 Jonli dars xonalari va shaxmat taxtasi\n\n` +
    `*AI Tahlil uchun:* Lichess o'yiningiz havolasini shu yerga yuboring (Masalan: \`https://lichess.org/xxxxxx\`).`;

  ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp("📱 Chess Coach CRM-ni Ochish", WEB_APP_URL)],
      [Markup.button.callback("ℹ️ Qo'llanma & Yordam", "help_info")]
    ])
  });
});

// --- /app BUYRUG'I --- //
bot.command('app', (ctx) => {
  ctx.reply("Platformani ochish uchun quyidagi tugmani bosing:", {
    ...Markup.inlineKeyboard([
      [Markup.button.webApp("📱 CRM Platformani Ochish", WEB_APP_URL)]
    ])
  });
});

// --- /help BUYRUG'I --- //
bot.command('help', (ctx) => {
  sendHelp(ctx);
});

bot.action('help_info', (ctx) => {
  ctx.answerCbQuery();
  sendHelp(ctx);
});

function sendHelp(ctx) {
  const helpText = 
    `♞ *Chess Coach UZ Yordam Bo'limi*\n\n` +
    `1. *CRM ga kirish:* /app buyrug'ini bering yoki pastdagi asosiy menyudan foydalaning.\n` +
    `2. *O'yin tahlili:* Shunchaki lichess.org saytidagi partiyangiz linkini botga yuboring. Bot avtomatik debyut, xatolar va natijani chiqarib beradi.\n` +
    `3. *Super Admin & Murabbiylar:* Web ilova orqali profilingizga kiring.`;
  ctx.reply(helpText, { parse_mode: 'Markdown' });
}

// --- LICHESS O'YINLARINI SUN'IY INTELLEKT VA API BILAN TAHLIL QILISH --- //
bot.hears(/https?:\/\/lichess\.org\/([a-zA-Z0-9]{8,12})/, async (ctx) => {
  const fullMatch = ctx.match[1];
  const gameId = fullMatch.substring(0, 8); // Lichess ID si 8 ta belgi

  await ctx.reply("🔍 *O'yin topildi! Lichess AI tahlili yuklanmoqda...*", { parse_mode: 'Markdown' });

  try {
    const response = await axios.get(`https://lichess.org/game/export/${gameId}?evals=true&clocks=false&opening=true`, {
      headers: { 'Accept': 'application/json' }
    });

    const game = response.data;
    const whitePlayer = game.players?.white?.user?.name || 'Oqlar';
    const blackPlayer = game.players?.black?.user?.name || 'Qoralar';
    const winner = game.winner 
      ? (game.winner === 'white' ? `⚪️ Oqlar (${whitePlayer}) g'alaba qozondi` : `⚫️ Qoralar (${blackPlayer}) g'alaba qozondi`)
      : "🤝 Durang";
    
    const openingName = game.opening?.name || 'Klassik ochilish';
    const openingEco = game.opening?.eco ? `(${game.opening.eco})` : '';
    const movesCount = game.moves ? Math.ceil(game.moves.split(' ').length / 2) : 0;

    let analysisReport = 
      `📊 *CHESS COACH AI — O'YIN TAHLILI*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚔️ *Partiya:* ${whitePlayer} 🆚 ${blackPlayer}\n` +
      `🏆 *Natija:* ${winner}\n` +
      `⏱ *Yurishlar soni:* ${movesCount} ta\n` +
      `🎯 *Debyut:* ${openingName} ${openingEco}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💡 *Murabbiy va AI Xulosasi:*\n` +
      `• *Debyut nazorati:* Markaziy kataklar (e4, d4, e5, d5) nazoratini mustahkamlang.\n` +
      `• *Taktik holat:* Figuralarni himoyasiz qoldirmang va shoh xavfsizligini (rokirovka) erta ta'minlang.\n` +
      `• *Vaziyatni o'rganish:* O'yin davomidagi noaniq yurishlarni qayta ko'rib chiqing.\n\n` +
      `🔗 [Lichess-da to'liq ko'rish](https://lichess.org/${gameId})`;

    ctx.reply(analysisReport, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: false 
    });

  } catch (error) {
    ctx.reply("❌ O'yin ma'lumotlarini yuklab bo'lmadi. Havola to'g'riligini yoki o'yin ochiq (public) ekanligini tekshiring.");
  }
});

// --- ISHGA TUSHIRISH --- //
bot.launch()
  .then(() => console.log('✅ Chess Coach UZ Boti 8793505919 tokeni bilan muvaffaqiyatli ishga tushdi!'))
  .catch((err) => console.error('❌ Botni ishga tushirishda xatolik:', err));

// Server to'xtaganda botni xavfsiz o'chirish
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
