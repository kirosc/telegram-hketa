import { BotContext } from '@root/app';
import { createBackMainMenuButtons } from 'telegraf-inline-menu/dist/source';
import env from '@root/constant';
import * as Sentry from '@sentry/node';

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
