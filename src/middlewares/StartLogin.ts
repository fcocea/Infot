import { Context, Markup, Scenes } from 'telegraf';
import { Log, ParseMarkdown } from '@/utils';
import { message } from 'telegraf/filters';

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

PasswordScene.on(message('reply_to_message'), (ctx) => {
  if (!('text' in ctx.message.reply_to_message && 'text' in ctx.message))
    return;
  const id = ctx.message.reply_to_message.message_id;
  ctx.telegram.deleteMessage(ctx.chat.id, id);
  ctx.deleteMessage();
  const text = ctx.message.reply_to_message.text;
  const username = text.split(' ')[4].split('\n')[0];
  Log(`User ${username} (@${ctx.from.username}) is trying to login...`);
  const password = ctx.message.text;
  ctx.scene.leave();
});
