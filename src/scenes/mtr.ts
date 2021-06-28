import { BotContext } from '@root/app';
import { MTRSchedule } from '@interfaces/mtr';
import { getETA, getLines, getSchedule } from '@services/mtr';
import { createNavButtons } from '@services/telegram';
import { Scenes } from 'telegraf';
import { MenuMiddleware, MenuTemplate } from 'telegraf-inline-menu';

const etaMenu = new MenuTemplate<BotContext>(displayETA);
const lineMenu = new MenuTemplate<BotContext>((ctx) => '選擇路綫🚆');
const stationMenu = new MenuTemplate<BotContext>((ctx) => '選擇車站🚉');

etaMenu.interact('重新整理 🔄', 'f5', {
  do: async (ctx) => {
    ctx.answerCbQuery('已重新整理');
    return true;
  },
});

lineMenu.chooseIntoSubmenu('mtr-line', buildLineKeyboard, stationMenu, {
  columns: 1,
});

stationMenu.chooseIntoSubmenu('mtr-station', buildStationKeyboard, etaMenu, {
  columns: 2,
  maxRows: 15,
});

async function displayETA(ctx: BotContext) {
  const [, line, sta] = ctx.match!;
  const [schedule, slug] = await getSchedule(line, sta);

  if (schedule.status === 0) {
    handleMTRError(ctx, schedule);
    return '未能提供到站時間預告';
  }

  const message = getETA(schedule, slug);
  return message;
}

etaMenu.manualRow(createNavButtons());
lineMenu.manualRow(createNavButtons());
stationMenu.manualRow(createNavButtons());

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

export { scene as mtrScene, lineMenu as mtrMenu };
