
var _ = require('underscore')

function storageError() {
  throw new Error("A storage adapter must be specified")
}

function persistenceAPI(Model) {
  
  /**
   * Find all models from storage
   * 
   * @param {Object} options
   * @return Promise
   * 
   * @static
   */
  Model.all = function all(options) {
    var Self = this, 
        adapter = this.options.adapter
    
    if (! adapter ) storageError()
    
    function finish(list) {
      return _.map(list, function(data) { return Self.factory(data) })
    }
    
    return adapter.all(options).then(finish)
  }
  
  /**
   * Find a model by primary key
   * 
   * @param {mixed} model's id
   * @param {Object} options
   * @return Promise
   * 
   * @static
   */
  Model.find = function find(id, options) {
    return this.factory(id).fetch(options)
  }
  
  /**
   * Create and save a new model
   * 
   * @param {Object|Vitamin} a model instance or data object
   * @param {Object} options
   * @return Promise
   * 
   * @static
   */
  Model.create = function create(model, options) {
    if (! (model instanceof Model) ) model = this.factory(model)
      
    return model.save(options)
  }
  
  /**
   * Fetch fresh data from data source
   * 
   * @param {object} options
   * @return Promise
   */
  Model.prototype.fetch = function fetch(options) {
    var model = this
    
    if (! this.$adapter ) storageError()
    
    function finish(data) {
      return model.set(data).emit('sync', model)
    }
          
    return this.$adapter.fetch(model, options).then(finish)
  }
  
  /**
   * Save the model's data
   * 
   * @param {object} hash of attributes and values
   * @param {object} options
   * @return Promise
   */
  Model.prototype.save = function save(options) {
    var model = this
    
    if (! this.$adapter ) storageError()
    
    function finish(data) {
      return model.set(data).emit('sync', model)
    }
    
    return this.$adapter.save(model, options).then(finish)
  }
  
  /**
   * Destroy the model
   * 
   * @param {object} options
   * @return Promise
   */
  Model.prototype.destroy = function destroy(options) {
    var model = this
    
    if (! this.$adapter ) storageError();
    
    function finish(data) {
      return model.emit('destroy', model)
    }
    
    return this.$adapter.destroy(model, options).then(finish)
  }
  
  /**
   * 
   * @private
   */
  Model.prototype._initAdapter = function _initAdapter(adapter) {
    // define adapter property
    Object.defineProperty(this, '$adapter', { value: adapter })
  }
  
}

module.exports = persistenceAPI