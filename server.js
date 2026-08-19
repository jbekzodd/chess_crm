const express = require('express');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// ==================================================
// BOT TOKEN — FAQAT RENDER ENVIRONMENT'DAN
// ==================================================

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN Render Environment Variables ichida topilmadi!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

app.use(express.json());
app.use(express.static(__dirname));

// ==================================================
// RENDER URL
// ==================================================

const SERVER_URL =
  process.env.RENDER_EXTERNAL_URL ||
  'https://chess-crm.onrender.com';

// ==================================================
// ADMIN SOZLAMALARI
// ==================================================

const superAdmins = ['jovliyev_bekzod'];

let botUsers = new Set();
let subAdmins = [];
let userState = {};

let botSettings = {
  welcomeText:
    `♞ *Assalomu alaykum!*\n\n` +
    `*Chess Coach UZ* tizimiga xush kelibsiz.\n\n` +
    `Quyidagi bo'limlardan birini tanlang yoki lichess o'yin linkingizni tahlil uchun yuboring:`,

  helpText:
    `♞ *Chess Coach UZ Qo'llanma*\n\n` +
    `1. Lichess o'yin havolasini yuborib AI tahlil oling.\n` +
    `2. CRM tizimiga kirish uchun tugmani bosing.\n` +
    `3. Savollar bo'lsa @jovliyev_bekzod ga murojaat qiling.`
};

// ==================================================
// ADMIN TEKSHIRISH
// ==================================================

function isAdmin(ctx) {
  const user = ctx.from?.username?.toLowerCase();

  return (
    superAdmins.includes(user) ||
    subAdmins.includes(user)
  );
}

// ==================================================
// /START
// ==================================================

bot.start(async (ctx) => {

  if (ctx.from?.id) {
    botUsers.add(ctx.from.id);
  }

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

  } catch (e) {

    console.error(
      'Menu button xatosi:',
      e.message
    );

  }

  const buttons = [

    [
      Markup.button.webApp(
        "👨‍🏫 CRM Boshqaruv Paneli",
        SERVER_URL
      )
    ],

    [
      Markup.button.webApp(
        "🎓 Shogird Kabineti (Student App)",
        `${SERVER_URL}?mode=student`
      )
    ],

    [
      Markup.button.callback(
        "ℹ️ Qo'llanma",
        "help_info"
      )
    ]

  ];

  if (isAdmin(ctx)) {

    buttons.push([
      Markup.button.callback(
        "👑 Super Admin Paneli",
        "admin_panel"
      )
    ]);

  }

  return ctx.reply(
    botSettings.welcomeText,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    }
  );

});

// ==================================================
// ADMIN BUYRUG'I
// ==================================================

bot.command('admin', (ctx) => {

  if (!isAdmin(ctx)) {

    return ctx.reply(
      "❌ Kechirasiz, siz Super Admin emassiz!"
    );

  }

  openAdminPanel(ctx);

});

// ==================================================
// ADMIN PANEL
// ==================================================

bot.action('admin_panel', (ctx) => {

  if (!isAdmin(ctx)) {

    return ctx.answerCbQuery(
      "Ruxsat yo'q!",
      {
        show_alert: true
      }
    );

  }

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

    [
      Markup.button.callback(
        "📢 Hammaga Reklama / Xabar Yuborish",
        "admin_broadcast"
      )
    ],

    [
      Markup.button.callback(
        "✏️ Start Matnini O'zgartirish",
        "admin_edit_welcome"
      )
    ],

    [
      Markup.button.callback(
        "✏️ Yordam Matnini O'zgartirish",
        "admin_edit_help"
      )
    ],

    [
      Markup.button.callback(
        "➕ Yangi Admin Qo'shish",
        "admin_add_admin"
      )
    ],

    [
      Markup.button.callback(
        "🗑 Adminlar Ro'yxati / Tozalash",
        "admin_list_admins"
      )
    ],

    [
      Markup.button.callback(
        "◀️ Yopish",
        "back_to_main"
      )
    ]

  ]);

  if (ctx.callbackQuery) {

    ctx.editMessageText(
      panelText,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );

  } else {

    ctx.reply(
      panelText,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );

  }

}

// ==================================================
// BROADCAST
// ==================================================

