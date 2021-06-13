import { BotContext } from '@root/app';
import { createBackMainMenuButtons } from 'telegraf-inline-menu/dist/source';
import env from '@root/constant';
import * as Sentry from '@sentry/node';
import { Telegraf } from 'telegraf';

if (env.ENV === 'production') {
  Sentry.init({ dsn: `https://${env.SENTRY_TOKEN}@sentry.io/1873982` });
}

export async function errorHandler(error: unknown, ctx: BotContext) {
  console.error(error);
  ctx.reply('未知錯誤發生，請稍後再試');
  Sentry.captureException(error);
}

export function createNavButtons(
  backButtonText: string = '🔙 返回',
  mainMenuButtonText: string = '🔝 主目錄'
) {
  return createBackMainMenuButtons(backButtonText, mainMenuButtonText);
}

export async function sendMessageToUsers(
  bot: Telegraf<BotContext>,
  users: number[],
  msg: string
) {
  let successfulCount = 0,
    failedCount = 0;
  for (const user of users) {
    try {
      await bot.telegram.sendMessage(user, msg);
      successfulCount++;
      console.log(`Success: ${user}`);
    } catch (error) {
      failedCount++;
      console.log(`Failed: ${user}`);
    }
  }

  console.log(
    `Sent messages to users.\nSuccess: ${successfulCount} Failed: ${failedCount}`
  );
}
