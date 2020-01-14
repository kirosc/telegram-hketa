const constants = require('./constants')
const { readJSON } = require('./io')

// Build a keyboard when more than one company use the same route number
exports.companies = (companies, route) => {
    const companyNames = readJSON('companies')
    let keyboard = []

    for (company of companies) {
        keyboard.push(
            {
                text: companyNames[company].tc_name,
                callback_data: `${constants.CHECK_CIRCULAR_ACTION},${company},${route}`
            }
        )
    }

    return keyboard
}

// Build a keyboard when a route isn't circular
exports.direction = (company, route, routes) => {
    let keyboard = []
    let callback = `${constants.STOPS_ACTION},${company},${route}`

    switch (company) {
        case 'NLB':
            for (route of routes) {
                const { routeName_c, routeId } = route
                keyboard.push([
                    { text: routeName_c, callback_data: `${callback},${routeId}` }
                ])
            }

            break
        case 'CTB':
        case 'NWFB':
            let { orig_tc, dest_tc } = routes

            let inboundCallback = callback + ',inbound'
            let outboundCallback = callback + ',outbound'

            keyboard = [
                { text: orig_tc, callback_data: inboundCallback },
                { text: dest_tc, callback_data: outboundCallback }
            ]

            break
        case 'KMB':
        case 'LWB':
            for (const route of routes) {
                let text = `${route.Origin_CHI} > ${route.Destination_CHI}`
                let callback_data = callback + `,${route.Bound},${route.ServiceType.trim()}`

                if (route.Desc_CHI !== '循環線' && route.Desc_CHI) {
                    text += ' - ' + route.Desc_CHI
                }

                keyboard.push([{ text, callback_data }])
            }
    }

    return keyboard
}

// Build a keyboard consists of list of stops
exports.stops = (action, company, route, names, stopIds, options) => {
    let keyboard = [], lastStop, callback

    if (names.length % 2 !== 0)
        lastStop = names.pop()

    switch (company) {
        case 'NLB':
            callback = `${action},${company},${route},${options.routeId}`
            break
        case 'CTB':
        case 'NWFB':
            callback = `${action},${company},${route},${options.dir}`
            break
        case 'KMB':
        case 'LWB':
            callback = `${action},${company},${route},${options.bound || ''},${options.serviceType || ''}`
            break
    }

    for (let i = 0; i < names.length; i += 2) {
        const callback1 = callback + `,${stopIds[i]}`
        const callback2 = callback + `,${stopIds[i + 1]}`

        const button = [
            { text: names[i], callback_data: callback1 },
            { text: names[i + 1], callback_data: callback2 }
        ]
        keyboard.push(button)
    }

    if (lastStop) {
        const callback3 = `${callback},${stopIds.pop()}`
        keyboard.push([{ text: lastStop, callback_data: callback3 }])
    }

    return keyboard
}

// Build a keyboard consists of list of metro lines
exports.lines = () => {
    let keyboard = []

    const lines = readJSON('mtr-lines')

    for (const [code, value] of Object.entries(lines)) {
        keyboard.push([{ text: value.tc, callback_data: code }])
    }
    
    return keyboard
}
