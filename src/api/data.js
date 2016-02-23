
var _ = require('underscore')

/**
 * Attribute proxy definer
 */
function proxy(obj, key) {
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    set: function setter(value) { this.set(key, value) },
    get: function getter() { return this.get(key) }
  })
}

/**
 * Validator of schema property
 * 
 * @param {Object} property descriptor
 * @param {any} value
 */
function validate(prop, value) {
  if ( value == null && prop.required === true ) return false
  
  var valid = true,
      type = prop.type
  
  if ( type ) {
    // boolean values
    if ( type === Boolean ) valid = _.isBoolean(value)
    
    // string values
    else if ( type === String ) valid = _.isString(value)
    
    // numeric values
    else if ( type === Number ) valid = _.isNumber(value)
    
    // date values
    else if ( type === Date ) valid = _.isDate(value)
    
    // object values
    else if ( type === Object ) valid = _.isObject(value)
    
    // array values
    else if ( type === Array ) valid = _.isArray(value)
    
    // custom types
    else { valid = value instanceof type }
  }
  
  // use custom validator
  if ( _.isFunction(prop.validator) ) {
    valid = prop.validator.call(null, value)
  }
  
  return valid
}

/**
 * Coerce attribute value
 */
function coerce(prop, value) {
  if ( _.isFunction(prop.coerce) ) {
    return prop.coerce.call(null, value)
  }
  
  return value
}

function dataAPI(Model) {
  
  /**
   * Set model attributes
   */
  Model.prototype.set = function set(attr, val) {
    if ( _.isEmpty(attr) ) return this
    
    var attributes = {}
    if ( _.isObject(attr) ) { attributes = attr }
    else { attributes[attr] = val }
    
    // update model state
    var changing = this.$state.changing
    this.$state.changing = true
    if (! changing ) {
      this.$state.previous = _.clone(this.$data)
      this.$state.changed = {}
    }
    
    // for each attribute, update the current value.
    for ( attr in attributes ) {
      val = attributes[attr]
      
      // set the attribute's new value
      this._set(attr, val)
      
      // define a proxy for that attribute
      if (! _.has(this, attr) ) proxy(this, attr)
    }
    
    // prevent emit global change event in `changing` state
    if ( changing ) return this
    
    // trigger global change event
    if ( this.hasChanged() ) {
      this.emit('change', this.$state.changed, this)
    }
    
    // remove changing state
    this.$state.changing = false
    
    return this
  }
  
  /**
   * Get the value of an attribute.
   */
  Model.prototype.get = function get(attr) {
    return this.$data[attr]
  }
  
  /**
   * 
   */
  Model.prototype.has = function has(attr) {
    return !_.isUndefined(this.$data[attr])
  }
  
  /**
   * 
   */
  Model.prototype.isNew = function isNew() {
    return !this.has(this.$options.pk)
  }
  
  /**
   * 
   */
  Model.prototype.toJSON = function toJSON() {
    var json = {}, val
    
    for (var key in this.$data) {
      val = this.$data[key]
      
      // skip unsetted properties
      if ( _.isUndefined(val) ) continue
      
      // if the attribute is a nested model, call its `toJSON`
      if ( _.isObject(val) && _.isFunction(val.toJSON) ) val = val.toJSON()
      
      json[key] = val
    }
    
    return json
  }
  
  /**
   * 
   */
  Model.prototype.hasChanged = function hasChanged(attr) {
    var dirty = this.$state.changed
    
    return (attr == null) ? !_.isEmpty(dirty) : _.has(dirty, attr)
  }
      
  /**
   * 
   */
  Model.prototype.clear = function clear() {
    // save the previous state
    this.$state.previous = _.clone(this.$data)
    this.$state.changed = {}
    
    // unset all attributes
    for ( var key in this.$data ) {
      this.$data[key] = this.$state.changed[key] = void 0
    }
    
    // trigger `change` event to notify observers
    this.emit('change', this)
    
    return this
  }
  
  /**
   * Validate and set attribute value
   * 
   * @return {boolean} false if no changes made or invalid value
   * @private
   */
  Model.prototype._set = function _set(key, newVal) {
    var oldVal = this.$data[key],
        prop = this.$options.schema[key] || {}
    
    // coerce value
    newVal = coerce(prop, newVal)
    
    // validate the new value
    if (! validate(prop, newVal) ) {
      this.emit('invalid:' + key, newVal, this)
      return false
    }
    
    // if no changes, return false
    if ( oldVal === newVal ) return false
    
    this.$data[key] = newVal
    this.$state.changed[key] = newVal
    this.emit('change:' + key, newVal, this)
  }
  
  /**
   * Define data properties and set model data
   * 
   * @private
   */
  Model.prototype._initData = function _initData(data) {
    // define model data container
    Object.defineProperty(this, '$data', { value: {} })
    
    // define model state
    Object.defineProperty(this, '$state', { value: {} })
    
    // define model id
    Object.defineProperty(this, '$id', { 
      set: function setId(id) {
        this.set(this.$options.pk, id)
      },
      get: function getId() {
        return this.get(this.$options.pk)
      }
    })
    
    // set data
    this.set(data)
    this.$state.changed = {}
  }
  
  /**
   * Normalize schema object and set default attributes
   * 
   * @private
   */
  Model.prototype._initSchema = function _initSchema(schema) {
    _.each(schema, function(options, name) {
      // normalize schema object format
      if ( _.isFunction(options) ) {
        schema[name] = { 'type': options }
        return
      }
      
      // set attribute default value
      if ( _.has(options, 'default') ) {
        this.set(name, options.default)
      }
    }, this)
  }
  
}

module.exports = dataAPI