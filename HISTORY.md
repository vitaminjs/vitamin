# Vitamin changes log

### _**v0.8.4** - December 20, 2016_
- Remove `vitamin-query` dependency
- Update the `Collection` API (add search, promise and other methods)

### _**v0.8.3** - September 27, 2016_
* Add the belongs-to-many relationship `toggle` method
* Update README.md
* Fix some bugs

### _**v0.8-0** - Septempber 4, 2016_
> This is a breaking changes version, Vitamin become a Data Mapper implementation instead of the Active Record. So the mapping logic was moved to the `Mapper` class

* Export the `BaseModel`, `BaseQuery` and `Events` to separate projects
* Wrote in ES6 style and use `babeljs` as compiler
* Add the polymorphic relationships
* Add models registry
* Provide a new API

### _**v0.7.5** - June 26, 2016_
* Add Attribute accessors and mutators feature
* Add query method `paginate()` for simple pagination 
* Add query method `value()` to get a value of a single column
* Add `increment()` and `decrement()` model methods
* Change `connection()` to return the current DB connection if no parameter passed in

### _**v0.7.4** - June 23, 2016_
* Add `pluck()`, `count()`, `sum()`, `min()`, `max()` and `avg()` query methods
* Add `sync()` method to enhance many-to-many associations

### _**v0.7.3** - June 19, 2016_
* Fix: `model.get()` which returns `undefined` for falsy values
* Fix: `attach()` and `detach()` to accept also model collections
* Add `findMany`, `findOrNew`, `firstOrNew`, `firstOrCreate` Query helpers
* Add a new life-cycle event: `ready` to add more initialization logic
* `model.fetch()` accept an array of relations, as first argument, to fetch with

### _**v0.7.2** - June 15, 2016_
* Fix: for eager loading, for no parent models, we resolve without loading relationships (Performance)
* Add `newExistingInstance()` helper method in model class
* Add default attributes hash to init the model's data
* Add protection against mass assignment
* Add the ability to blacklist attributes from `toJSON()`
* Add `collections` to be used instead of arrays for relations

### _**v0.7.1** - June 12, 2016_
* Rename many-to-many joining table as `pivot` for fluent querying
* Fix: `load()` to resolve with the current model
* Fix: `getOriginal()` to return a copy of the original hash
* Add default message for custom errors
* Add relationship methods: `create()`, `createMany()`, `save()`, `saveMany()` and `updatePivot()`

### _**v0.7.0** - June 10, 2016_
* First release as an Active Record library