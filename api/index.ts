require('dotenv').config();
import '../src/config/alias';
import express, { json } from 'express';
import { Telegraf, session, Context, Scenes } from 'telegraf';
import { ENV, TG_TOKEN, TG_DEV_TOKEN } from '../lib/constants';
import { SceneSession } from 'telegraf/typings/scenes';
import lrtScene from '@scenes/lrt';
import { errorHandler } from '@services/telegram';

interface SessionData extends SceneSession {}

export interface BotContext extends Context, Scenes.SceneContext {
  match?: RegExpExecArray | undefined;
  session: SessionData;
}

const bot = new Telegraf<BotContext>(
  ENV === 'production' ? TG_TOKEN : TG_DEV_TOKEN
);

// Set up scenes
const stage = new Scenes.Stage<BotContext>([lrtScene], {
  ttl: 120,
});

bot.use(session());
// Use scene
bot.use(stage.middleware());

// Scenes commands
bot.command('lrt', async (ctx) => ctx.scene.enter('lrt'));

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

bot.start((ctx) => ctx.replyWithMarkdown('hello'));

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
