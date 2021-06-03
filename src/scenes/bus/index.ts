import { BotContext } from '@root/app';
import { createNavButtons } from '@services/telegram';
import { MenuTemplate, replyMenuToContext } from 'telegraf-inline-menu';
import {
  BusCompanyCode,
  getETAMessage,
  getRouteCompany,
} from '@services/bus/common';
import { readJSON } from '@services/io';
import TelegrafStatelessQuestion from 'telegraf-stateless-question';
import {
  getKMBETA,
  getKMBRouteList,
  getKMBRouteStopDetail,
} from '@services/bus/kmb';
import { BusCompany } from '@root/constant';
import {
  getBravoBusETA,
  getBravoBusRoute,
  getBravoBusRouteStopDetail,
  isCircular,
} from '@services/bus/bravo';
import {
  getNLBETA,
  getNLBETAMessage,
  listNLBRouteStop,
  listNLBSubRoute,
} from '@services/bus/nlb';
import {
  buildGMBSubRouteKeyboard,
  listGMBRouteStops,
  getRegion,
  retrieveGMBRoute,
} from '@services/bus/gmb';

enum Prefix {
  ENTRY_COMPANY = 'bus-company',
  ENTRY_ROUTE = 'bus-route',
  COMPANY = 'com',
  ROUTE_LIST = 'route-list',
  STOP = 'stop',
  ETA = 'eta',
  REFRESH = 'f5',
}

interface CompanyName {
  tc_name: string;
}

const COMPANY_NAME: Record<string, CompanyName> = readJSON('companies');

const etaMenu = new MenuTemplate<BotContext>(async (ctx) => {
  const [, company] = ctx.match!;
  const { route } = ctx.session.bus;
  let message = '';

  if (!route) {
    throw new Error('route is empty');
  }

  // Get ETA
  switch (company) {
    case BusCompany.KMB:
      // FIXME: This function will be run multiple time at every stage,
      // so this has to be idempotent
      const [, , routeList, kmbStopId] = ctx.match!;
      const [, serviceType] = routeList.split(',');
      const kmbEtas = await getKMBETA(route, serviceType, kmbStopId);
      message = getETAMessage(kmbEtas);

      break;
    case BusCompany.CTB:
    case BusCompany.NWFB:
      const [, , , bravoStopId] = ctx.match!;
      const bravoEtas = await getBravoBusETA(company, bravoStopId, route);
      message = getETAMessage(bravoEtas);

      break;
    case BusCompany.NLB:
      const [, , routeId, nlbStopId] = ctx.match!;
      const nlbEtas = await getNLBETA(routeId, nlbStopId);
      message = getNLBETAMessage(nlbEtas);

      break;
    default:
      ctx.reply('Not implemented!');
  }

  return message;
});
etaMenu.interact('重新整理 🔄', Prefix.REFRESH, {
  do: async (ctx) => {
    ctx.answerCbQuery('已重新整理');
    return true;
  },
});

const stopMenu = new MenuTemplate<BotContext>(async (ctx) => {
  return '選擇巴士站🚏';
});
stopMenu.chooseIntoSubmenu(Prefix.STOP, buildStopKeyboard, etaMenu, {
  columns: 2,
  maxRows: 40,
});

const routeListMenu = new MenuTemplate<BotContext>(async (ctx) => {
  return '選擇乘搭方向↔';
});
routeListMenu.chooseIntoSubmenu(
  Prefix.ROUTE_LIST,
  buildSubRouteKeyboard,
  stopMenu,
  {
    columns: 1,
  }
);

const companyMenu = new MenuTemplate<BotContext>(async (ctx) => {
  return '選擇巴士公司🚍';
});
companyMenu.chooseIntoSubmenu(
  Prefix.COMPANY,
  buildCompanyNameKeyboard,
  routeListMenu
);

const routeQuestion = new TelegrafStatelessQuestion<BotContext>(
  'bus-route',
  async (ctx) => {
    await handleRouteNumber(ctx);
    return;
  }
);

function buildCompanyNameKeyboard(ctx: BotContext) {
  return new Map<string, string>(
    ctx.session.bus.companies?.map((c) => [c, COMPANY_NAME[c].tc_name])
  );
}

async function buildSubRouteKeyboard(ctx: BotContext) {
  const [, company] = ctx.match!; // FIXME: maybe null if come from replyMenuToContext
  const { route } = ctx.session.bus;
  let keyboard: Array<[string, string]> = [];

  if (!route) {
    throw new Error('route is empty');
  }

  await fetchRouteList(ctx, company as any, route);

  switch (company) {
    case BusCompany.KMB:
      const routeList = ctx.session.bus.kmb.routeList!;
      keyboard = routeList.map((r) => [
        `${r.bound},${r.service_type}`,
        `${r.orig_tc} > ${r.dest_tc}`,
      ]);

      break;
    case BusCompany.CTB:
    case BusCompany.NWFB:
      const { orig_tc, dest_tc } = ctx.session.bus.bravo.route!;
      keyboard = [['O', dest_tc]];

      if (!ctx.session.bus.bravo.circular) {
        keyboard.push(['I', orig_tc]);
      }

      break;
    case BusCompany.NLB:
      const nlbRoutes = ctx.session.bus.nlb.routes!;
      keyboard = nlbRoutes.map((r) => [r.routeId, r.routeName_c]);

      break;
    case BusCompany.GMB_HKI:
    case BusCompany.GMB_KLN:
    case BusCompany.GMB_NT:
      const gmbRoutes = ctx.session.bus.gmb.routes!;
      keyboard = buildGMBSubRouteKeyboard(gmbRoutes);

      break;
    default:
      ctx.reply('Not implemented');
  }

  return new Map<string, string>(keyboard);
}

