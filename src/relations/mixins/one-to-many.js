
import Promise from 'bluebird'

// exports
export default (parent) => class extends parent {
  
  /**
   * Get the result of the relationship
   * 
   * @return promise
   */
  load() {
    this.getQuery().fetch()
  }
  
  /**
   * Create many instances of the related model
   * 
   * @param {Array} records
   * @parma {Array} returning
   * @return promise
   */
  createMany(records, returning = ['*']) {
    return Promise.map(records, attrs => this.create(attrs, returning))
  }
  
  /**
   * Attach many models to the parent model
   * 
   * @param {Array} models
   * @parma {Array} returning
   * @return promise
   */
  saveMany(models, returning = ['*']) {
    return Promise.map(models, model => this.save(model, returning))
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
    return related.groupBy(key)
  }
  
}