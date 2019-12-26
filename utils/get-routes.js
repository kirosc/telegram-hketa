const axios = require('axios')
const fs = require('fs')

let CTBRoutes = new Set()
let NWFBRoutes = new Set()
let NLBRoutes = new Set()

// CTB
let promise1 = axios
  .get(
    'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route/CTB'
  )
  .then(res => {
    const routes = res.data.data
    for ({ route } of routes) {
      // Get ROUTE_NUMBER
      CTBRoutes.add(route)
    }
  })

// NWFB
let promise2 = axios
  .get(
    'https://rt.data.gov.hk/v1/transport/citybus-nwfb/route/NWFB'
  )
  .then(res => {
    const routes = res.data.data
    for ({ route } of routes) {
      // Get ROUTE_NUMBER
      NWFBRoutes.add(route)
    }
  })

// NLB
let promise3 = axios
  .post(
    'https://rt.data.gov.hk/v1/transport/nlb/route.php?action=list'
  )
  .then(res => {
    const { routes } = res.data
    for ({ routeNo } of routes) {
      // Get ROUTE_NUMBER
      NLBRoutes.add(routeNo)
    }
  })

Promise.all([promise1, promise2, promise3]).then(() => {
  const routes = {
    'CTB': Array.from(CTBRoutes),
    'NWFB': Array.from(NWFBRoutes),
    'NLB': Array.from(NLBRoutes)
  }

  fs.writeFileSync('./data/routes.json', JSON.stringify(routes, null, 2), 'utf-8');
})
