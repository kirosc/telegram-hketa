import { getETAMessage } from '@services/bus/common';
import { KMBETA } from '@services/bus/kmb';
import * as io from '@services/io';
import * as commonServices from '@services/common';
import { mocked } from 'ts-jest/utils';

jest.mock('@services/io', () => ({
  ...(jest.requireActual('@services/io') as object),
  readJSON: jest.fn(),
}));

jest.mock('@services/common', () => ({
  ...(jest.requireActual('@services/common') as object),
  getTimeDiffinMins: jest.fn(),
}));

const mockIO = mocked(io, false);

describe('test can getRouteCompany', () => {
  const routes = {
    CTB: ['1', '11'],
    KMB: ['5A', '11', '74B'],
    NLB: ['11'],
    MTR: ['K17'],
  };

  test('Can get route company', () => {
    mockIO.readJSON.mockReturnValue(routes);
    // FIXME: Mock not working function called outside function
    // expect(mockIO.readJSON).toBeCalled()
    // expect(getRouteCompany('11')).toEqual(['CTB', 'KMB', 'NLB']);
  });
});

describe('test can getETAMessage', () => {
  const mockCommonServices = mocked(commonServices, false);

  const etas: KMBETA[] = [
    {
      co: 'KMB',
      route: '11',
      dir: 'O',
      service_type: 1,
      seq: 12,
      dest_tc: '九龍站',
      dest_sc: '九龙站',
      dest_en: 'KOWLOON STATION',
      eta_seq: 1,
      eta: '2021-06-03T14:44:17+08:00',
      rmk_tc: '',
      rmk_sc: '',
      rmk_en: '',
      data_timestamp: '2021-06-03T14:30:16+08:00',
    },
    {
      co: 'KMB',
      route: '11',
      dir: 'O',
      service_type: 1,
      seq: 12,
      dest_tc: '九龍站',
      dest_sc: '九龙站',
      dest_en: 'KOWLOON STATION',
      eta_seq: 2,
      eta: '2021-06-03T14:46:18+08:00',
      rmk_tc: '受阻於黃大仙總站',
      rmk_sc: '受阻于黄大仙总站',
      rmk_en:
        'Delayed journey fromey is delayed from WONG TAI SIN BUS TERMINUS',
      data_timestamp: '2021-06-03T14:30:16+08:00',
    },
    {
      co: 'KMB',
      route: '11',
      dir: 'O',
      service_type: 1,
      seq: 12,
      dest_tc: '九龍站',
      dest_sc: '九龙站',
      dest_en: 'KOWLOON STATION',
      eta_seq: 3,
      eta: '2021-06-03T14:58:36+08:00',
      rmk_tc: '原定班次',
      rmk_sc: '原定班次',
      rmk_en: 'Scheduled Bus',
      data_timestamp: '2021-06-03T14:30:16+08:00',
    },
  ];

  test('Can get ETA', () => {
    mockCommonServices.getTimeDiffinMins
      .mockReturnValueOnce(12)
      .mockReturnValueOnce(14)
      .mockReturnValueOnce(27);
    expect(getETAMessage(etas)).toEqual(`預計到站時間如下⌚
————————————————————
1. 12 分鐘  (14:44) - 往 九龍站 
2. 14 分鐘  (14:46) - 往 九龍站 - 受阻於黃大仙總站
3. 27 分鐘  (14:58) - 往 九龍站 - 原定班次`);
  });
});
