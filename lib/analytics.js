const ua = require('universal-analytics')
const constants = require('./constants')

// Send usage data to GA
// params = { ec, ea, el, ev }
exports.send = (ctx, params) => {
    if (Object.entries(params).length !== 0) {
        let request = ctx.update.message || ctx.update.callback_query
        let userid = request.from.id
        let user = ua(constants.GA_TID, userid, { strictCidFormat: false }) // Using TG UID instead of a UUID
        user.event(params).send()
    }
}