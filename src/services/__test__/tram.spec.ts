import { getTramETAMessage } from '@services/tram';

describe('test can getTramETAMessage', () => {
  const etas = [
    {
      arrive_in_minute: '13',
      arrive_in_second: '729',
      is_arrived: '0',
      stop_code: '04W',
      seq: '1',
      tram_id: '148',
      eat: 'Jun 4 2021 11:27PM',
      dest_stop_code: 'ED',
      tram_dest_tc: '西灣河車廠',
      tram_dest_en: 'Sai Wan Ho Depot',
      is_last_tram: '0',
    },
    {
      arrive_in_minute: '20',
      arrive_in_second: '1157',
      is_arrived: '0',
      stop_code: '04W',
      seq: '2',
      tram_id: '108',
      eat: 'Jun 4 2021 11:34PM',
      dest_stop_code: 'HVT_B',
      tram_dest_tc: '跑馬地總站(東)',
      tram_dest_en: 'Happy Valley Terminus B',
      is_last_tram: '0',
    },
    {
      arrive_in_minute: '33',
      arrive_in_second: '1917',
      is_arrived: '0',
      stop_code: '04W',
      seq: '3',
      tram_id: '76',
      eat: 'Jun 4 2021 11:47PM',
      dest_stop_code: 'WMT',
      tram_dest_tc: '上環 (西港城) 總站',
      tram_dest_en: 'Western Market Terminus',
      is_last_tram: '0',
    },
  ];

  test('Can get tc station name', () => {
    expect(getTramETAMessage(etas)).toEqual(`預計到站時間如下⌚
————————————————————
1. 13 分鐘  (23:27) 往西灣河車廠
2. 20 分鐘  (23:34) 往跑馬地總站(東)
3. 33 分鐘  (23:47) 往上環 (西港城) 總站`);
  });
});
