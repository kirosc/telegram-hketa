const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');

const analytics = require('../analytics');
const buildKeyboard = require('../keyboard');
const constants = require('../constants');
const { isValidStation } = require('../helper');
const { getLRTETA } = require('../company/lrt');

const scene = new Telegraf.BaseScene(constants.LRT_SCENE_ID);

scene.command('bus', ctx => ctx.scene.enter(constants.BUS_SCENE_ID));
scene.on('text', async (ctx) => await readStation(ctx));

// Ask for zones
scene.enter(async ctx => {
  let keyboard = buildKeyboard.zones();

  ctx.reply(
    // '直接輸入站名或選擇區域🚆',
    '選擇區域🚆',
    Markup.inlineKeyboard(keyboard).extra()
  );

  analytics.send(ctx, { ec: 'lrt', ea: 'start' });
});

// Ask for a station of a zone
scene.action(constants.ZONES_ACTION_REGEX, ctx => {
  const [, zone] = ctx.update.callback_query.data.split(',');
  let keyboard = buildKeyboard.lrtStations(zone);

  ctx.reply(
    '請選擇車站🚉',
    Markup.inlineKeyboard(keyboard).extra()
  );
});

// Check for ETA
scene.action(constants.LRT_ETA_ACTION_REGEX, async ctx => {
  const [, stationId] = ctx.update.callback_query.data.split(',');
  const platforms = await getLRTETA(stationId);
  let str = '預計到站時間如下⌚';
  str += '\n------------------------';

  str += extractETA(platforms);
  ctx.reply(str);

  let params = {
    ec: 'lrt',
    ea: stationId,
  };
  analytics.send(ctx, params);
});


// Parse the input station name
async function readStation(ctx) {
  let station;
  if (ctx.update.message.text) {
    station = ctx.update.message.text;
  }
  const stationId = isValidStation(station);

  if (stationId) {
    const platforms = await getLRTETA(stationId);
    ctx.reply(extractETA(platforms));
  } else {
    ctx.reply('無此站名❌');
  }

  analytics.send(ctx, { ec: 'lrt', ea: 'start' });
}

function extractETA(platforms) {
  let str = '';
  for (const { id, etas } of platforms) {
    str += `\n月台 - ${id}\n`;
    str += formatETAMessage(etas);
  }
  return str;
}

function formatETAMessage(etas) {
  let str = '';
  if (!etas) {
    str += '沒有到站時間預報❌\n';
  }
  for (const { route_no, dest_ch, train_length, time_ch } of etas) {
    str += `${route_no} - ${dest_ch} - ${train_length}卡 - ${time_ch === '-' ? '即將離開' : time_ch}\n`;
  }
  str += '------------------------';
  return str;
}

module.exports = scene;
