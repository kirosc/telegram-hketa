// Collect and index NLB routeId by route number
const axios = require('axios');
const fs = require('fs');

let routes = {};

axios.get('https://rt.data.gov.hk/v1/transport/nlb/route.php?action=list')
  .then(res => {
    for (route of res.data.routes) {
      const { routeNo } = route;
      if (!routes[routeNo]) {
        routes[routeNo] = [];
      }
      delete route.routeNo;
      routes[routeNo].push(route);
    }

    for (routeNo in routes) {
      // Sort the route by routeId    
      routes[routeNo].sort((a, b) => (Number(a.routeId) > Number(b.routeId)) ? 1 : -1);
    }
  })
  .then(() => fs.writeFileSync('./data/routes-NLB.json', JSON.stringify(routes, null, 2), 'utf-8'));