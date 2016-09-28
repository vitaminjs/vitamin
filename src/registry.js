
var mappers = {}
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
   * Set a mapper in the registry
   *
   * @param {String} name
   * @param {Mapper} mapper
   * @return mapper
   */
  set(name, mapper) {
    if ( this.has(name) )
      throw new Error(name + " is already defined in the registry")

    return mappers[mapper.name = name.toLowerCase()] = mapper
  },

  /**
   * Get the mapper by name
   *
   * @param {String} name
   * @return mapper
   */
  get(name) {
    if (! this.has(name) )
      throw new Error(name + " is not defined in the registry")

    return mappers[name.toLowerCase()]
  },

  /**
   * Determine if the mapper name exists in the registry
   *
   * @param {String} name
   * @return boolean
   */
  has(name) {
    return !!mappers[name.toLowerCase()]
  }

}
