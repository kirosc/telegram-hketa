import { BotContext } from '@api/index';
import { MTRSchedule } from '@interfaces/mtr';
import { getETA, getLines, getSchedule } from '@services/mtr';
import { Scenes } from 'telegraf';
import { MenuMiddleware, MenuTemplate } from 'telegraf-inline-menu';

const lineMenu = new MenuTemplate<BotContext>((ctx) => '選擇路綫🚆');
const stationMenu = new MenuTemplate<BotContext>((ctx) => '選擇車站🚉');

stationMenu.choose('mtr-station', buildStationKeyboard, {
  do: async (ctx, key) => {
    const [, line] = ctx.match!;
    const sta = key;
    const [schedule, slug] = await getSchedule(line, sta);

    if (schedule.status === 0) {
      handleMTRError(ctx, schedule);
      return false;
    }

    const message = getETA(schedule, slug);
    ctx.answerCbQuery();
    ctx.reply(message);
    return false;
  },
  columns: 2,
});
stationMenu.interact('⬅️ 返回', 'back', {
  do: async () => {
    return '..';
  },
});

lineMenu.chooseIntoSubmenu('mtr-line', buildLineKeyboard, stationMenu, {
  columns: 1,
});

const middleware = new MenuMiddleware('/', lineMenu);
const scene = new Scenes.BaseScene<BotContext>('mtr');

scene.enter((ctx) => middleware.replyToContext(ctx));
scene.leave((ctx) => ctx.reply('Bye'));

scene.use(middleware);

function buildLineKeyboard(ctx: BotContext) {
  const lines = getLines();
  return new Map(Object.entries(lines).map(([name, val]) => [name, val.tc]));
}

function buildStationKeyboard(ctx: BotContext) {
  const [, line] = ctx.match!;
  const lines = getLines();
  const { stations } = lines[line];

  return new Map(stations.map((s) => [s.code, s.tc]));
}

function handleMTRError(ctx: BotContext, schedule: MTRSchedule) {
  const { message, url } = schedule;
  ctx.reply(
    message,
    url
      ? {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '詳細資料',
                  url,
                },
              ],
            ],
          },
        }
      : undefined
  );
}

export { scene as mtrScene };
