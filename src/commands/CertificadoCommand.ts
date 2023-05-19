import { loadUser } from '@/services';
import { ParseMarkdown } from '@/utils';
import { Scenes } from 'telegraf';
import { User } from 'telegraf/typings/core/types/typegram';

export const CertificadoCommand = async (
  context: Scenes.SceneContext<Scenes.SceneSessionData>,
): Promise<void> => {
  const { username: userTg, id } = context.from as User;
  context.deleteMessage();
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
  context.scene.enter('certificateGet');
};
