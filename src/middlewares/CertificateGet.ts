import { Log, ParseMarkdown } from '@/utils';

import { UdecInfoda, loadUser } from '@/services';

import fs from 'fs';
import { Scenes } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';

interface Certificate {
  id: number;
  text: string;
}
const CertificateList: Certificate[] = [
  { id: 1, text: 'Asignación familiar' },
  { id: 2, text: 'Postulación a becas' },
  { id: 3, text: 'Pase escolar' },
  { id: 4, text: 'Pensión de orfandad' },
  { id: 5, text: 'Rebaja de pasajes' },
  { id: 6, text: 'Cajas de compensación' },
  { id: 7, text: 'Cantón de reclutamiento' },
  { id: 8, text: 'Fondos de pensiones' },
  { id: 9, text: 'El fondo nacional de salud' },
  { id: 10, text: 'Instituto de normalización previsional' },
  { id: 11, text: 'Isapre' },
  { id: 12, text: 'Municipalidades' },
  { id: 13, text: 'Trabajo de los padres' },
  { id: 14, text: 'Práctica de medicina abierta' },
  { id: 15, text: 'Crédito solidario' },
];
export const CertificateScene = new Scenes.BaseScene<Scenes.SceneContext>(
  'certificateGet',
);

const MAX_PER_PAGE = 3;
const TOTAL_PAGES = Math.ceil(CertificateList.length / MAX_PER_PAGE);

CertificateScene.enter(async (context) => {
  const id = context.from?.id;
  const userTg = context.from?.username;
  if (!id || !userTg) {
    Log('User id not found! (CertificateScene)', 'error');
    context.scene.leave();
    return;
  }
  const messages = [
    `  👋 Hey! @${userTg}, selecciona un certificado de`,
    'alumno regular, dependiendo de tu *finalidad*.',
    ``,
    '  📝 Este será _descargado y enviado_ a tu chat',
    'automáticamente.',
    ``,
    `  » *Página 1 de ${TOTAL_PAGES}*`,
    ` Puedes cancelar esta acción en cualquier momento`,
    `utilizando el comando /cancelar`,
  ];
  await context.replyWithMarkdownV2(ParseMarkdown(messages.join('\n')), {
    reply_markup: {
      inline_keyboard: [
        ...CertificateList.slice(0, MAX_PER_PAGE).map((certificate) => [
          {
            text: certificate.text,
            callback_data: `certificateGet:${certificate.id}`,
          },
        ]),
        [
          {
            text: ' ',
            callback_data: 'certificateGet:none',
          },
          {
            text: '»',
            callback_data: `certificateGet:next${2}`,
          },
        ],
      ],
    },
  });
});
CertificateScene.action(/certificateGet:(\d+|next|none)/, async (context) => {
  context.answerCbQuery();
  if (!('data' in context.callbackQuery)) return;
  if (!context.callbackQuery.data) return;
  const values = context.callbackQuery.data.split(':')[1];
  if (values === 'none') return;
  else if (values.includes('next')) {
    const page = parseInt(values.split('next')[1]);
    const userTg = context.from?.username;
    const messages = [
      `  👋 Hey! @${userTg}, selecciona un certificado de`,
      'alumno regular, dependiendo de tu *finalidad*.',
      ``,
      '  📝 Este será _descargado y enviado_ a tu chat',
      'automáticamente.',
      ``,
      `  » *Página ${page} de ${TOTAL_PAGES}*`,
      ` Puedes cancelar esta acción en cualquier momento`,
      `utilizando el comando /cancelar`,
    ];
    const backButton = [
      {
        text: page > 1 ? '« Anterior' : ' ',
        callback_data: `certificateGet:${
          page > 1 ? `next${page - 1}` : 'none'
        }`,
      },
    ];
    const nextButton = [
      {
        text: page < TOTAL_PAGES ? 'Siguiente »' : ' ',
        callback_data: `certificateGet:${
          page < TOTAL_PAGES ? `next${page + 1}` : 'none'
        }`,
      },
    ];

    await context.editMessageText(ParseMarkdown(messages.join('\n')), {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          ...CertificateList.slice(
            (page - 1) * MAX_PER_PAGE,
            page * MAX_PER_PAGE,
          ).map((certificate) => [
            {
              text: certificate.text,
              callback_data: `certificateGet:${certificate.id}`,
            },
          ]),
          [...backButton, ...nextButton],
        ],
      },
    });
  } else {
    const certificate = CertificateList.find((c) => c.id === parseInt(values));
    if (!certificate) return;
    const msg = await context.editMessageText(
      ParseMarkdown(
        [
          '  🔍 Un momento!, me encuentro buscando',
          'la información en *Infoda*.',
          '',
          `  👉 Certificado de: *${certificate.text}*`,
        ].join('\n'),
      ),
      {
        parse_mode: 'MarkdownV2',
      },
    );
    const { username, token } = await loadUser(context.from?.id || 0);
    if (!username || !token) {
      Log('User not found! (CertificateScene) | Firestore', 'error');
      context.editMessageText(
        [
          '  🤖 Ups! al parecer acaba de suceder.',
          'un error al procesar tu solicitud.',
        ].join('\n'),
      );
      setTimeout(() => {
        try {
          context.deleteMessage((msg as Message).message_id);
        } catch (e) {}
      }, 5000);
      context.scene.leave();
      return;
    }
    const udecAcces = new UdecInfoda({ username, token });
    await udecAcces.login();
    const certificateData = await udecAcces.getCertificate(certificate.id);
    if (!certificateData) {
      context.editMessageText(
        [
          '  🤖 Ups! al parecer acaba de suceder.',
          'un error al procesar tu solicitud.',
        ].join('\n'),
      );
      setTimeout(() => {
        try {
          context.deleteMessage((msg as Message).message_id);
        } catch (e) {}
      }, 5000);
    }
    context.editMessageText(
      ParseMarkdown(
        [
          '  🤖 ¡Listo! aquí tienes tu *certificado*.',
          '',
          '  Recuerda que puedes solicitar otro certificado',
          'utilizando el comando /certificado',
          '',
          '  ⚠️  Será *eliminado* en 3 minutos, por tu',
          'seguridad.',
        ].join('\n'),
      ),
      {
        parse_mode: 'MarkdownV2',
      },
    );
    const document = await context.sendDocument(
      {
        source: certificateData as string,
        filename: `${certificate.text}.pdf`,
      },
      { reply_to_message_id: (msg as Message).message_id },
    );
    setTimeout(() => {
      try {
        context.deleteMessage((msg as Message).message_id);
        context.deleteMessage((document as Message).message_id);
      } catch (e) {}
    }, 30000);
    fs.unlinkSync(certificateData as string);

    context.scene.leave();
  }
});

CertificateScene.command('cancelar', async (context) => {
  context.deleteMessage();
  const msg = await context.sendMessage(
    ParseMarkdown('👋 Acción cancelada *correctamente!*'),
    {
      parse_mode: 'MarkdownV2',
    },
  );
  setTimeout(() => {
    try {
      context.deleteMessage((msg as Message).message_id);
    } catch (e) {}
  }, 5000);
  context.scene.leave();
});
CertificateScene.on('message', (context) => {
  context.deleteMessage();
});