bot.action('admin_broadcast', (ctx) => {

  if (!isAdmin(ctx)) return;

  ctx.answerCbQuery();

  userState[ctx.from.id] =
    'waiting_for_broadcast';

  ctx.reply(
    "📢 Reklama xabaringizni yozing (Bekor qilish uchun /cancel):"
  );

});

// ==================================================
// START MATNINI O'ZGARTIRISH
// ==================================================

bot.action('admin_edit_welcome', (ctx) => {

  if (!isAdmin(ctx)) return;

  ctx.answerCbQuery();

  userState[ctx.from.id] =
    'waiting_for_welcome';

  ctx.reply(
    "✏️ Yangi Start xabari matnini yuboring:"
  );

});

// ==================================================
// HELP MATNINI O'ZGARTIRISH
// ==================================================

bot.action('admin_edit_help', (ctx) => {

  if (!isAdmin(ctx)) return;

  ctx.answerCbQuery();

  userState[ctx.from.id] =
    'waiting_for_help';

  ctx.reply(
    "✏️ Yangi Yordam matnini yuboring:"
  );

});

// ==================================================
// YANGI ADMIN
// ==================================================

bot.action('admin_add_admin', (ctx) => {

  if (!isAdmin(ctx)) return;

  ctx.answerCbQuery();

  userState[ctx.from.id] =
    'waiting_for_admin_user';

  ctx.reply(
    "➕ Yangi admin Telegram username'ini yuboring (@ siz):"
  );

});

// ==================================================
// ADMINLAR RO'YXATI
// ==================================================

bot.action('admin_list_admins', (ctx) => {

  if (!isAdmin(ctx)) return;

  ctx.answerCbQuery();

  let list =
    `🛡 *Adminlar:* @jovliyev_bekzod\n`;

  subAdmins.forEach((adm, i) => {

    list += `${i + 1}. @${adm}\n`;

  });

  ctx.reply(
    list,
    {
      parse_mode: 'Markdown',

      ...Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "🗑 Adminlarni Tozalash",
            "admin_clear_admins"
          )
        ],

        [
          Markup.button.callback(
            "◀️ Orqaga",
            "admin_panel"
          )
        ]

      ])
    }
  );

});

// ==================================================
// ADMINLARNI TOZALASH
// ==================================================

bot.action('admin_clear_admins', (ctx) => {

  if (!isAdmin(ctx)) return;

  subAdmins = [];

  ctx.answerCbQuery(
    "Adminlar tozalandi!"
  );

  openAdminPanel(ctx);

});

// ==================================================
// PANELNI YOPISH
// ==================================================

bot.action('back_to_main', (ctx) => {

  ctx.answerCbQuery();

  ctx.deleteMessage();

});

// ==================================================
// /CANCEL
// ==================================================

bot.command('cancel', (ctx) => {

  delete userState[ctx.from.id];

  ctx.reply(
    "Bekor qilindi.",

    Markup.inlineKeyboard([

      [
        Markup.button.callback(
          "👑 Admin Panel",
          "admin_panel"
        )
      ]

    ])
  );

});

// ==================================================
// HELP
// ==================================================

bot.action('help_info', (ctx) => {

  ctx.answerCbQuery();

  ctx.reply(
    botSettings.helpText,
    {
      parse_mode: 'Markdown'
    }
  );

});

// ==================================================
// XABARLAR VA ADMIN HOLATLARI
// ==================================================

