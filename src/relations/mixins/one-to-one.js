
var _ = require('underscore')

module.exports = {
  
  /**
   * Load the related model from the database
   * 
   * @return Promise instance
   * @private
   */
  _load: function _load() {
    return this.query.fetch()
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
    return _.indexBy(models, function (mdl) {
      return String(mdl.get(key))
    })
  },
  
  /**
   * Get the value for the relationship
   * 
   * @param {Model} value
   * @return null
   * @private
   */
  _getRelationshipValue: function _getRelationshipValue(value) {
    return value || null
  }
  
}
