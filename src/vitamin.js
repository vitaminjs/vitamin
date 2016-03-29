
var helpers = require('./helpers')

module.exports = Vitamin

/**
 * Vitamin model constructor
 * 
 * @constructor
 */
function Vitamin() { this.init.apply(this, arguments) }

// add plugin usage feature
Vitamin.use = helpers.usePlugin

// use global API
Vitamin.use(require('./global/api'))

// use data API
Vitamin.use(require('./data/api'))

// use persistence API
Vitamin.use(require('./persistence/api'))