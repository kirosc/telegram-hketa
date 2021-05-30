import { BotContext } from '@api/index';
import { createNavButtons } from '@services/telegram';
import { MenuTemplate, replyMenuToContext } from 'telegraf-inline-menu';
import { getRouteCompany } from '@services/bus/common';
import { readJSON } from '@services/io';
import TelegrafStatelessQuestion from 'telegraf-stateless-question';

interface CompanyName {
  tc_name: string;
}

const COMPANY_NAME: Record<string, CompanyName> = readJSON('companies');

const companyMenu = new MenuTemplate<BotContext>(async (ctx) => {
  return '選擇巴士公司🚍';
});

companyMenu.choose('company', buildCompanyNameKeyboard, {
  do: (ctx, key) => {
    console.log('company called');
    return false;
  },
});

const routeQuestion = new TelegrafStatelessQuestion<BotContext>(
  'bus-route',
  async (ctx, additionalState) => {
    handleRouteNumber(ctx);
    return;
  }
);

async function handleRouteNumber(ctx: BotContext) {
  if (ctx.message && !('text' in ctx.message)) {
    ctx.reply('請回覆文字');
    return;
  }

  const text = ctx.message?.text ?? '';
  const companies = getRouteCompany(text);

  switch (companies.length) {
    case 0:
      return ctx.reply('無此路線❌');
    case 1:
      ctx.state.foo = companies;
      console.log(ctx.state);
      return console.log(1, companies);
    default:
      ctx.session = {
        __scenes: {},
        companies,
      };
      await replyMenuToContext(companyMenu, ctx, '/bus-company/');
      return console.log(ctx.session);
  }
}

function buildCompanyNameKeyboard(ctx: BotContext) {
  return new Map<string, string>(
    ctx.session.companies?.map((c) => [c, COMPANY_NAME[c].tc_name])
  );
}

companyMenu.manualRow(createNavButtons());

export { companyMenu, handleRouteNumber, routeQuestion };
