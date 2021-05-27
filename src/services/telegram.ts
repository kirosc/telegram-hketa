import { BotContext } from '@api/index';
import { createBackMainMenuButtons } from 'telegraf-inline-menu/dist/source';

export async function errorHandler(error: unknown, ctx: BotContext) {
  console.error(error);
  ctx.reply('未知錯誤發生，請稍後再試');
}

export function createNavButtons(
  backButtonText: string = '🔙 返回',
  mainMenuButtonText: string = '🔝 主目錄'
) {
  return createBackMainMenuButtons(backButtonText, mainMenuButtonText);
}
