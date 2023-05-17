import { Log, ParseMarkdown } from '@/utils';
import { Context, Markup } from 'telegraf';
import { User } from '@/typegram';

export const StartCommand = (context: Context): void => {
  const { username, id } = context.from as User;
  Log(`User ${username} (${id}) started the bot!`);
  const message = [
    `👋 Hola @${username}!`,
    '',
    ' Te enviaré una notificación de cada evento',
    'nuevo ocurrido en la plataforma de infoda.',
    '',
    ' Para activarlo debes iniciar sesión. 📝',
  ];
  context.replyWithMarkdownV2(
    ParseMarkdown(message.join('\n')),
    Markup.inlineKeyboard([
      Markup.button.callback('Iniciar sesión', 'start_login'),
    ]),
  );
};
