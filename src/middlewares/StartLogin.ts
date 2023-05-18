import { Context, Markup, Scenes } from 'telegraf';
import { Log, ParseMarkdown } from '@/utils';
import { message } from 'telegraf/filters';
import { UdecInfoda } from '@/services';

export const LoginScene = new Scenes.BaseScene<Scenes.SceneContext>(
  'usernameLogin',
);
export const PasswordScene = new Scenes.BaseScene<Scenes.SceneContext>(
  'passwordLogin',
);

const CancelFooter = [
  '',
  ' Para cancelar el inicio de sesión, utiliza',
  'el comando /cancelar',
  '',
];

const StartLogin = (context: Context) => {
  context.answerCbQuery();
  context.deleteMessage();
  const messages = [
    '',
    ' 👉 Ingresa el nombre de tu cuenta - UdeC',
    ...CancelFooter,
  ];
  context.replyWithMarkdownV2(
    ParseMarkdown(messages.join('\n')),
    Markup.forceReply(),
  );
};

const CancelLogin = (context: Context) => {
  context.deleteMessage();
  const messages = [
    '',
    ' 🚧 *Cancelaste* el inicio de sesión',
    '',
    ' 👉 Para iniciar sesión nuevamente, utiliza',
    'el comando /start',
  ];
  context.replyWithMarkdownV2(messages.join('\n'));
};

const InterruptLogin = (
  context: Scenes.SceneContext<Scenes.SceneSessionData>,
) => {
  context.deleteMessage();
  const msg = [
    ' ❌ Inicio de sesión *cancelado*!',
    '',
    ' ⚠️ Debes responder al mensaje que te envié',
    'para iniciar sesión.',
    '',
    ' 👉 Para iniciar sesión nuevamente, utiliza',
    'el comando /start',
  ];
  context.replyWithMarkdownV2(ParseMarkdown(msg.join('\n')));
  context.scene.leave();
};

LoginScene.enter(StartLogin);

LoginScene.command('cancelar', (ctx) => {
  CancelLogin(ctx);
  ctx.scene.leave();
});
LoginScene.command('cancel', (ctx) => {
  CancelLogin(ctx);
  ctx.scene.leave();
});

PasswordScene.command('cancelar', (ctx) => {
  CancelLogin(ctx);
  ctx.scene.leave();
});
PasswordScene.command('cancel', (ctx) => {
  CancelLogin(ctx);
  ctx.scene.leave();
});

LoginScene.on(message('reply_to_message'), (ctx) => {
  if (!('text' in ctx.message)) return;
  const id = ctx.message.reply_to_message.message_id;
  ctx.telegram.deleteMessage(ctx.chat.id, id);
  ctx.deleteMessage();
  const text = ctx.message.text;
  const msg = [
    `  Estas intentando acceder como: *${text}*`,
    '',
    ' 👉 Ingresa la contraseña de tu cuenta - UdeC',
    ...CancelFooter,
  ];
  ctx.replyWithMarkdownV2(ParseMarkdown(msg.join('\n')), Markup.forceReply());
  ctx.scene.enter('passwordLogin');
});
LoginScene.on('message', InterruptLogin);

PasswordScene.on(message('reply_to_message'), async (ctx) => {
  if (!('text' in ctx.message.reply_to_message && 'text' in ctx.message))
    return;
  const id = ctx.message.reply_to_message.message_id;
  ctx.telegram.deleteMessage(ctx.chat.id, id);
  ctx.deleteMessage();
  const text = ctx.message.reply_to_message.text;
  const username = text.split(' ')[4].split('\n')[0];
  Log(`User ${username} (@${ctx.from.username}) is trying to login...`);
  const password = ctx.message.text;
  const udecAcces = new UdecInfoda({ username, password });
  ctx.replyWithMarkdownV2(
    ParseMarkdown(
      `🕵️‍♂️ Un momento! me encuentro *verificando* \ntus credenciales...`,
    ),
  );
  const login = await udecAcces.login();
  if (login) {
    Log(`User ${username} (@${ctx.from.username}) has logged in successfully!`);
    const messages = [
      ` 👋 Ingreaste correctamente como: *${username}*`,
      '',
      ' Revisaré periódicamente si hay nuevos eventos',
      'en la plataforma de _infoda_ y te notificaré',
      'si es que hay alguno.',
    ];
    ctx.replyWithMarkdownV2(ParseMarkdown(messages.join('\n')));
    ctx.scene.leave();
    return;
  }

  Log(`User ${username} (@${ctx.from.username}) has failed to login!`);
  const messages = [
    '',
    ' ⚠️ No lograste iniciar sesión, verifica',
    'que los datos ingresados sean correctos.',
    '',
    ' Si el problema persiste, envía un mensaje',
    'a @fcocea',
    '',
    ' 👉 Para iniciar sesión nuevamente, utiliza',
    'el comando /start',
  ];
  ctx.replyWithMarkdownV2(ParseMarkdown(messages.join('\n')));
});
PasswordScene.on('message', InterruptLogin);
