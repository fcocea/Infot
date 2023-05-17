import * as dotenv from 'dotenv';
dotenv.config();

interface ConfigProps {
  BotToken: string;
}

export const Config: ConfigProps = {
  BotToken: process.env.BOT_TOKEN as string,
};
