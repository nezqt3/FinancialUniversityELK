import { Bot } from "@maxhub/max-bot-api";

const bot = new Bot(process.env.BOT_TOKEN); // Токен, полученный при регистрации бота в MAX
bot.start(); // Запускает получение обновлений
