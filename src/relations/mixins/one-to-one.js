
// exports
export default (parent) => class extends parent {
  
  /**
   * Get the result of the relationship
   * 
   * @param {Array} columns
   * @return promise
   */
  load(columns) {
    return this.getQuery().first(...arguments)
  }
  
  /**
   * Build model dictionary keyed by the given key
   * 
   * @param {Collection} related
   * @param {String} key
   * @return plain object
   * @private
   */
  buildDictionary(related, key) {
    return related.keyBy(key)
  }
  
  /**
   * Parse the value for the relationship
   * 
   * @param {Model} value
   * @return any
   * @private
   */
  parseRelationValue(value) {
    return value || null
  }
  
}