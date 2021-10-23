import { SEPARATOR, TRAM_ENDPOINT } from '@root/constant';
import axios from 'axios';
import xml from 'xml2js';

interface TramETA {
  arrive_in_minute: string;
  arrive_in_second: string;
  is_arrived: string;
  stop_code: string;
  seq: string;
  tram_id: string;
  eat: string;
  dest_stop_code: string;
  tram_dest_tc: string;
  tram_dest_en: string;
  is_last_tram: string;
}

export async function getTramETA(stop_code: string) {
  const res = await axios.get<any>(`${TRAM_ENDPOINT}/geteat.php`, {
    params: { stop_code },
  });
  const json: { etas: TramETA[] } = await xml.parseStringPromise(res.data, {
    explicitRoot: false,
    mergeAttrs: true,
    explicitArray: false,
    tagNameProcessors: [() => 'etas'],
  });

  return json.etas;
}

export function getTramETAMessage(etas: TramETA[]) {
  if (etas.length === 0) {
    return '尾班車已過或未有到站時間提供';
  }

  const message = `預計到站時間如下⌚\n${SEPARATOR}\n`;
  const etasMessage = etas.map(
    ({
      seq,
      arrive_in_minute,
      is_arrived,
      is_last_tram,
      eat,
      tram_dest_tc,
    }) => {
      const formattedTime = eat.split(' ').pop();
      const arrived = is_arrived === '1' ? '已到達' : '';
      const lastTram = is_last_tram === '1' ? '尾班車' : '';
      return `${seq}. ${arrive_in_minute} 分鐘  (${formattedTime}) 往${tram_dest_tc} ${arrived} ${lastTram}`.trim();
    }
  );

  return `${message}${etasMessage.join('\n')}`;
}
