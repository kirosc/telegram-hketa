import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { readJSON } from './io';

// Collect and index NLB routeId by route number
async function getNLBRotues() {
  const res = await axios.get(
    'https://rt.data.gov.hk/v1/transport/nlb/route.php?action=list'
  );

  const sortedRoutes = _.sortBy(res.data.routes, (r) => parseInt(r.routeId));
  const routes = _.groupBy(sortedRoutes, 'routeNo');

  fs.writeFileSync(
    path.resolve(__dirname, '../../data/routes-NLB.json'),
    JSON.stringify(routes, null, 2),
    'utf-8'
  );
}

async function getBusRoutes() {
  const ctbJob = axios.get(
    'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route/CTB'
  );
  const nwfbJob = axios.get(
    'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route/NWFB'
  );
  const kmbJob = axios.get(
    'https://data.etabus.gov.hk/v1/transport/kmb/route/'
  );
  const nlbJob = axios.get(
    'https://rt.data.gov.hk/v1/transport/nlb/route.php?action=list'
  );

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

  // let KMBRoutes = new Set(kmbRoutes);
  // let LWBRoutes = new Set(lwbRoutes);

  // console.log(kmbRoutes.length, KMBRoutes.size);
  // console.log(lwbRoutes.length, LWBRoutes.size);
  // console.log(lwbRoutes);
  // console.log(LWBRoutes);

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

getNLBRotues();
getBusRoutes();