bot.on('text', async (ctx, next) => {

  if (ctx.from?.id) {
    botUsers.add(ctx.from.id);
  }

  const state =
    userState[ctx.from?.id];

  // Lichess link bo'lsa keyingi handlerga o'tadi
  if (
    ctx.message.text.includes(
      'lichess.org/'
    )
  ) {

    return next();

  }

  // ==================================================
  // BROADCAST
  // ==================================================

  if (
    state === 'waiting_for_broadcast' &&
    isAdmin(ctx)
  ) {

    delete userState[ctx.from.id];

    const msg =
      ctx.message.text;

    let count = 0;

    for (
      let userId of botUsers
    ) {

      try {

        await ctx.telegram.sendMessage(
          userId,

          `📢 *Rasmiy Xabar:*\n\n${msg}`,

          {
            parse_mode: 'Markdown'
          }
        );

        count++;

      } catch (e) {}

    }

    return ctx.reply(

      `✅ Xabar ${count} ta foydalanuvchiga yuborildi!`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "👑 Admin Panel",
            "admin_panel"
          )
        ]

      ])

    );

  }

  // ==================================================
  // WELCOME
  // ==================================================

  if (
    state === 'waiting_for_welcome' &&
    isAdmin(ctx)
  ) {

    botSettings.welcomeText =
      ctx.message.text;

    delete userState[ctx.from.id];

    return ctx.reply(

      "✅ Start matni yangilandi!",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "👑 Admin Panel",
            "admin_panel"
          )
        ]

      ])

    );

  }

  // ==================================================
  // HELP
  // ==================================================

  if (
    state === 'waiting_for_help' &&
    isAdmin(ctx)
  ) {

    botSettings.helpText =
      ctx.message.text;

    delete userState[ctx.from.id];

    return ctx.reply(

      "✅ Yordam matni yangilandi!",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "👑 Admin Panel",
            "admin_panel"
          )
        ]

      ])

    );

  }

  // ==================================================
  // YANGI ADMIN
  // ==================================================

  if (
    state === 'waiting_for_admin_user' &&
    isAdmin(ctx)
  ) {

    const newAdmin =
      ctx.message.text
        .replace('@', '')
        .toLowerCase()
        .trim();

    if (
      !subAdmins.includes(
        newAdmin
      )
    ) {

      subAdmins.push(
        newAdmin
      );

    }

    delete userState[ctx.from.id];

    return ctx.reply(

      `✅ @${newAdmin} admin qilindi!`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "👑 Admin Panel",
            "admin_panel"
          )
        ]

      ])

    );

  }

  return next();

});

// ==================================================
// LICHESS TAHLILI
// ==================================================

bot.hears(
  /lichess\.org\/([a-zA-Z0-9]{8,12})/,
  async (ctx) => {

    const match =
      ctx.match[1];

    const gameId =
      match.substring(0, 8);

    await ctx.reply(
      "🧠 *Chess Coach AI tahlil qilmoqda...*",
      {
        parse_mode: 'Markdown'
      }
    );

    try {

      const res =
        await axios.get(

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
              'Accept':
                'application/json'
            },

            timeout: 15000
          }

        );

      const game =
        res.data;

      const whitePlayer =
        game.players?.white?.user?.name ||
        'Oqlar';

      const blackPlayer =
        game.players?.black?.user?.name ||
        'Qoralar';

      const winner =
        game.winner
          ? (
              game.winner === 'white'
                ? `⚪️ Oqlar yutdi`
                : `⚫️ Qoralar yutdi`
            )
          : "🤝 Durang";

      const openingName =
        game.opening?.name ||
        "Klassik ochilish";

      const report =

        `📊 *CHESS COACH AI TAHLILI*\n` +

        `━━━━━━━━━━━━━━━━━━━━\n` +

        `⚔️ ${whitePlayer} 🆚 ${blackPlayer}\n` +

        `🏆 Natija: *${winner}*\n` +

        `🎯 Debyut: *${openingName}*\n` +

        `━━━━━━━━━━━━━━━━━━━━\n\n` +

        `🔗 [Lichess-da ochish](https://lichess.org/${gameId})`;

      await ctx.reply(

        report,

        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        }

      );

    } catch (err) {

      console.error(
        'Lichess API xatosi:',
        err.message
      );

      await ctx.reply(
        "❌ O'yin ma'lumotlarini tahlil qilib bo'lmadi."
      );

    }

  }
);

// ==================================================
// WEBHOOK
// ==================================================

const SECRET_PATH =
  `/telegraf-webhook-${BOT_TOKEN.slice(-10)}`;

app.use(
  bot.webhookCallback(
    SECRET_PATH
  )
);

// ==================================================
// WEB APP
// ==================================================

app.get('*', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'index.html'
    )
  );

});

// ==================================================
// SERVER
// ==================================================

app.listen(
  PORT,
  '0.0.0.0',
  async () => {

    console.log(
      `🚀 Web Server ${PORT}-portda faol!`
    );

    try {

      await bot.telegram.deleteWebhook({
        drop_pending_updates: true
      });

      await bot.telegram.setWebhook(
        `${SERVER_URL}${SECRET_PATH}`
      );

      console.log(
        `✅ Toza Webhook o'rnatildi: ${SERVER_URL}${SECRET_PATH}`
      );

    } catch (e) {

      console.error(
        "Webhook xatolik:",
        e.message
      );

    }

  }
);
