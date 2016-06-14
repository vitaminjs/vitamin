
var _ = require('underscore')

module.exports = {
  
  /**
   * Load the related models from the database
   * 
   * @param {Boolean} eager
   * @return Promise instance
   * @private
   */
  get: function _get(eager) {
    var results =this.query.fetchAll()
    
    if (! eager ) results.tap(this.cleanPivotAttributes.bind(this))
    
    return results
  },
  
  /**
   * Build model dictionary keyed by the given key
   * 
   * @param {Array} models
   * @param {String} key
   * @return object
   * @private
   */
  buildDictionary: function _buildDictionary(models, key) {
    this.cleanPivotAttributes(models)
    
    return _.groupBy(models, function (model) {
      return String(model.related('pivot').get(key))
    })
  },
  
  /**
   * Get the value for the relationship
   * 
   * @param {Array} value
   * @return Array
   * @private
   */
  getRelationshipValue: function _getRelationshipValue(value) {
    return value || []
  },
  
  /**
   * Clean pivot attributes from models
   * 
   * @param {Array} models
   * @private
   */
  cleanPivotAttributes: function _cleanPivotAttributes(models) {
    return models
  }
  
}
