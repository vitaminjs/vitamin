
var _ = require('underscore')

module.exports = Collection

/**
 * Collection constructor
 * 
 * @constructor
 */
function Collection(models) {
  this.models = ( _.isArray(models) ) ? models : []
  this.length = this.models.length
}

_.extend(Collection.prototype, {
  
  /**
   * Get the collection as an array of plain objects
   * 
   * @return Array
   */
  toJSON: function toJSON() {
    return _.invoke(this.models, 'toJSON')
  },
  
  /**
   * Get all items as a plain array
   * 
   * @return Array
   */
  toArray: function toArray() {
    return this.models.slice()
  },
  
  /**
   * Get an array with the values of the given key
   * 
   * @param {String} key
   * @return Array
   */
  pluck: function pluck(key) {
    return _.map(this.models, function (model) {
      return model.get(key)
    })
  },
  
  /**
   * Run a map callback over each model
   * 
   * @param {Function} fn
   * @param {Object} context
   * @return Collection
   */
  map: function map(fn, context) {
    return new Collection(_.map(this.models, fn, context))
  },
  
  /**
   * Execute a callback over each model
   * 
   * @param {Function} fn
   * @param {Object} context
   * @return this collection
   */
  forEach: function forEach(fn, context) {
    _.each(this.models, fn, context)
    return this
  },
  
  /**
   * Get the primary keys of the collection models
   * 
   * @return Array
   */
  keys: function keys() {
    return _.map(this.models, function (model) {
      return model.getId()
    })
  },
  
  /**
   * Get the first model, or null if the collection is empty
   * 
   * @return Model
   */
  first: function first() {
    return _.first(this.models) || null
  },
  
  /**
   * Get the last model, or null if the collection is empty
   * 
   * @return Model
   */
  last: function last() {
    return _.last(this.models) || null
  },
  
  /**
   * Group the collection by field or using a callback
   * 
   * @param {String|Function} iteratee
   * @param {Object} context
   * @return Object
   */
  groupBy: function groupBy(iteratee, context) {
    if ( _.isString(iteratee) ) {
      var key = iteratee
      
      iteratee = function (model) {
        return model.get(key)
      }
    }
    
    return _.groupBy(this.models, iteratee, context)
  },
  
  /**
   * Key the collection by field or using a callback
   * 
   * @param {String|Function} iteratee
   * @param {Object} context
   * @return Object
   */
  keyBy: function keyBy(iteratee, context) {
    if ( _.isString(iteratee) ) {
      var key = iteratee
      
      iteratee = function (model) {
        return model.get(key)
      }
    }
    
    return _.indexBy(this.models, iteratee, context)
  }
  
})
