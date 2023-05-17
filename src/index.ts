import { Telegraf, Context } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { Config, Log } from '@/utils';
import { StartCommand } from '@/commands';

const { BotToken } = Config;

const bot: Telegraf<Context<Update>> = new Telegraf(BotToken);
bot.start(StartCommand);

bot.launch();
Log('The bot has been started successfully!!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
