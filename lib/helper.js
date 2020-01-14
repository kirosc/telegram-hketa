const { readJSON } = require('./io')

// Check if the route exists and return the company code
exports.isValidRoute = route => {
    if (/[A-Za-z0-9]*[0-9][A-Za-z0-9]*/.test(route)) {
        let routes = readJSON('routes')
        let companies = []
        
        for (company in routes) {
            if (routes[company].includes(route))
                companies.push(company)
        }
        return companies
    } 
    return null
}