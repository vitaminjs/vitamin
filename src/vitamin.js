
var _ = require('underscore')

var dataAPI = require('./api/data')
var globalAPI = require('./api/global')
var eventsAPI = require('./api/events')
var persistenceAPI = require('./api/persistence')

/**
 * Vitamin model constructor
 * 
 * @constructor
 */
var Vitamin = function Vitamin() { this.init.apply(this, arguments) }

// plugin usage
Vitamin
  .use(globalAPI)
  .use(dataAPI)
  .use(eventsAPI)
  .use(persistenceAPI)

// done
module.exports = Vitamin