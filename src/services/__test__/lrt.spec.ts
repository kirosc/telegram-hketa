import { LRTPlatform, LRTRoute, LRTSchedule } from '@interfaces/lrt';
import { getETA, getPlatformMessage, getRouteMessage } from '@services/lrt';

describe('test can getETA', () => {
  const schedule: LRTSchedule = {
    platform_list: [
      {
        route_list: [
          {
            train_length: 1,
            arrival_departure: 'A',
            dest_en: 'Yuen Long',
            dest_ch: '元朗',
            time_en: 'Arriving',
            time_ch: '即將抵達',
            route_no: '610',
            stop: 0,
          },
          {
            train_length: 1,
            arrival_departure: 'A',
            dest_en: 'Yuen Long',
            dest_ch: '元朗',
            time_en: '4 min',
            time_ch: '4 分鐘',
            route_no: '615',
            stop: 0,
          },
          {
            train_length: 1,
            arrival_departure: 'A',
            dest_en: 'Siu Hong',
            dest_ch: '兆康',
            time_en: '11 min',
            time_ch: '11 分鐘',
            route_no: '615P',
            stop: 0,
          },
        ],
        platform_id: 1,
      },
      {
        route_list: [
          {
            train_length: 1,
            arrival_departure: 'A',
            dest_en: 'Tuen Mun Ferry Pier',
            dest_ch: '屯門碼頭',
            time_en: '5 min',
            time_ch: '5 分鐘',
            route_no: '615P',
            stop: 0,
          },
          {
            train_length: 1,
            arrival_departure: 'A',
            dest_en: 'Tuen Mun Ferry Pier',
            dest_ch: '屯門碼頭',
            time_en: '6 min',
            time_ch: '6 分鐘',
            route_no: '610',
            stop: 0,
          },
          {
            train_length: 2,
            arrival_departure: 'A',
            dest_en: 'Tuen Mun Ferry Pier',
            dest_ch: '屯門碼頭',
            time_en: '8 min',
            time_ch: '8 分鐘',
            route_no: '615',
            stop: 0,
          },
        ],
        platform_id: 2,
      },
    ],
    status: 1,
    system_time: '2021-05-27 21:06:56',
  };

  test('Can get ETA', () => {
    expect(getETA(schedule)).toEqual(`預計到站時間如下⌚
————————————————————
月台 - 1
610 - 元朗 - 1卡 - 即將抵達
615 - 元朗 - 1卡 - 4 分鐘
615P - 兆康 - 1卡 - 11 分鐘
————————————————————
月台 - 2
615P - 屯門碼頭 - 1卡 - 5 分鐘
610 - 屯門碼頭 - 1卡 - 6 分鐘
615 - 屯門碼頭 - 2卡 - 8 分鐘`);
  });

  test('Can return error message', () => {
    schedule.status = 0;
    expect(getETA(schedule)).toEqual('港鐵未能提供到站時間');
  });
});

describe('test can getPlatformMessage', () => {
  test('Can get platform message', () => {
    const platform: LRTPlatform = {
      route_list: [
        {
          train_length: 1,
          arrival_departure: 'A',
          dest_en: 'Yuen Long',
          dest_ch: '元朗',
          time_en: 'Arriving',
          time_ch: '即將抵達',
          route_no: '610',
          stop: 0,
        },
        {
          train_length: 1,
          arrival_departure: 'A',
          dest_en: 'Yuen Long',
          dest_ch: '元朗',
          time_en: '4 min',
          time_ch: '4 分鐘',
          route_no: '615',
          stop: 0,
        },
        {
          train_length: 1,
          arrival_departure: 'A',
          dest_en: 'Siu Hong',
          dest_ch: '兆康',
          time_en: '11 min',
          time_ch: '11 分鐘',
          route_no: '615P',
          stop: 0,
        },
      ],
      platform_id: 1,
    };
    expect(getPlatformMessage(platform)).toEqual(`月台 - 1
610 - 元朗 - 1卡 - 即將抵達
615 - 元朗 - 1卡 - 4 分鐘
615P - 兆康 - 1卡 - 11 分鐘`);
  });
});

describe('test can getRouteMessage', () => {
  test('Can get route message', () => {
    const route: LRTRoute = {
      train_length: 1,
      arrival_departure: 'D',
      dest_en: 'Tuen Mun Ferry Pier',
      dest_ch: '屯門碼頭',
      time_en: '13 min',
      time_ch: '13 分鐘',
      route_no: '615',
      stop: 0,
    };
    expect(getRouteMessage(route)).toEqual('615 - 屯門碼頭 - 1卡 - 13 分鐘');
  });
});
