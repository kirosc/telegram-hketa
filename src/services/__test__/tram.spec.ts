import { getTramETAMessage } from '@services/tram';

describe('test can getTramETAMessage', () => {
  const etas = [
    {
      arrive_in_minute: '29',
      arrive_in_second: '1677',
      is_arrived: '0',
      stop_code: '14W',
      seq: '1',
      tram_id: '108',
      eat: 'Jun 5 2021 12:15AM',
      dest_stop_code: 'HVT_B',
      tram_dest_tc: '跑馬地總站(東)',
      tram_dest_en: 'Happy Valley Terminus B',
      is_last_tram: '0',
    },
    {
      arrive_in_minute: '41',
      arrive_in_second: '2437',
      is_arrived: '0',
      stop_code: '14W',
      seq: '2',
      tram_id: '76',
      eat: 'Jun 5 2021 12:27AM',
      dest_stop_code: 'WMT',
      tram_dest_tc: '上環 (西港城) 總站',
      tram_dest_en: 'Western Market Terminus',
      is_last_tram: '0',
    },
    {
      arrive_in_minute: '86',
      arrive_in_second: '5127',
      is_arrived: '0',
      stop_code: '14W',
      seq: '3',
      tram_id: '175',
      eat: 'Jun 5 2021  1:12AM',
      dest_stop_code: 'HVT_B',
      tram_dest_tc: '跑馬地總站(東)',
      tram_dest_en: 'Happy Valley Terminus B',
      is_last_tram: '0',
    },
  ];

  test('Can get tc station name', () => {
    expect(getTramETAMessage(etas)).toEqual(`預計到站時間如下⌚
————————————————————
1. 29 分鐘  (12:15AM) 往跑馬地總站(東)
2. 41 分鐘  (12:27AM) 往上環 (西港城) 總站
3. 86 分鐘  (1:12AM) 往跑馬地總站(東)`);
  });
});
