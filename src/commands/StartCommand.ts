import { Log, ParseMarkdown } from '@/utils';
import { Context, Markup } from 'telegraf';
import { User } from 'telegraf/typings/core/types/typegram';
import { loadUser } from '@/services';

export const StartCommand = async (context: Context): Promise<void> => {
  const { username: userTg, id } = context.from as User;
  Log(`User @${userTg} (${id}) started the bot!`);
  const { username, token } = await loadUser(id);
  const message = [
    `👋 Hola @${userTg}!`,
    '',
    ' Te enviaré una notificación de cada evento',
    'nuevo ocurrido en la plataforma de infoda.',
    '',
  ];
  if (username && token) {
    message.push(
      `  🤖 El bot se encuentra *activado*`,
      `  📌 Ingresaste como: _${username}_`,
    );
    context.replyWithMarkdownV2(ParseMarkdown(message.join('\n')));
    return;
  }
  message.push(' Para activarlo debes iniciar sesión. 📝');
  context.replyWithMarkdownV2(
    ParseMarkdown(message.join('\n')),
    Markup.inlineKeyboard([
      Markup.button.callback('Iniciar sesión', 'start_login'),
    ]),
  );
};
