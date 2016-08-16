
import Emitter from 'vitamin-events'
import Model from './model'
import _ from 'underscore'

// exports
export default class {
  
  /**
   * Mapper class constructor
   * 
   * @param {Object} options
   * @constructor
   */
  constructor(options = {}) {
    this.tableName = options.tableName || null
    
    this.attributes = options.attributes || {}
    
    this.primaryKey = options.primaryKey || 'id'
    
    this.timestamps = options.timestamps || false
    
    this.modelClass = options.modelClass || Model
    
    this.createAtColumn = options.createdAtColumn || 'created_at'
    
    this.updatedAtColumn = options.updatedAtColumn || 'updated_at'
    
    this.emitter = new Emitter()
    this.registerEvents()
  }
  
  /**
   * Inheritance helper
   * 
   * @param {Object} props
   * @param {Object} statics
   * @return constructor function
   */
  static extend(props = {}, statics = {}) {
    var parent = this
    var child = function () { parent.apply(this, arguments) }
    
    // use custom constructor
    if ( _.has(props, 'constructor') ) child = props.constructor
    
    // set the prototype chain to inherit from `parent`
    child.prototype = Object.create(parent.prototype, {
      constructor: { value: child, writable: true, configurable: true }
    })
    
    // add static and instance properties
    _.extend(child, statics)
    _.extend(child.prototype, props)
    
    // fix extending static properties
    Object.setPrototypeOf ? Object.setPrototypeOf(child, parent) : child.__proto__ = parent
    
    return child
  }
  
  /**
   * Override it to register shared events between instances
   * 
   * @private
   */
  registerEvents() {
    // do nothing
  }
  
}
