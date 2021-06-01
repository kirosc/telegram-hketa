require('dotenv').config();
import '../src/config/alias';
import express, { json } from 'express';
import { Telegraf, session, Context, Scenes } from 'telegraf';
import env from '@src/constant';
import { SceneSession } from 'telegraf/typings/scenes';
import { lrtMenu, mtrMenu } from '@scenes/index';
import { errorHandler } from '@services/telegram';
import {
  deleteMenuFromContext,
  getMenuOfPath,
  MenuMiddleware,
  MenuTemplate,
} from 'telegraf-inline-menu';
import { companyMenu, routeQuestion } from '@scenes/bus';
import { BusCompanyCode } from '@services/bus/common';
import { KMBRoute } from '@services/bus/kmb';
import { BravoBusRoute } from '@services/bus/ctb-nwfb';
import { Settings } from 'luxon';
interface SessionData extends SceneSession {
  bus: {
    route?: string;
    companies?: any[];
    company?: BusCompanyCode;
    kmb: {
      routeList?: KMBRoute[];
    };
    bravo: {
      circular?: boolean;
      route?: BravoBusRoute;
    };
  };
}

export interface BotContext extends Context, Scenes.SceneContext {
  match?: RegExpExecArray | undefined;
  session: SessionData;
}

Settings.defaultZoneName = 'Asia/Hong_Kong';

const { ENV, TG_TOKEN, TG_DEV_TOKEN } = env;

const bot = new Telegraf<BotContext>(
  ENV === 'production' ? TG_TOKEN! : TG_DEV_TOKEN!
);

const mainMenu = new MenuTemplate<BotContext>((ctx) => '選擇查詢的交通工具🚆');

mainMenu.submenu('輕鐵', 'lrt', lrtMenu);
mainMenu.submenu('地鐵', 'mtr', mtrMenu);
// Need to be reachable
// mainMenu.submenu('bus-route', 'bus-route', routeListMenu, {
//   hide: (ctx) => {
//     return false;
//     return !ctx.session || !ctx.session.bus.companies;
//   },
// });
mainMenu.interact('巴士', 'bus-route', {
  do: async (ctx, path) => {
    const text = '輸入巴士路線🚆';
    const additionalState = getMenuOfPath(path);
    deleteMenuFromContext(ctx);
    routeQuestion.replyWithMarkdown(ctx, text, additionalState);
    return false;
  },
});
mainMenu.submenu('上次查詢的巴士路線', 'bus-company', companyMenu, {
  hide: (ctx) => {
    return !ctx.session || !ctx.session.bus.companies;
  },
});

// const stage = new Scenes.Stage<BotContext>([busScene], {
//   ttl: 120,
// });

const menuMiddleware = new MenuMiddleware('/', mainMenu);
bot.command('start', (ctx) => menuMiddleware.replyToContext(ctx));

// If it is similar to route number format
// bot.hears(/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/g, async ctx => await handleRouteNumber(ctx, menuMiddleware));

bot.use(session());
// bot.use(stage.middleware());
bot.use(menuMiddleware);
bot.use(routeQuestion.middleware());

bot.catch(errorHandler);

// bot.use(async (ctx, next) => {
//   console.log('Current session');
//   console.log(ctx.session);
//   await next();
// });

// bot.use(async (ctx, next) => {
//   if (!ctx.session) {
//     ctx.session = {
//       __scenes: {}
//     };
//   }
//   await next();
// });

// bot.command('rainbows', async ctx => {
//   let text;
//   if (ctx?.session?.language === 'de') {
//     text = 'Was machen Einhörner?';
//   } else {
//     text = 'What are unicorns doing?';
//     console.log(ctx.session);
//     ctx.session.language = 'de';
//     console.log(ctx.session);
//   }

//   // ctx.reply(JSON.stringify(ctx.session))
//   await ctx.replyWithHTML(
//     'What are unicorns doing?' + unicornQuestion.messageSuffixHTML(),
//     {
//       parse_mode: 'HTML',
//       reply_to_message_id: ctx.message.message_id,
//       reply_markup: {
//         force_reply: true,
//         inline_keyboard: [
//           [
//             {
//               text: 'companyNames[company].tc_name',
//               callback_data: 'unicorns'
//             },
//           ]
//         ]
//       }
//     }
//   )
// });

// bot.command('contribute', ctx => ctx.replyWithMarkdown(
//   `Make this bot better!
// [Open Source Project](https://github.com/kirosc/tg-hketa)`));

// bot.command('help', ctx => ctx.replyWithMarkdown(
//   `*可使用的指令*
// /bus - 查詢巴士路線
// /mtr - 查詢港鐵四條路線
// /contribute - 一同開發此bot`));

// bot.start(ctx => ctx.replyWithMarkdown(
//   `直接輸入巴士路線🔢
// 或輸入 /help 查看可用指令`
// ));

const app = express();
app.use(json());

// app.use(bot.webhookCallback('/message'));

app.use('/message', async function (req, res) {
  await bot.handleUpdate(req.body, res);
});

// Finally, start our server
app.listen(3000, function () {
  console.log('Telegram app listening on port 3000!');
});
