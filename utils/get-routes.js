const axios = require('axios')
const fs = require('fs')

let CTBRoutes = new Set()
let NWFBRoutes = new Set()
let NLBRoutes = new Set()

// CTB
let promise1 = axios
  .get(
    'https://api.data.gov.hk/v1/filter?q=%7B%22resource%22%3A%22http%3A%2F%2Fstatic.data.gov.hk%2Ftd%2Froutes-and-fares%2FROUTE_BUS.mdb%22%2C%22section%22%3A1%2C%22format%22%3A%22json%22%2C%22filters%22%3A%5B%5B2%2C%22in%22%2C%5B%22CTB%22%2C%22KMB%2BCTB%22%2C%22LWB%2BCTB%22%5D%5D%5D%7D'
  )
  .then(res => {
    const routes = res.data.rows
    for (route of routes) {
      // Get ROUTE_NAMEE
      CTBRoutes.add(route[5])
    }
  })

// NWFB
let promise2 = axios
  .get(
    'https://api.data.gov.hk/v1/filter?q=%7B%22resource%22%3A%22http%3A%2F%2Fstatic.data.gov.hk%2Ftd%2Froutes-and-fares%2FROUTE_BUS.mdb%22%2C%22section%22%3A1%2C%22format%22%3A%22json%22%2C%22filters%22%3A%5B%5B2%2C%22in%22%2C%5B%22NWFB%22%2C%22KWB%2BNWFB%22%5D%5D%5D%7D'
  )
  .then(res => {
    const routes = res.data.rows
    for (route of routes) {
      // Get ROUTE_NAMEE
      NWFBRoutes.add(route[5])
    }
  })

  // NLB
  let promise3 = axios
    .get(
      'https://api.data.gov.hk/v1/filter?q=%7B%22resource%22%3A%22http%3A%2F%2Fstatic.data.gov.hk%2Ftd%2Froutes-and-fares%2FROUTE_BUS.mdb%22%2C%22section%22%3A1%2C%22format%22%3A%22json%22%2C%22filters%22%3A%5B%5B2%2C%22eq%22%2C%5B%22NLB%22%5D%5D%5D%7D'
    )
    .then(res => {
      const routes = res.data.rows
      for (route of routes) {
        // Get ROUTE_NAMEE
        NLBRoutes.add(route[5])
      }
    })

Promise.all([promise1, promise2, promise3]).then(() => {
  const routes = {
    'CTB': Array.from(CTBRoutes),
    'NWFB': Array.from(NWFBRoutes),
    'NLB': Array.from(NLBRoutes)
  }

  fs.writeFileSync('./data/routes.json', JSON.stringify(routes, null, 2) , 'utf-8');
})
