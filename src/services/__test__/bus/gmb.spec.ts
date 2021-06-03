import {
  buildGMBSubRouteKeyboard,
  getGMBETAMessage,
  getRegion,
  GMBRoute,
} from '@services/bus/gmb';
import { BusCompany } from '@root/constant';

describe('test can getRegion', () => {
  test('Can get correct region', () => {
    expect(getRegion(BusCompany.GMB_HKI)).toEqual('HKI');
  });

  test('Can raise error on unknown company', () => {
    expect(() => getRegion(BusCompany.KMB)).toThrow(
      'KMB is not in one of the GMB regions'
    );
  });
});

describe('test can build GMB Keyboards', () => {
  const routes: GMBRoute[] = [
    {
      route_id: 2000970,
      description_tc: '特別班次, 經谷柏道',
      description_sc: '',
      description_en: 'Special Route via Copper Road',
      directions: [
        {
          route_seq: 1,
          orig_tc: '蘭芳道',
          orig_sc: '兰芳道',
          orig_en: 'Causeway Bay Lan Fong Road ',
          dest_tc: '睦誠道',
          dest_sc: '睦诚道',
          dest_en: 'Moorsom Road',
          remarks_tc: null,
          remarks_sc: null,
          remarks_en: null,
          headways: [
            {
              weekdays: [true, true, true, true, true, true, true],
              public_holiday: true,
              headway_seq: 1,
              start_time: '06:15:00',
              end_time: '09:30:00',
              frequency: 15,
              frequency_upper: 15,
            },
            {
              weekdays: [true, true, true, true, true, true, true],
              public_holiday: true,
              headway_seq: 2,
              start_time: '09:30:00',
              end_time: '17:30:00',
              frequency: 24,
              frequency_upper: 24,
            },
            {
              weekdays: [true, true, true, true, true, true, true],
              public_holiday: true,
              headway_seq: 3,
              start_time: '17:30:00',
              end_time: '21:00:00',
              frequency: 14,
              frequency_upper: 14,
            },
            {
              weekdays: [true, true, true, true, true, true, true],
              public_holiday: true,
              headway_seq: 4,
              start_time: '21:00:00',
              end_time: '23:59:00',
              frequency: 28,
              frequency_upper: 28,
            },
          ],
          data_timestamp: '2021-04-29T09:44:10.007+08:00',
        },
      ],
      data_timestamp: '2021-04-29T09:44:10.007+08:00',
    },
    {
      route_id: 2000971,
      description_tc: '正常班次',
      description_sc: '',
      description_en: 'Normal Route',
      directions: [
        {
          route_seq: 1,
          orig_tc: '蘭芳道',
          orig_sc: '兰芳道',
          orig_en: ' Lan Fong Road',
          dest_tc: '睦誠道',
          dest_sc: '睦诚道',
          dest_en: 'Moorsom Road',
          remarks_tc: null,
          remarks_sc: null,
          remarks_en: null,
          headways: [
            {
              weekdays: [true, true, true, true, true, true, false],
              public_holiday: false,
              headway_seq: 1,
              start_time: '06:05:00',
              end_time: '07:00:00',
              frequency: 6,
              frequency_upper: 6,
            },
            {
              weekdays: [true, true, true, true, true, true, false],
              public_holiday: false,
              headway_seq: 2,
              start_time: '07:00:00',
              end_time: '09:30:00',
              frequency: 5,
              frequency_upper: 5,
            },
            {
              weekdays: [true, true, true, true, true, true, false],
              public_holiday: false,
              headway_seq: 3,
              start_time: '09:30:00',
              end_time: '17:30:00',
              frequency: 7,
              frequency_upper: 7,
            },
            {
              weekdays: [true, true, true, true, true, true, false],
              public_holiday: false,
              headway_seq: 4,
              start_time: '17:30:00',
              end_time: '21:00:00',
              frequency: 6,
              frequency_upper: 6,
            },
            {
              weekdays: [true, true, true, true, true, true, false],
              public_holiday: false,
              headway_seq: 5,
              start_time: '21:00:00',
              end_time: '23:59:00',
              frequency: 12,
              frequency_upper: 12,
            },
            {
              weekdays: [false, false, false, false, false, false, true],
              public_holiday: true,
              headway_seq: 6,
              start_time: '06:05:00',
              end_time: '17:20:00',
              frequency: 8,
              frequency_upper: 8,
            },
            {
              weekdays: [false, false, false, false, false, false, true],
              public_holiday: true,
              headway_seq: 7,
              start_time: '17:20:00',
              end_time: '17:30:00',
              frequency: 10,
              frequency_upper: 10,
            },
            {
              weekdays: [false, false, false, false, false, false, true],
              public_holiday: true,
              headway_seq: 8,
              start_time: '17:30:00',
              end_time: '21:00:00',
              frequency: 6,
              frequency_upper: 6,
            },
            {
              weekdays: [false, false, false, false, false, false, true],
              public_holiday: true,
              headway_seq: 9,
              start_time: '21:00:00',
              end_time: '23:59:00',
              frequency: 12,
              frequency_upper: 12,
            },
          ],
          data_timestamp: '2021-04-29T09:45:10.488+08:00',
        },
      ],
      data_timestamp: '2021-04-29T09:45:10.488+08:00',
    },
    {
      route_id: 2000972,
      description_tc: '樂陶苑特別班次',
      description_sc: '',
      description_en: 'Special Service to Villa Lotto',
      directions: [
        {
          route_seq: 1,
          orig_tc: '利園山道',
          orig_sc: '利園山道',
          orig_en: 'Lee Garden Road',
          dest_tc: '樂陶苑',
          dest_sc: '乐陶苑',
          dest_en: 'Villa Lotto',
          remarks_tc: null,
          remarks_sc: null,
          remarks_en: null,
          headways: [
            {
              weekdays: [true, true, true, true, true, true, false],
              public_holiday: false,
              headway_seq: 1,
              start_time: '07:30:00',
              end_time: '09:30:00',
              frequency: 15,
              frequency_upper: 15,
            },
            {
              weekdays: [true, true, true, true, true, true, false],
              public_holiday: false,
              headway_seq: 2,
              start_time: '11:00:00',
              end_time: '12:30:00',
              frequency: 15,
              frequency_upper: 15,
            },
          ],
          data_timestamp: '2021-04-29T09:45:10.918+08:00',
        },
      ],
      data_timestamp: '2021-04-29T09:45:10.918+08:00',
    },
    {
      route_id: 2000973,
      description_tc: '樂翠台特別班次',
      description_sc: '乐翠台特别班次',
      description_en: 'Special Service to Villa Rocha',
      directions: [
        {
          route_seq: 1,
          orig_tc: '利園山道',
          orig_sc: '利園山道',
          orig_en: 'Lee Garden Road',
          dest_tc: '樂翠台',
          dest_sc: '乐翠台',
          dest_en: 'Villa Rocha',
          remarks_tc: null,
          remarks_sc: null,
          remarks_en: null,
          headways: [
            {
              weekdays: [true, true, true, true, true, true, false],
              public_holiday: false,
              headway_seq: 1,
              start_time: '07:15:00',
              end_time: '08:05:00',
              frequency: 10,
              frequency_upper: 10,
            },
            {
              weekdays: [false, false, false, false, false, false, true],
              public_holiday: true,
              headway_seq: 2,
              start_time: '07:15:00',
              end_time: '10:00:00',
              frequency: 10,
              frequency_upper: 10,
            },
          ],
          data_timestamp: '2021-05-26T18:09:25.574+08:00',
        },
      ],
      data_timestamp: '2021-05-26T18:09:25.574+08:00',
    },
  ];

  test('Can build keyboard', () => {
    expect(buildGMBSubRouteKeyboard(routes)).toEqual([
      ['2000970,1', '蘭芳道 > 睦誠道 (特別班次, 經谷柏道)'],
      ['2000971,1', '蘭芳道 > 睦誠道 '],
      ['2000972,1', '利園山道 > 樂陶苑 (樂陶苑特別班次)'],
      ['2000973,1', '利園山道 > 樂翠台 (樂翠台特別班次)'],
    ]);
  });
});

describe('test can getETAMessage', () => {
  test('Can get eta message', () => {
    const etas = [
      {
        eta_seq: 1,
        diff: 5,
        timestamp: '2021-06-03T21:11:28.332+08:00',
        remarks_tc: null,
        remarks_sc: null,
        remarks_en: null,
      },
      {
        eta_seq: 2,
        diff: 20,
        timestamp: '2021-06-03T21:26:42.250+08:00',
        remarks_tc: null,
        remarks_sc: null,
        remarks_en: null,
      },
    ];

    expect(getGMBETAMessage(etas)).toEqual(`預計到站時間如下⌚
————————————————————
1. 5 分鐘  (21:11)
2. 20 分鐘  (21:26)`);
  });

  test('Can get empty eta message', () => {
    const etas = [];
    expect(getGMBETAMessage(etas)).toEqual('尾班車已過或未有到站時間提供');
  });
});
