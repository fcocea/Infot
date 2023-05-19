import { Log, ParseMarkdown } from '@/utils';

import { UdecInfoda, loadUser } from '@/services';

import { Context } from 'telegraf';
import { Chat, User } from 'telegraf/typings/core/types/typegram';

export const MatriculaCommand = async (context: Context): Promise<void> => {
  const { username: userTg, id } = context.from as User;
  context.deleteMessage();
  Log(`User @${userTg} (${id}) executed the command /matricula`);
  const { username, token } = await loadUser(id);
  if (!username || !token) {
    context.replyWithMarkdownV2(
      ParseMarkdown(
        [
          ` 👋 Hey! @${userTg}, para poder realizar esta acción`,
          'es necesario que inicies sesión.',
          '',
          ' Para *iniciar sesión*, utiliza el comando /start',
        ].join('\n'),
      ),
    );
    return;
  }
  const msg = await context.replyWithMarkdownV2(
    ParseMarkdown(
      [
        ' 🔍 Un momento!, me encuentro buscando',
        'tú información en *Infoda*.',
      ].join('\n'),
    ),
  );
  const udecAcces = new UdecInfoda({ username, token });
  await udecAcces.login();
  const registrationNumber = await udecAcces.getRegistrationNumber();
  Log(`Sending registration number to user ${username} (@${userTg})`);
  context.telegram.editMessageText(
    (context.chat as Chat).id,
    msg.message_id,
    undefined,
    ParseMarkdown(`📝 Tu número de matricula es: *${registrationNumber}*`),
    {
      parse_mode: 'MarkdownV2',
    },
  );
};
