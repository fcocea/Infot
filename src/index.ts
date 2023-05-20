import { CertificadoCommand, MatriculaCommand, StartCommand } from '@/commands';

import {
  CertificateScene,
  CronCheck,
  LoginScene,
  PasswordScene,
} from '@/middlewares';

import { Config, Log } from '@/utils';

import cron from 'node-cron';
import { Scenes, Telegraf, session } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';

const { BotToken } = Config;

const bot: Telegraf<Scenes.SceneContext> = new Telegraf(BotToken);
const stage = new Scenes.Stage<Scenes.SceneContext>([
  LoginScene,
  PasswordScene,
  CertificateScene,
]);

bot.use(session());
bot.use(stage.middleware());

bot.start(StartCommand);
bot.command('matricula', MatriculaCommand);
bot.command('certificado', CertificadoCommand);
bot.action('start_login', (ctx) => ctx.scene.enter('usernameLogin'));
bot.on('callback_query', async (ctx) => {
  if (!('data' in ctx.callbackQuery)) return;
  if (!ctx.callbackQuery.data) return;
  if (ctx.callbackQuery.data.includes('certificateGet')) {
    const msg = await ctx.editMessageText(
      [
        '  🤖 Ups! al parecer acaba de suceder.',
        'un error al procesar tu solicitud.',
      ].join('\n'),
    );
    setTimeout(() => {
      try {
        ctx.deleteMessage((msg as Message).message_id);
      } catch (e) {}
    }, 5000);
  }
});
bot.launch();
Log('The bot has been started successfully!!');

cron.schedule('*/5 * * * *', () => CronCheck(bot.telegram));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
