type LogType = 'info' | 'warn' | 'error';

export const Log = (message: string, type: LogType = 'info'): void => {
  const date = new Date();
  const time = `\x1b[30;1m${date.getDate()}/${date.getMonth()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}\x1b[0m`;
  console.log(`[${type.toUpperCase()}] ${time} ${message}`);
};

export const ParseMarkdown = (text: string): string => {
  const reservedCharactersMarkdown = /[\\`{}#+\-.!]/g;
  return text.replace(reservedCharactersMarkdown, '\\$&');
};

export const areObjectsEqual = <
  T extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  },
>(
  obj1: T,
  obj2: T,
) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
};
