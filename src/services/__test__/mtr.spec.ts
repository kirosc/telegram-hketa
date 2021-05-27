import { MTRSchedule, MTRStation } from '@interfaces/mtr';
import {
  getETA,
  getRouteMessage,
  getStationMessage,
  getStationName,
} from '@services/mtr';

describe('test can getETA', () => {
  test('Can get eta', () => {
    const schedule: MTRSchedule = {
      status: 1,
      message: 'successful',
      curr_time: '2021-05-27 23:50:19',
      sys_time: '2021-05-27 23:50:19',
      isdelay: 'N',
      data: {
        'WRL-LOP': {
          curr_time: '2021-05-27 23:50:19',
          sys_time: '2021-05-27 23:50:19',
          UP: [
            {
              ttnt: '0',
              valid: 'Y',
              plat: '1',
              time: '2021-05-27 23:50:00',
              source: '-',
              dest: 'TUM',
              seq: '1',
            },
            {
              ttnt: '7',
              valid: 'Y',
              plat: '1',
              time: '2021-05-27 23:57:00',
              source: '-',
              dest: 'TUM',
              seq: '2',
            },
            {
              ttnt: '14',
              valid: 'Y',
              plat: '1',
              time: '2021-05-28 00:04:00',
              source: '-',
              dest: 'TUM',
              seq: '3',
            },
            {
              ttnt: '21',
              valid: 'Y',
              plat: '1',
              time: '2021-05-28 00:11:00',
              source: '-',
              dest: 'TUM',
              seq: '4',
            },
            {
              ttnt: '28',
              valid: 'Y',
              plat: '1',
              time: '2021-05-28 00:18:00',
              source: '-',
              dest: 'TUM',
              seq: '5',
            },
          ],
          DOWN: [
            {
              ttnt: '0',
              valid: 'Y',
              plat: '2',
              time: '2021-05-27 23:49:00',
              source: '-',
              dest: 'HUH',
              seq: '1',
            },
            {
              ttnt: '6',
              valid: 'Y',
              plat: '2',
              time: '2021-05-27 23:56:00',
              source: '-',
              dest: 'HUH',
              seq: '2',
            },
            {
              ttnt: '13',
              valid: 'Y',
              plat: '2',
              time: '2021-05-28 00:03:00',
              source: '-',
              dest: 'HUH',
              seq: '3',
            },
            {
              ttnt: '23',
              valid: 'Y',
              plat: '2',
              time: '2021-05-28 00:12:00',
              source: '-',
              dest: 'HUH',
              seq: '4',
            },
            {
              ttnt: '35',
              valid: 'Y',
              plat: '2',
              time: '2021-05-28 00:24:00',
              source: '-',
              dest: 'HUH',
              seq: '5',
            },
          ],
        },
      },
    };
    expect(getETA(schedule, 'WRL-LOP')).toEqual(`預計到站時間如下⌚
————————————————————
1. 0分鐘 往屯門 (23:50)
2. 7分鐘 往屯門 (23:57)
3. 14分鐘 往屯門 (00:04)
4. 21分鐘 往屯門 (00:11)
5. 28分鐘 往屯門 (00:18)
————————————————————
1. 0分鐘 往紅磡 (23:49)
2. 6分鐘 往紅磡 (23:56)
3. 13分鐘 往紅磡 (00:03)
4. 23分鐘 往紅磡 (00:12)
5. 35分鐘 往紅磡 (00:24)`);
  });
});

