const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TOKEN = '8793505919:AAHeDxho7-sjluGN8u4UyO_CtH-ZlfNfGdw';
const bot = new TelegramBot(TOKEN, { polling: true });

const DB_FILE = path.join(__dirname, 'database.json');

// Boshlang'ich baza strukturasi
function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      admin: { username: 'bekzod', password: 'jovliyev75828' },
      centers: [
        {
          id: 'apex_1',
          name: 'Apex Chess Academy',
          ownerName: 'Bekzod Jovliyev',
          phone: '+998901234567',
          rooms: ['1-xona', '2-xona', '3-xona'],
          coaches: [],
          students: [],
          archive: []
        }
      ],
      homeworks: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// REST API
app.get('/api/data', (req, res) => {
  res.json(getDB());
});

app.post('/api/save', (req, res) => {
  saveDB(req.body);
  res.json({ success: true });
});

// TELEGRAM BOT BUYRUQLARI
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = `https://${req?.headers?.host || 'jbekzodd.github.io/chess_crm'}`;

  bot.sendMessage(chatId, `Assalomu alaykum, <b>Apex Chess Academy</b> tizimiga xush kelibsiz! ♟️\n\nQuyidagi tugma orqali CRM platformasini ochishingiz mumkin:`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: "📲 CRM Ilovani Ochish", web_app: { url: "https://jbekzodd.github.io/chess_crm/" } }]
      ]
    }
  });
});

// Uy vazifalarini (rasm, video, hujjat) qabul qilish
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (msg.photo || msg.video || msg.document) {
    const db = getDB();
    const taskEntry = {
      id: Date.now(),
      chatId,
      user: msg.from.first_name + (msg.from.last_name ? ' ' + msg.from.last_name : ''),
      date: new Date().toISOString(),
      type: msg.photo ? 'Rasm' : msg.video ? 'Video' : 'Fayl',
      status: 'Topshirildi'
    };
    db.homeworks.push(taskEntry);
    saveDB(db);

    bot.sendMessage(chatId, `✅ <b>Vazifangiz qabul qilindi!</b>\nMurabbiy tez orada tekshirib baholaydi.`, { parse_mode: 'HTML' });
  }
});

// Har kuni 09:00 va 15:00 da dars va davomat eslatmasi
cron.schedule('0 9,15 * * *', () => {
  console.log('Eslatmalar yuborilmoqda...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishlamoqda`));
