import { Log, ParseMarkdown } from '@/utils';

import { UdecInfoda, getUsers, uploadGrades } from '@/services';

import { Grades } from '@/types';

import { Telegram } from 'telegraf';

const MessageGrades = (mark: Omit<Grades, 'codigoAsignatura'>) => [
  ' 👋 Hey! recibiste una nueva calificación',
  `en *${mark.nombreAsignatura}*`,
  '',
  ` - Nota: *${mark.nota}*`,
  ` - Tipo: ${mark.nombre}`,
  ` - Descripción: ${mark.descripcion}`,
  ` - Fecha: ${mark.fechaCreacion} ⏰\n`,
];

export const CronCheck = async (tg: Telegram) => {
  try {
    const users = await getUsers();
    let fullChecked = 0;
    if (!users.length) return;
    for (const user of users) {
      const { id, username, token } = user;
      Log(`Checking user ${username} (${id})`);
      try {
        const udecAcces = new UdecInfoda({ username, token });
        await udecAcces.login();
        const grades = await udecAcces.getGrades();
        if (!grades.length) continue;
        const unnotifiedGrades = await uploadGrades(id, grades);
        if (!unnotifiedGrades.length) continue;
        Log(`Sending ${unnotifiedGrades.length} grades to user ${username}`);
        for (const grade of unnotifiedGrades) {
          tg.sendMessage(id, ParseMarkdown(MessageGrades(grade).join('\n')), {
            parse_mode: 'MarkdownV2',
          });
        }
        fullChecked++;
      } catch (e) {
        Log(`Failed to check user ${username} (${id})`, 'error');
        continue;
      }
    }
    Log(
      `${fullChecked} users out of ${users.length} got updates on their platform`,
    );
  } catch (e) {
    Log('Failed to check users!', 'error');
  }
};
