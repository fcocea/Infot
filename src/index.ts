import { Telegraf, session, Scenes } from 'telegraf';
import { Config, Log } from '@/utils';
import { StartCommand } from '@/commands';
import { LoginScene, PasswordScene } from '@/middlewares';

const { BotToken } = Config;

const bot: Telegraf<Scenes.SceneContext> = new Telegraf(BotToken);
const stage = new Scenes.Stage<Scenes.SceneContext>([
  LoginScene,
  PasswordScene,
]);

bot.use(session());
bot.use(stage.middleware());

bot.start(StartCommand);
bot.action('start_login', (ctx) => {
  ctx.scene.enter('usernameLogin');
});

bot.launch();
Log('The bot has been started successfully!!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
