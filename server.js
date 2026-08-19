const express = require('express');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const app = express();

const PORT = process.env.PORT || 10000;
const SERVER_URL =
  process.env.RENDER_EXTERNAL_URL || 'https://chess-crm.onrender.com';

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN Render Environment Variables ichida topilmadi!');
  process.exit(1);
}

const SUPER_ADMIN_USERNAME =
  (process.env.SUPER_ADMIN_USERNAME || 'jovliyev_bekzod')
    .replace('@', '')
    .toLowerCase();

const bot = new Telegraf(BOT_TOKEN);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

/*
==================================================
CHESS COACH UZ
TELEGRAM BOT + WEB SERVER
1-BOSQICH
==================================================
*/

// ==================================================
// ADMIN SOZLAMALARI
// ==================================================

const superAdmins = [SUPER_ADMIN_USERNAME];

// Hozircha vaqtinchalik xotirada.
// Keyingi bosqichda PostgreSQL bazasiga o'tkazamiz.
const botUsers = new Set();
const subAdmins = new Set();
const userState = new Map();

const botSettings = {
  welcomeText:
    `♞ *Assalomu alaykum!*\n\n` +
    `*Chess Coach UZ* tizimiga xush kelibsiz.\n\n` +
    `Quyidagi bo‘limlardan birini tanlang yoki Lichess o‘yin linkingizni ` +
    `tahlil uchun yuboring:`,

  helpText:
    `♞ *Chess Coach UZ Qo‘llanma*\n\n` +
    `1. Lichess o‘yin havolasini yuboring — hozircha asosiy ma’lumotlar olinadi.\n` +
    `2. CRM tizimiga kirish uchun tugmani bosing.\n` +
    `3. O‘quvchi kabineti uchun Student App tugmasidan foydalaning.\n` +
    `4. Savollar bo‘lsa Super Admin bilan bog‘laning.`
};

// ==================================================
// YORDAMCHI FUNKSIYALAR
// ==================================================

function normalizeUsername(username) {
  return String(username || '')
    .replace('@', '')
    .trim()
    .toLowerCase();
}

function isAdmin(ctx) {
  const username = normalizeUsername(ctx.from?.username);

  return (
    superAdmins.includes(username) ||
    subAdmins.has(username)
  );
}

function isSuperAdmin(ctx) {
  const username = normalizeUsername(ctx.from?.username);

  return superAdmins.includes(username);
}

function addBotUser(ctx) {
  if (ctx.from?.id) {
    botUsers.add(ctx.from.id);
  }
}

function getMainKeyboard(ctx) {
  const buttons = [
    [
      Markup.button.webApp(
        '👨‍🏫 CRM Boshqaruv Paneli',
        SERVER_URL
      )
    ],
    [
      Markup.button.webApp(
        '🎓 Shogird Kabineti (Student App)',
        `${SERVER_URL}?mode=student`
      )
    ],
    [
      Markup.button.callback(
        'ℹ️ Qo‘llanma',
        'help_info'
      )
    ]
  ];

  if (isAdmin(ctx)) {
    buttons.push([
      Markup.button.callback(
        '👑 Super Admin Paneli',
        'admin_panel'
      )
    ]);
  }

  return Markup.inlineKeyboard(buttons);
}

// ==================================================
// /START
// ==================================================

bot.start(async (ctx) => {
  addBotUser(ctx);

  try {
    await ctx.telegram.setChatMenuButton({
      chatId: ctx.chat.id,
      menuButton: {
        type: 'web_app',
        text: '📱 CRM-ni Ochish',
        web_app: {
          url: SERVER_URL
        }
      }
    });
  } catch (error) {
    console.error(
      'Menu button o‘rnatilmadi:',
      error.message
    );
  }

  return ctx.reply(
    botSettings.welcomeText,
    {
      parse_mode: 'Markdown',
      ...getMainKeyboard(ctx)
    }
  );
});

// ==================================================
// /APP
// ==================================================

bot.command('app', async (ctx) => {
  addBotUser(ctx);

  await ctx.reply(
    '📱 Chess Coach UZ platformasini ochish uchun tugmani bosing:',
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          '♟ Chess Coach UZ-ni Ochish',
          SERVER_URL
        )
      ]
    ])
  );
});

// ==================================================
// /HELP
// ==================================================

bot.command('help', async (ctx) => {
  addBotUser(ctx);

  await ctx.reply(
    botSettings.helpText,
    { parse_mode: 'Markdown' }
  );
});

