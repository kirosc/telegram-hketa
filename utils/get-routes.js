// Collect and save all routes that supporting ETA checking
const axios = require('axios');
const fs = require('fs');
const convert = require('xml-js');
const { readJSON } = require('../lib/io');

let CTBRoutes = new Set();
let NWFBRoutes = new Set();
let NLBRoutes = new Set();
let KMBRoutes = new Set();
let LWBRoutes = new Set();

// CTB
let promise1 = axios
  .get(
    'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route/CTB'
  )
  .then(res => {
    const routes = res.data.data;
    for ({ route } of routes) {
      // Get ROUTE_NUMBER
      CTBRoutes.add(route);
    }
  });

// NWFB
let promise2 = axios
  .get(
    'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route/NWFB'
  )
  .then(res => {
    const routes = res.data.data;
    for ({ route } of routes) {
      // Get ROUTE_NUMBER
      NWFBRoutes.add(route);
    }
  });

// NLB
let promise3 = axios
  .post(
    'https://rt.data.gov.hk/v1/transport/nlb/route.php?action=list'
  )
  .then(res => {
    const { routes } = res.data;
    for ({ routeNo } of routes) {
      // Get ROUTE_NUMBER
      NLBRoutes.add(routeNo);
    }
  });

// KMB
let promise4 = axios
  .get(
    'https://static.data.gov.hk/td/routes-fares-xml/ROUTE_BUS.xml'
  )
  .then(res => {
    let routes = convert.xml2json(res.data, { compact: true, spaces: 4, ignoreDeclaration: true, textKey: "text" });
    routes = JSON.parse(routes);
    
    routes = routes.ROUTE_BUS?.ROUTE ?? routes.dataroot?.ROUTE;

    for (const route of routes) {
      if (route.COMPANY_CODE.text === 'KMB') {
        KMBRoutes.add(route.ROUTE_NAMEC.text);
      } else if (route.COMPANY_CODE.text === 'LWB') {
        LWBRoutes.add(route.ROUTE_NAMEC.text);
      }
    }
  });

// MTR
const { MTR } = readJSON('routes-mtr');

Promise.all([promise1, promise2, promise3, promise4]).then(() => {
  const routes = {
    'CTB': Array.from(CTBRoutes),
    'NWFB': Array.from(NWFBRoutes),
    'NLB': Array.from(NLBRoutes),
    'KMB': Array.from(KMBRoutes).sort(),
    'LWB': Array.from(LWBRoutes).sort(),
    MTR
  };

  fs.writeFileSync('./data/routes.json', JSON.stringify(routes, null, 2), 'utf-8');
})
  .catch(err => {
    console.error(err);
    process.exit(-1);
  });
