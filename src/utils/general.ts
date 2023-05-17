type LogType = 'info' | 'warn' | 'error';

export const Log = (message: string, type: LogType = 'info'): void => {
  const date = new Date();
  const time = `\x1b[30;1m${date.getDate()}/${date.getMonth()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}\x1b[0m`;
  console.log(`[${type.toUpperCase()}] ${time} ${message}`);
};

export const ParseMarkdown = (text: string): string => {
  const reservedCharactersMarkdown = /[\\`*_{}[\]()#+\-.!]/g;
  return text.replace(reservedCharactersMarkdown, '\\$&');
};
