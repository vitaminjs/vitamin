
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
    return this.query.fetchAll()
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
    return models.groupBy(key)
  },
  
  /**
   * Get the value for the relationship
   * 
   * @param {Array} value
   * @return Collection
   * @private
   */
  getRelationshipValue: function _getRelationshipValue(value) {
    return this.related.newCollection(value || [])
  }
  
}
