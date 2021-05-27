import { BotContext } from '@api/index';
import { readJSON } from '@services/io';
import { getETA, getSchedule } from '@services/lrt';
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

const zoneMenu = new MenuTemplate<BotContext>((ctx) => '選擇區域🚆');
const stationMenu = new MenuTemplate<BotContext>((ctx) => '選擇車站🚉');

stationMenu.choose('lrt-station', buildStationKeyboard, {
  do: async (ctx, key) => {
    const stationId = parseInt(key);
    const schedule = await getSchedule(stationId);
    const message = getETA(schedule);
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

zoneMenu.chooseIntoSubmenu('lrt-zone', buildZoneKeyboard, stationMenu, {
  columns: 2,
});
zoneMenu.interact('Main Menu', 'leave', {
  do: async (ctx) => {
    await ctx.scene.leave();
    return true;
  },
});

const middleware = new MenuMiddleware('/', zoneMenu);
const scene = new Scenes.BaseScene<BotContext>('lrt');

scene.enter((ctx) => middleware.replyToContext(ctx));
scene.leave((ctx) => ctx.reply('Bye'));

scene.use(middleware);

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

export { scene as lrtScene };
