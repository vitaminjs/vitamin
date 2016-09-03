
var models = {}
var connections = {}

// exports
export default {
  
  /**
   * Register a connection object
   * 
   * @param {String} name
   * @param {Object} object
   * @return connection
   */
  connection(name = 'default', object = null) {
    name = name.toLowerCase()
    
    if ( object != null ) {
      if ( connections[name] )
        throw new Error(`${name} connection is already defined`)
      
      connections[name] = object
    }
    
    if (! connections[name] )
      throw new Error(`${name} connection is not yet defined`)
    
    return connections[name]
  },
  
  /**
   * Set a model in the registry
   * 
   * @param {String} name
   * @param {Function} model constructor
   * @return model
   */
  set(name, model) {
    name = name.toLowerCase()
    
    if ( this.has(name) ) 
      throw new Error(name + " is already defined in the registry")
    
    model.name = name
    
    return models[name] = model
  },
  
  /**
   * Get the model by name
   * 
   * @param {String} name
   * @return model constructor
   */
  get(name) {
    name = name.toLowerCase()
    
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
    return !!models[name.toLowerCase()]
  }
  
}
