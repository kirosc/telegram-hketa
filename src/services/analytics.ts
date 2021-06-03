import ua from 'universal-analytics';
import env from '@root/constant';
import { BotContext } from '@root/app';

interface Params {
  ec?: string;
  ea?: string;
  el?: string;
  ev?: string;
}

const PREFIX_MAPPING = {
  '/lrt/': 'lrt',
  '/mtr/': 'mtr',
  '/bus-route': 'bus',
};

// Send usage data to GA
export function send(ctx: BotContext, params: Params) {
  if (!env.GA_TID || !('callback_query' in ctx.update)) {
    return;
  }

  if (Object.entries(params).length !== 0) {
    const request = ctx.update.callback_query;
    const userid = request.from.id.toString();
    const user = ua(env.GA_TID, userid, { strictCidFormat: false }); // Using TG UID instead of a UUID
    user.event(params).send();
  }
}

/**
 * Capture start event like '/mtr/
 */
export function captureStartEvent(ctx: BotContext, next: () => Promise<void>) {
  if (
    !('callback_query' in ctx.update) ||
    !('data' in ctx.update.callback_query)
  ) {
    next();
    return;
  }

  const { data } = ctx.update.callback_query;

  if (!PREFIX_MAPPING[data]) {
    next();
    return;
  }

  const ec = PREFIX_MAPPING[data];
  const ea = 'start';

  send(ctx, { ec, ea });
  next();
}

export default { send, captureStartEvent };
