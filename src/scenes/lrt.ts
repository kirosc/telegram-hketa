import { BotContext } from '@root/app';
import { readJSON } from '@services/io';
import { getETAMessage, getSchedule } from '@services/lrt';
import { createNavButtons } from '@services/telegram';
import { Scenes } from 'telegraf';
import { MenuMiddleware, MenuTemplate } from 'telegraf-inline-menu';

interface Zone {
  zone: string;
  stations: {
    station_id: number;
    eng_name: string;
    chi_name: string;
  }[];
}

const zones: Zone[] = readJSON('station-lrt');

const etaMenu = new MenuTemplate<BotContext>(displayETA);
const zoneMenu = new MenuTemplate<BotContext>((ctx) => '選擇區域🚆');
const stationMenu = new MenuTemplate<BotContext>((ctx) => '選擇車站🚉');

etaMenu.interact('重新整理 🔄', 'f5', {
  do: async (ctx) => {
    ctx.answerCbQuery('已重新整理');
    return true;
  },
});

zoneMenu.chooseIntoSubmenu('zone', buildZoneKeyboard, stationMenu, {
  columns: 2,
});

stationMenu.chooseIntoSubmenu('station', buildStationKeyboard, etaMenu, {
  columns: 2,
});

etaMenu.manualRow(createNavButtons());
zoneMenu.manualRow(createNavButtons());
stationMenu.manualRow(createNavButtons());

const middleware = new MenuMiddleware('/', zoneMenu);
const scene = new Scenes.BaseScene<BotContext>('lrt');

scene.enter((ctx) => middleware.replyToContext(ctx));
scene.leave((ctx) => ctx.reply('Bye'));

scene.use(middleware);

async function displayETA(ctx: BotContext) {
  const [, , stationId] = ctx.match!;
  const schedule = await getSchedule(parseInt(stationId));
  const message = getETAMessage(schedule);
  return message;
}

function buildZoneKeyboard(ctx: BotContext) {
  return new Map<string, string>(zones.map(({ zone }) => [zone, zone]));
}

/**
 * Build keyboard for stations in a zone
 *
 * @param ctx Telegraf Context
 * @returns keyboards
 */
function buildStationKeyboard(ctx: BotContext) {
  const [, name] = ctx.match!;
  const matchedZone = zones.find((zone) => zone.zone === name);

  if (!matchedZone) {
    throw new Error(`Cannot find zone with name ${name}`);
  }

  const keyboard = new Map<string, string>(
    matchedZone.stations.map(({ station_id, chi_name }) => [
      String(station_id),
      chi_name,
    ])
  );
  return keyboard;
}

export { scene as lrtScene, zoneMenu as lrtMenu };
