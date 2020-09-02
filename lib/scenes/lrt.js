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
      '直接輸入站名或選擇區域🚆',
      Markup.inlineKeyboard(keyboard).extra()
  );

  analytics.send(ctx, { ec: 'lrt', ea: 'start' });
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
  } else {
    ctx.reply('無此站名❌');
  }

  analytics.send(ctx, { ec: 'bus', ea: 'start' });
}

module.exports = scene;
