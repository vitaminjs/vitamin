
var _ = require('underscore')

module.exports = {
  
  /**
   * Load the related model from the database
   * 
   * @param {Boolean} eager
   * @return Promise instance
   * @private
   */
  get: function _get(eager) {
    return eager ? this.query.fetchAll() : this.query.fetch()
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
    return models.keyBy(key)
  },
  
  /**
   * Get the value for the relationship
   * 
   * @param {Model} value
   * @return null
   * @private
   */
  getRelationshipValue: function _getRelationshipValue(value) {
    return value || null
  }
  
}