// ==================================================
// ADMIN PANEL
// ==================================================

bot.command('admin', async (ctx) => {
  addBotUser(ctx);

  if (!isAdmin(ctx)) {
    return ctx.reply(
      '❌ Kechirasiz, sizda Admin huquqi yo‘q.'
    );
  }

  return openAdminPanel(ctx);
});

bot.action('admin_panel', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.answerCbQuery(
      'Ruxsat yo‘q!',
      { show_alert: true }
    );
  }

  await ctx.answerCbQuery();

  return openAdminPanel(ctx);
});

async function openAdminPanel(ctx) {
  const panelText =
    `👑 *SUPER ADMIN BOSHQARUV PANELI*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Bosh Admin:* @${SUPER_ADMIN_USERNAME}\n` +
    `👥 *Bot foydalanuvchilari:* ${botUsers.size} ta\n` +
    `🛡 *Qo‘shimcha Adminlar:* ${subAdmins.size} ta\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Kerakli boshqaruv amalini tanlang:`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback(
        '📢 Hammaga Xabar Yuborish',
        'admin_broadcast'
      )
    ],
    [
      Markup.button.callback(
        '✏️ Start Matnini O‘zgartirish',
        'admin_edit_welcome'
      )
    ],
    [
      Markup.button.callback(
        '✏️ Yordam Matnini O‘zgartirish',
        'admin_edit_help'
      )
    ],
    [
      Markup.button.callback(
        '➕ Yangi Admin Qo‘shish',
        'admin_add_admin'
      )
    ],
    [
      Markup.button.callback(
        '🗑 Adminlar Ro‘yxati',
        'admin_list_admins'
      )
    ],
    [
      Markup.button.callback(
        '◀️ Yopish',
        'back_to_main'
      )
    ]
  ]);

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(
        panelText,
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    } else {
      await ctx.reply(
        panelText,
        {
          parse_mode: 'Markdown',
          ...keyboard
        }
      );
    }
  } catch (error) {
    console.error(
      'Admin panel xatosi:',
      error.message
    );
  }
}

// ==================================================
// BROADCAST
// ==================================================

bot.action('admin_broadcast', async (ctx) => {
  if (!isAdmin(ctx)) return;

  await ctx.answerCbQuery();

  userState.set(
    ctx.from.id,
    'waiting_for_broadcast'
  );

  await ctx.reply(
    '📢 Reklama yoki rasmiy xabar matnini yuboring.\n\n' +
    'Bekor qilish uchun /cancel bosing.'
  );
});

// ==================================================
// START MATNINI O‘ZGARTIRISH
// ==================================================

bot.action('admin_edit_welcome', async (ctx) => {
  if (!isAdmin(ctx)) return;

  await ctx.answerCbQuery();

  userState.set(
    ctx.from.id,
    'waiting_for_welcome'
  );

  await ctx.reply(
    '✏️ Yangi Start xabarini yuboring:'
  );
});

// ==================================================
// HELP MATNINI O‘ZGARTIRISH
// ==================================================

bot.action('admin_edit_help', async (ctx) => {
  if (!isAdmin(ctx)) return;

  await ctx.answerCbQuery();

  userState.set(
    ctx.from.id,
    'waiting_for_help'
  );

  await ctx.reply(
    '✏️ Yangi Yordam matnini yuboring:'
  );
});

// ==================================================
// YANGI ADMIN QO‘SHISH
// ==================================================

bot.action('admin_add_admin', async (ctx) => {
  if (!isSuperAdmin(ctx)) {
    return ctx.answerCbQuery(
      'Faqat Super Admin bu amalni bajarishi mumkin!',
      { show_alert: true }
    );
  }

  await ctx.answerCbQuery();

  userState.set(
    ctx.from.id,
    'waiting_for_admin_user'
  );

  await ctx.reply(
    '➕ Yangi adminning Telegram usernameini yuboring.\n\n' +
    'Masalan:\n' +
    '@username\n\n' +
    'Bekor qilish uchun /cancel bosing.'
  );
});

// ==================================================
// ADMINLAR RO‘YXATI
// ==================================================

bot.action('admin_list_admins', async (ctx) => {
  if (!isAdmin(ctx)) return;

  await ctx.answerCbQuery();

  let list =
    `🛡 *Adminlar ro‘yxati*\n\n` +
    `👑 Super Admin: @${SUPER_ADMIN_USERNAME}\n`;

  if (subAdmins.size === 0) {
    list += '\nQo‘shimcha adminlar yo‘q.';
  } else {
    let index = 1;

    for (const admin of subAdmins) {
      list += `${index}. @${admin}\n`;
      index++;
    }
  }

  await ctx.reply(
    list,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '🗑 Qo‘shimcha Adminlarni Tozalash',
            'admin_clear_admins'
          )
        ],
        [
          Markup.button.callback(
            '◀️ Orqaga',
            'admin_panel'
          )
        ]
      ])
    }
  );
});

