import { Bot } from "@maxhub/max-bot-api";

const bot = new Bot(process.env.BOT_TOKEN);

bot.api.setMyCommands([
  {
    name: "start",
    description: "Начать",
  },
]);

bot.command("start", (req) => {
  return req.reply("Йоу");
});

bot.start();
