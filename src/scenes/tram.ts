import { BotContext } from '@root/app';
import { createNavButtons } from '@services/telegram';
import { MenuTemplate } from 'telegraf-inline-menu';
import { readJSON } from '@services/io';
import { getTramETA, getTramETAMessage } from '@services/tram';

interface Headway {
  direction: string;
  stations: {
    code: string;
    name: string;
  }[];
}

const etaMenu = new MenuTemplate<BotContext>(displayETA);
const directionMenu = new MenuTemplate<BotContext>((ctx) => '選擇方向🚆');
const stationMenu = new MenuTemplate<BotContext>((ctx) => '選擇車站🚉');

etaMenu.interact('重新整理 🔄', 'f5', {
  do: async (ctx) => {
    ctx.answerCbQuery('已重新整理');
    return true;
  },
});

directionMenu.chooseIntoSubmenu('direction', buildDirectionMenu, stationMenu, {
  columns: 1,
});

stationMenu.chooseIntoSubmenu('station', buildStationKeyboard, etaMenu, {
  columns: 2,
  maxRows: 50,
});

async function displayETA(ctx: BotContext) {
  const [, , stopCode] = ctx.match!;
  const etas = await getTramETA(stopCode);
  const message = getTramETAMessage(etas);

  return message;
}

etaMenu.manualRow(createNavButtons());
directionMenu.manualRow(createNavButtons());
stationMenu.manualRow(createNavButtons());

const headways: Array<Headway> = readJSON('station-tram');

function buildDirectionMenu(ctx: BotContext) {
  return new Map([
    ['W', '西行'],
    ['E', '東行'],
  ]);
}

function buildStationKeyboard(ctx: BotContext) {
  const [, direction] = ctx.match!;
  const headway = headways.find((h) => h.direction === direction)!;

  return new Map(headway.stations.map((s) => [s.code, s.name]));
}

export { directionMenu as tramMenu };
