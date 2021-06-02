require('dotenv').config();
import './config/alias';
import express, { json } from 'express';
import { Telegraf, session, Context, Scenes } from 'telegraf';
import { SceneSession } from 'telegraf/typings/scenes';
import env from '@root/constant';
import { lrtMenu, mtrMenu } from '@scenes/index';
import { errorHandler } from '@services/telegram';
import { MenuMiddleware, MenuTemplate } from 'telegraf-inline-menu';
import { companyMenu, routeQuestion } from '@scenes/bus';
import { BusCompanyCode } from '@services/bus/common';
import { KMBRoute, KMBRouteStop } from '@services/bus/kmb';
import {
  BravoBusRoute,
  BravoBusRouteStop,
  BravoBusStop,
} from '@services/bus/bravo';
import { Settings } from 'luxon';
import { NLBRoute, NLBStop } from '@services/bus/nlb';
import { BusStop } from '@interfaces/bus';
interface SessionData extends SceneSession {
  bus: {
    route?: string;
    companies?: any[];
    company?: BusCompanyCode;
    kmb: {
      routeList?: KMBRoute[];
      stops?: (KMBRouteStop & BusStop)[];
    };
    bravo: {
      circular?: boolean;
      route?: BravoBusRoute;
      stops?: (BravoBusRouteStop & BravoBusStop)[];
    };
    nlb: {
      routes?: NLBRoute[];
      stops?: NLBStop[];
    };
  };
}

export interface BotContext extends Context, Scenes.SceneContext {
  match?: RegExpExecArray | undefined;
  session: SessionData;
}

Settings.defaultZoneName = 'Asia/Hong_Kong';

const { PORT, ENV, TG_TOKEN, TG_DEV_TOKEN } = env;

const bot = new Telegraf<BotContext>(
  ENV === 'production' ? TG_TOKEN! : TG_DEV_TOKEN!
);

const mainMenu = new MenuTemplate<BotContext>((ctx) => '選擇查詢的交通工具🚆');

mainMenu.submenu('輕鐵', 'lrt', lrtMenu);
mainMenu.submenu('地鐵', 'mtr', mtrMenu);
mainMenu.interact('巴士', 'bus-route', {
  do: async (ctx) => {
    routeQuestion.replyWithMarkdown(ctx, '輸入巴士路線🚆');
    return false;
  },
});
// Need to be reachable. it will be validate at each subpath
mainMenu.submenu('上次查詢的巴士路線', 'bus-company', companyMenu, {
  hide: (ctx) => !ctx.match || ctx.match['input'] === '/',
});

const menuMiddleware = new MenuMiddleware('/', mainMenu);
bot.start((ctx) => menuMiddleware.replyToContext(ctx));

bot.use(session());
bot.use(menuMiddleware);
bot.use(routeQuestion.middleware());

bot.catch(errorHandler);

bot.command('contribute', (ctx) =>
  ctx.replyWithMarkdown(
    `Make this bot better!
[Open Source Project](https://github.com/kirosc/tg-hketa)`
  )
);

bot.command('help', (ctx) =>
  ctx.replyWithMarkdown(
    `*可使用的指令*
/start - 開始查詢
/contribute - 一同開發此bot`
  )
);

const app = express();
app.use(json());

// app.use(bot.webhookCallback('/message'));

app.use('/message', async function (req, res) {
  await bot.handleUpdate(req.body, res);
});

// Finally, start our server
const port = PORT ?? 3000;
app.listen(port, function () {
  console.log(`Telegram app listening on port ${port}!`);
});