describe('test can getStationMessage', () => {
  test('Can get station message', () => {
    const station = {
      curr_time: '2021-05-27 23:50:19',
      sys_time: '2021-05-27 23:50:19',
      UP: [
        {
          ttnt: '0',
          valid: 'Y',
          plat: '1',
          time: '2021-05-27 23:50:00',
          source: '-',
          dest: 'TUM',
          seq: '1',
        },
        {
          ttnt: '7',
          valid: 'Y',
          plat: '1',
          time: '2021-05-27 23:57:00',
          source: '-',
          dest: 'TUM',
          seq: '2',
        },
        {
          ttnt: '14',
          valid: 'Y',
          plat: '1',
          time: '2021-05-28 00:04:00',
          source: '-',
          dest: 'TUM',
          seq: '3',
        },
        {
          ttnt: '21',
          valid: 'Y',
          plat: '1',
          time: '2021-05-28 00:11:00',
          source: '-',
          dest: 'TUM',
          seq: '4',
        },
        {
          ttnt: '28',
          valid: 'Y',
          plat: '1',
          time: '2021-05-28 00:18:00',
          source: '-',
          dest: 'TUM',
          seq: '5',
        },
      ],
      DOWN: [
        {
          ttnt: '0',
          valid: 'Y',
          plat: '2',
          time: '2021-05-27 23:49:00',
          source: '-',
          dest: 'HUH',
          seq: '1',
        },
        {
          ttnt: '6',
          valid: 'Y',
          plat: '2',
          time: '2021-05-27 23:56:00',
          source: '-',
          dest: 'HUH',
          seq: '2',
        },
        {
          ttnt: '13',
          valid: 'Y',
          plat: '2',
          time: '2021-05-28 00:03:00',
          source: '-',
          dest: 'HUH',
          seq: '3',
        },
        {
          ttnt: '23',
          valid: 'Y',
          plat: '2',
          time: '2021-05-28 00:12:00',
          source: '-',
          dest: 'HUH',
          seq: '4',
        },
        {
          ttnt: '35',
          valid: 'Y',
          plat: '2',
          time: '2021-05-28 00:24:00',
          source: '-',
          dest: 'HUH',
          seq: '5',
        },
      ],
    };
    expect(getStationMessage(station, 'WRL-LOP'))
      .toEqual(`1. 0分鐘 往屯門 (23:50)
2. 7分鐘 往屯門 (23:57)
3. 14分鐘 往屯門 (00:04)
4. 21分鐘 往屯門 (00:11)
5. 28分鐘 往屯門 (00:18)
————————————————————
1. 0分鐘 往紅磡 (23:49)
2. 6分鐘 往紅磡 (23:56)
3. 13分鐘 往紅磡 (00:03)
4. 23分鐘 往紅磡 (00:12)
5. 35分鐘 往紅磡 (00:24)`);
  });

  test('Can handle absence data', () => {
    let station: MTRStation = {
      curr_time: '2021-05-28 00:15:23',
      sys_time: '2021-05-28 0:15:23',
      DOWN: [
        {
          ttnt: '0',
          valid: 'Y',
          plat: '2',
          time: '2021-05-28 00:15:00',
          source: '-',
          dest: 'HUH',
          seq: '1',
        },
      ],
    };

    expect(getStationMessage(station, 'WRL-LOP')).toEqual(`尾班車已過
————————————————————
1. 0分鐘 往紅磡 (00:15)`);

    station = {
      curr_time: '2021-05-28 00:16:41',
      sys_time: '2021-05-28 0:16:41',
      UP: [],
      DOWN: [],
    };

    expect(getStationMessage(station, 'WRL-LOP')).toEqual(`尾班車已過
————————————————————
尾班車已過`);
  });
});

describe('test can getRouteMessage', () => {
  test('Can get route message', () => {
    const route = {
      ttnt: '0',
      valid: 'Y',
      plat: '1',
      time: '2021-05-27 23:50:00',
      source: '-',
      dest: 'TUM',
      seq: '1',
    };
    expect(getRouteMessage(route, 'WRL-LOP')).toEqual(
      '1. 0分鐘 往屯門 (23:50)'
    );
  });
});

describe('test can getStationName', () => {
  test('Can get tc station name', () => {
    expect(getStationName('WRL', 'LOP')).toEqual('朗屏');
  });

  test('Can get en station name', () => {
    expect(getStationName('WRL', 'LOP', 'en')).toEqual('Long Ping');
  });
});
