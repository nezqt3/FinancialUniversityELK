const { Bot } = require("@maxhub/max-bot-api");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);

bot.api.setMyCommands([
  {
    name: "start",
    description: "Начать",
  },
]);

bot.command("start", (crx) => {
  return crx.reply("Йоу");
});

bot.start();
