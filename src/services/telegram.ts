import { BotContext } from '@api/index';

export async function errorHandler(error: unknown, ctx: BotContext) {
  console.error(error);
  ctx.reply('未知錯誤發生，請稍後再試');
}
