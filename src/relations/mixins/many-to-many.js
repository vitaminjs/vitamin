
var _ = require('underscore')

module.exports = {
  
  /**
   * Load the related models from the database
   * 
   * @return Promise instance
   * @private
   */
  _load: function _load() {
    return this.query.fetchAll().tap(this._cleanPivotAttributes.bind(this))
  },
  
  /**
   * Build model dictionary keyed by the given key
   * 
   * @param {Array} models
   * @param {String} key
   * @return object
   * @private
   */
  _buildDictionary: function _buildDictionary(models, key) {
    this._cleanPivotAttributes(models)
    
    return _.groupBy(models, function (model) {
      return String(model.related('pivot').get(key))
    })
  },
  
  /**
   * Get the default value for the relationship
   * 
   * @return Array
   * @private
   */
  _getRelatedDefaultValue: function _getRelatedDefaultValue() {
    return []
  },
  
  /**
   * Clean pivot attributes from models
   * 
   * @param {Array} models
   * @private
   */
  _cleanPivotAttributes: function _cleanPivotAttributes(models) {
    throw new Error("Should be overridden")
  }
  
}