// ==================================================
// ADMINLARNI TOZALASH
// ==================================================

bot.action('admin_clear_admins', async (ctx) => {
  if (!isSuperAdmin(ctx)) {
    return ctx.answerCbQuery(
      'Faqat Super Admin!',
      { show_alert: true }
    );
  }

  subAdmins.clear();

  await ctx.answerCbQuery(
    'Qo‘shimcha adminlar tozalandi!'
  );

  return openAdminPanel(ctx);
});

// ==================================================
// ORQAGA
// ==================================================

bot.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery();

  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.error(
      'Xabarni o‘chirishda xatolik:',
      error.message
    );
  }
});

// ==================================================
// /CANCEL
// ==================================================

bot.command('cancel', async (ctx) => {
  userState.delete(ctx.from.id);

  await ctx.reply(
    '✅ Amal bekor qilindi.',
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          '👑 Admin Panel',
          'admin_panel'
        )
      ]
    ])
  );
});

// ==================================================
// HELP BUTTON
// ==================================================

bot.action('help_info', async (ctx) => {
  addBotUser(ctx);

  await ctx.answerCbQuery();

  await ctx.reply(
    botSettings.helpText,
    { parse_mode: 'Markdown' }
  );
});

// ==================================================
// ADMIN MATNLARI VA BROADCAST
// ==================================================

bot.on('text', async (ctx, next) => {
  addBotUser(ctx);

  const userId = ctx.from?.id;
  const text = ctx.message?.text || '';

  const state = userState.get(userId);

  // Lichess link bo‘lsa, keyingi handlerga beramiz
  if (/lichess\.org\//i.test(text)) {
    return next();
  }

  // -----------------------------------------------
  // BROADCAST
  // -----------------------------------------------

  if (
    state === 'waiting_for_broadcast' &&
    isAdmin(ctx)
  ) {
    userState.delete(userId);

    let count = 0;

    for (const targetUserId of botUsers) {
      try {
        await ctx.telegram.sendMessage(
          targetUserId,
          `📢 *Chess Coach UZ — Rasmiy Xabar*\n\n${text}`,
          { parse_mode: 'Markdown' }
        );

        count++;
      } catch (error) {
        // Foydalanuvchi botni bloklagan bo‘lishi mumkin.
      }
    }

    return ctx.reply(
      `✅ Xabar ${count} ta foydalanuvchiga yuborildi!`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '👑 Admin Panel',
            'admin_panel'
          )
        ]
      ])
    );
  }

  // -----------------------------------------------
  // WELCOME TEXT
  // -----------------------------------------------

  if (
    state === 'waiting_for_welcome' &&
    isAdmin(ctx)
  ) {
    botSettings.welcomeText = text;
    userState.delete(userId);

    return ctx.reply(
      '✅ Start matni yangilandi!',
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '👑 Admin Panel',
            'admin_panel'
          )
        ]
      ])
    );
  }

  // -----------------------------------------------
  // HELP TEXT
  // -----------------------------------------------

  if (
    state === 'waiting_for_help' &&
    isAdmin(ctx)
  ) {
    botSettings.helpText = text;
    userState.delete(userId);

    return ctx.reply(
      '✅ Yordam matni yangilandi!',
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '👑 Admin Panel',
            'admin_panel'
          )
        ]
      ])
    );
  }

  // -----------------------------------------------
  // NEW ADMIN
  // -----------------------------------------------

  if (
    state === 'waiting_for_admin_user' &&
    isSuperAdmin(ctx)
  ) {
    const newAdmin = normalizeUsername(text);

    if (!newAdmin) {
      return ctx.reply(
        '❌ Username noto‘g‘ri. Qaytadan yuboring.'
      );
    }

    if (
      newAdmin === SUPER_ADMIN_USERNAME
    ) {
      userState.delete(userId);

      return ctx.reply(
        'ℹ️ Bu foydalanuvchi allaqachon Super Admin.'
      );
    }

    subAdmins.add(newAdmin);
    userState.delete(userId);

    return ctx.reply(
      `✅ @${newAdmin} admin qilindi!`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '👑 Admin Panel',
            'admin_panel'
          )
        ]
      ])
    );
  }

  return next();
});

