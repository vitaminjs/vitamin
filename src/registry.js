
var models = {}

// exports
export default {
  
  /**
   * Set a model in the registry
   * 
   * @param {String} name
   * @param {Function} model constructor
   * @return model
   */
  set(name, model) {
    if ( this.has(name) ) 
      throw new Error(name + " is already defined in the registry")
    
    return models[name] = model
  },
  
  /**
   * Get the model by name
   * 
   * @param {String} name
   * @return model constructor
   */
  get(name) {
    if (! this.has(name) ) 
      throw new Error(name + " is not defined in the registry")
    
    return models[name]
  },
  
  /**
   * Determine if the model name exists in the registry
   * 
   * @param {String} name
   * @return boolean
   */
  has(name) {
    return !!models[name]
  }
  
}
