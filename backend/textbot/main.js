const { Bot, Keyboard } = require("@maxhub/max-bot-api");
require("dotenv").config();

const { BOT_TOKEN, BOT_USERNAME } = process.env;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not provided in backend/textbot/.env");
}

if (!BOT_USERNAME) {
  throw new Error("BOT_USERNAME is not provided in backend/textbot/.env");
}

const bot = new Bot(BOT_TOKEN);

bot.api.setMyCommands([
  {
    name: "start",
    description: "Начать",
  },
]);

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const buildStartPayload = (ctx) => {
  const payload = {
    userId: ctx.user?.user_id ?? null,
    firstName: ctx.user?.first_name ?? null,
    lastName: ctx.user?.last_name ?? null,
    ts: Date.now(),
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  return encoded.length > 512 ? "" : encoded;
};

const buildMiniAppLink = (ctx) => {
  const startParam = buildStartPayload(ctx);
  const deeplinkBase = `https://max.ru/${BOT_USERNAME}?startapp`;
  return startParam ? `${deeplinkBase}=${startParam}` : deeplinkBase;
};

bot.command("start", (ctx) => {
  const keyboard = Keyboard.inlineKeyboard([
    [
      Keyboard.button.link("🚀 Открыть мини-приложение", buildMiniAppLink(ctx)),
    ],
  ]);

  const text = `🎓 Привет! Я — MAX, ваш виртуальный помощник университета.

Я помогу вам:
💡 узнать информацию о приёме и поступлении;
📅 разобраться в расписании занятий и экзаменов;
📚 получить сведения о факультетах, кафедрах и преподавателях;
🏛️ найти нужные службы и подразделения университета;
❓ и просто ответить на любые вопросы о студенческой жизни!

Напишите, что вас интересует, — и я подскажу 😊`;

  return ctx.reply(text, { attachments: [keyboard] });
});

bot.start();
