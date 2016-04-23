
/**
 * Vitamin model constructor
 * 
 * @constructor
 */
function Vitamin() { this.init.apply(this, arguments) }

// use global API
require('./global/api')(Vitamin)

// use data API
require('./data/api')(Vitamin)

// use persistence API
require('./persistence/api')(Vitamin)

// export
module.exports = Vitamin
