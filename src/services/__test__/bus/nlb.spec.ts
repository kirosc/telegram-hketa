import { getNLBETAMessage } from '@services/bus/nlb';
import * as commonServices from '@services/common';
import { mocked } from 'ts-jest/utils';

jest.mock('@services/common', () => ({
  ...(jest.requireActual('@services/common') as object),
  getTimeDiffinMins: jest.fn(),
}));

describe('test can getNLBETAMessage', () => {
  const mockCommonServices = mocked(commonServices, false);

  const etas = [
    {
      estimatedArrivalTime: '2021-06-03 13:45:46',
      routeVariantName: '',
      departed: 0,
      noGPS: 0,
      wheelChair: 1,
      generateTime: '2021-06-03 13:13:50',
    },
  ];

  test('Can get ETA', () => {
    mockCommonServices.getTimeDiffinMins.mockReturnValue(31);
    expect(getNLBETAMessage(etas)).toEqual(`預計到站時間如下⌚
————————————————————
1. 31 分鐘  (13:45) 未從總站開出 ♿️`);
  });
});
