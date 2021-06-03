import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { readJSON } from './io';
import { BRAVO_BUS_ENDPOINT, KMB_ENDPOINT, NLB_ENDPOINT } from '@root/constant';

// Collect and index NLB routeId by route number
async function getNLBRotues() {
  const res = await axios.get(`${NLB_ENDPOINT}/route.php?action=list`);

  const sortedRoutes = _.sortBy(res.data.routes, (r) => parseInt(r.routeId));
  const routes = _.groupBy(sortedRoutes, 'routeNo');

  fs.writeFileSync(
    path.resolve(__dirname, '../../data/routes-NLB.json'),
    JSON.stringify(routes, null, 2),
    'utf-8'
  );
}

async function getBusRoutes() {
  const ctbJob = axios.get(`${BRAVO_BUS_ENDPOINT}/route/CTB`);
  const nwfbJob = axios.get(`${BRAVO_BUS_ENDPOINT}/route/NWFB`);
  const kmbJob = axios.get(`${KMB_ENDPOINT}/route`);
  const nlbJob = axios.get(`${NLB_ENDPOINT}/route.php?action=list`);

  const [ctb, nwfb, kmb, nlb] = await Promise.all([
    ctbJob,
    nwfbJob,
    kmbJob,
    nlbJob,
  ]);

  const ctbRoutes = new Set(ctb.data.data.map((d) => d.route));
  const nwfbRoutes = new Set(nwfb.data.data.map((d) => d.route));
  const kmbRoutes = new Set(kmb.data.data.map((d) => d.route));
  const nlbRoutes = new Set(nlb.data.routes.map((d) => d.routeNo));

  const { MTR } = readJSON('routes-mtr');

  const routes = {
    CTB: [...ctbRoutes],
    NWFB: [...nwfbRoutes],
    KMB: [...kmbRoutes],
    NLB: [...nlbRoutes],
    MTR,
  };

  fs.writeFileSync(
    path.resolve(__dirname, '../../data/routes.json'),
    JSON.stringify(routes, null, 2),
    'utf-8'
  );
}

async function getMinibusRoutes() {}

getBusRoutes();
