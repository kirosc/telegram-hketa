import '../config/alias';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { readJSON } from './io';
import { BRAVO_BUS_ENDPOINT, KMB_ENDPOINT, NLB_ENDPOINT } from '@root/constant';
import { listGMBRoutes } from '@services/bus/gmb';

// Collect and index NLB routeId by route number
async function getNLBRotues() {
  const res = await axios.get<any>(`${NLB_ENDPOINT}/route.php?action=list`);

  const sortedRoutes = _.sortBy(res.data.routes, (r) => parseInt(r.routeId));
  const routes = _.groupBy(sortedRoutes, 'routeNo');

  fs.writeFileSync(
    path.resolve(__dirname, '../../data/routes-NLB.json'),
    JSON.stringify(routes, null, 2),
    'utf-8'
  );
}

export async function getBusRoutes() {
  const ctbJob = axios.get<any>(`${BRAVO_BUS_ENDPOINT}/route/CTB`);
  const nwfbJob = axios.get<any>(`${BRAVO_BUS_ENDPOINT}/route/NWFB`);
  const kmbJob = axios.get<any>(`${KMB_ENDPOINT}/route`);
  const nlbJob = axios.get<any>(`${NLB_ENDPOINT}/route.php?action=list`);
  const gmbJob = listGMBRoutes();

  const [ctb, nwfb, kmb, nlb, gmbRoutes] = await Promise.all([
    ctbJob,
    nwfbJob,
    kmbJob,
    nlbJob,
    gmbJob,
  ]);

  const ctbRoutes = new Set(ctb.data.data.map((d) => d.route));
  const nwfbRoutes = new Set(nwfb.data.data.map((d) => d.route));
  const kmbRoutes = new Set(kmb.data.data.map((d) => d.route));
  const nlbRoutes = new Set(nlb.data.routes.map((d) => d.routeNo));
  const mtrRoutes = readJSON('routes-mtr');

  const routes = {
    CTB: [...ctbRoutes],
    NWFB: [...nwfbRoutes],
    KMB: [...kmbRoutes],
    NLB: [...nlbRoutes],
    GMB_HKI: gmbRoutes['HKI'],
    GMB_KLN: gmbRoutes['KLN'],
    GMB_NT: gmbRoutes['NT'],
    MTR: mtrRoutes.map((r) => r.route_number),
  };

  fs.writeFileSync(
    path.resolve(__dirname, '../../data/routes.json'),
    JSON.stringify(routes, null, 2),
    'utf-8'
  );
}

getBusRoutes();