// ==================================================
// LICHESS O‘YIN TAHLILI
// ==================================================

bot.hears(
  /https?:\/\/lichess\.org\/([a-zA-Z0-9]{8,12})/i,
  async (ctx) => {
    const fullId = ctx.match[1];
    const gameId = fullId.substring(0, 8);

    await ctx.reply(
      '🔍 *Lichess o‘yini topildi!*\n\n' +
      'Hozircha o‘yin ma’lumotlari olinmoqda...',
      { parse_mode: 'Markdown' }
    );

    try {
      const response = await axios.get(
        `https://lichess.org/game/export/${gameId}`,
        {
          params: {
            moves: true,
            tags: true,
            clocks: false,
            evals: true,
            opening: true
          },
          headers: {
            Accept: 'application/json'
          },
          timeout: 15000
        }
      );

      const game = response.data;

      const whitePlayer =
        game.players?.white?.user?.name ||
        'Oqlar';

      const blackPlayer =
        game.players?.black?.user?.name ||
        'Qoralar';

      const winner = game.winner
        ? (
            game.winner === 'white'
              ? '⚪️ Oqlar g‘alaba qozondi'
              : '⚫️ Qoralar g‘alaba qozondi'
          )
        : '🤝 Durang';

      const openingName =
        game.opening?.name ||
        'Ochilish aniqlanmadi';

      const openingEco =
        game.opening?.eco
          ? ` (${game.opening.eco})`
          : '';

      const moveCount = game.moves
        ? game.moves.trim().split(/\s+/).length
        : 0;

      const report =
        `📊 *CHESS COACH UZ — O‘YIN MA’LUMOTI*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `⚔️ *Partiya:* ${whitePlayer} 🆚 ${blackPlayer}\n` +
        `🏆 *Natija:* ${winner}\n` +
        `♟ *Yurishlar:* ${moveCount} ta\n` +
        `🎯 *Debyut:* ${openingName}${openingEco}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🧠 *Eslatma:* haqiqiy chuqur AI/Stockfish tahlili ` +
        `keyingi bosqichda qo‘shiladi.\n\n` +
        `🔗 [Lichess-da ko‘rish](https://lichess.org/${gameId})`;

      await ctx.reply(
        report,
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        }
      );
    } catch (error) {
      console.error(
        'Lichess API xatosi:',
        error.message
      );

      await ctx.reply(
        '❌ Lichess o‘yinini yuklab bo‘lmadi.\n\n' +
        'Havola to‘g‘ri ekanini va o‘yin public ekanini tekshiring.'
      );
    }
  }
);

// ==================================================
// HEALTH CHECK
// ==================================================

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Chess Coach UZ',
    bot: 'running'
  });
});

// ==================================================
// TELEGRAM WEBHOOK
// ==================================================

const WEBHOOK_PATH = '/telegram/webhook/chess-coach-uz';

app.use(
  bot.webhookCallback(WEBHOOK_PATH)
);

// ==================================================
// WEB APP
// ==================================================

app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'index.html')
  );
});

// ==================================================
// SERVERNI ISHGA TUSHIRISH
// ==================================================

app.listen(
  PORT,
  '0.0.0.0',
  async () => {
    console.log(
      `🚀 Chess Coach UZ serveri ${PORT}-portda ishga tushdi.`
    );

    try {
      await bot.telegram.deleteWebhook({
        drop_pending_updates: true
      });

      await bot.telegram.setWebhook(
        `${SERVER_URL}${WEBHOOK_PATH}`
      );

      console.log(
        `✅ Telegram webhook o‘rnatildi: ${SERVER_URL}${WEBHOOK_PATH}`
      );

      console.log(
        `👑 Super Admin: @${SUPER_ADMIN_USERNAME}`
      );

      console.log(
        '🔐 BOT_TOKEN: Render Environment Variables orqali olinmoqda.'
      );
    } catch (error) {
      console.error(
        '❌ Telegram webhook xatosi:',
        error.message
      );
    }
  }
);

// ==================================================
// XATOLARNI USHLASH
// ==================================================

bot.catch((error) => {
  console.error(
    '❌ Telegram bot xatosi:',
    error
  );
});

process.on('unhandledRejection', (error) => {
  console.error(
    '❌ Unhandled Promise Rejection:',
    error
  );
});

process.on('uncaughtException', (error) => {
  console.error(
    '❌ Uncaught Exception:',
    error
  );
});