// TODO: Build the list of board based on ctx.session.route, ctx.session.company and related info
async function buildStopKeyboard(ctx: BotContext) {
  const { route } = ctx.session.bus;
  const [, company] = ctx.match!; // FIXME: maybe null if come from replyMenuToContext
  // const routeList = ctx.match!.pop();

  let keyboard: Array<[string, string]> = [];

  if (!route) {
    throw new Error('route is empty');
  }

  switch (company) {
    case BusCompany.KMB:
      const [, , routeList] = ctx.match!;
      const [bound, serviceType] = routeList!.split(',');
      const kmbStops =
        ctx.session.bus.kmb.stops ??
        (await getKMBRouteStopDetail(route, bound as any, serviceType));
      ctx.session.bus.kmb.stops = kmbStops;
      keyboard = kmbStops.map((s) => [s.stop, s.name_tc]);

      break;
    case BusCompany.CTB:
    case BusCompany.NWFB:
      const [, , direction] = ctx.match!;
      const bravoStops =
        ctx.session.bus.bravo.stops ??
        (await getBravoBusRouteStopDetail(company, route, direction as any));
      ctx.session.bus.bravo.stops = bravoStops;
      keyboard = bravoStops.map((s) => [s.stop, s.name_tc]);

      break;
    case BusCompany.NLB:
      const [, , nlbRouteId] = ctx.match!;
      const nlbStops =
        ctx.session.bus.nlb.stops ?? (await listNLBRouteStop(nlbRouteId));
      ctx.session.bus.nlb.stops = nlbStops;
      keyboard = nlbStops.map((s) => [s.stopId, s.stopName_c]);

      break;
    case BusCompany.GMB_HKI:
    case BusCompany.GMB_KLN:
    case BusCompany.GMB_NT:
      const [, , routeIdAndRouteSeq] = ctx.match!;
      const [gmbRouteId, routeSeq] = routeIdAndRouteSeq
        .split(',')
        .map((s) => parseInt(s));
      const gmbStops = await listGMBRouteStops(gmbRouteId, routeSeq); // FIXME: get from session
      keyboard = gmbStops.map((s) => [s.stop_id.toString(), s.name_tc]);

      break;
    default:
      ctx.reply('Not implemented');
  }

  return new Map<string, string>(keyboard);
}

async function handleRouteNumber(ctx: BotContext) {
  if (ctx.message && !('text' in ctx.message)) {
    ctx.reply('請回覆文字');
    return;
  }

  const route = ctx.message?.text.toUpperCase() ?? '';
  const companies = getRouteCompany(route);
  ctx.session = {
    __scenes: {},
    bus: { route, companies, kmb: {}, bravo: {}, nlb: {}, gmb: {} },
  };

  switch (companies.length) {
    case 0:
      await ctx.reply('無此路線❌');
      routeQuestion.replyWithMarkdown(ctx, '輸入巴士路線🚆');

      break;
    case 1:
    default:
      await replyMenuToContext(companyMenu, ctx, `/${Prefix.ENTRY_COMPANY}/`);

      break;
  }
}

// Only save route list to session
async function fetchRouteList(
  ctx: BotContext,
  company: BusCompanyCode,
  route: string
) {
  switch (company) {
    case BusCompany.KMB:
      if (!ctx.session.bus.kmb.routeList) {
        const routeList = await getKMBRouteList(route);
        ctx.session.bus.company = BusCompany.KMB;
        ctx.session.bus.kmb.routeList = routeList;
      }

      break;
    case BusCompany.CTB:
    case BusCompany.NWFB:
      if (!ctx.session.bus.bravo.circular) {
        ctx.session.bus.bravo.circular = await isCircular(company, route);
        ctx.session.bus.bravo.route = await getBravoBusRoute(company, route);
      }

      break;
    case BusCompany.NLB:
      ctx.session.bus.nlb.routes = await listNLBSubRoute(route);

      break;

    case BusCompany.GMB_HKI:
    case BusCompany.GMB_KLN:
    case BusCompany.GMB_NT:
      const region = getRegion(company);
      ctx.session.bus.gmb.routes = await retrieveGMBRoute(region, route);

      break;
    default:
      return ctx.reply('Not implemented❌');
  }
}

etaMenu.manualRow(createNavButtons());
stopMenu.manualRow(createNavButtons());
routeListMenu.manualRow(createNavButtons());
companyMenu.manualRow(createNavButtons());

export {
  companyMenu,
  routeListMenu,
  handleRouteNumber as handleRouteNumber,
  routeQuestion,
};
