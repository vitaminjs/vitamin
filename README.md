> This library is under developments, so please help improving by testing and submitting issues. Many thanks

Vitamin provides a simple and easy to use **Data Mapper** implementation to work with your relational database.

Based on [knex](//knexjs.org), it supports **Postgres**, **MySQL**, **MariaDB**, **SQLite3**, and **Oracle** databases, 
featuring both promise based and traditional callback interfaces, providing lazy and eager relationships loading, 
and support for one-to-one, one-to-many, and many-to-many relations.

- [Installation](#installation)
- [Defining models](#defining-models)
- [CRUD operations](#crud-operations)
  - [Create](#create)
  - [Read](#read)
  - [Update](#update)
  - [Delete](#delete)
- [Events](#events)
- [Collections](#collections)
- [Associations](#associations)
  - [Defining relations](#defining-relations)
    - [One To One](#one-to-one)
    - [One To Many](#one-to-many)
    - [Many To Many](#many-to-many)
    - [Polymorphic relations](#polymorphic-relations)
  - [Querying relations](#querying-relations)
    - [Lazy loading](#lazy-loading)
    - [Eager loading](#eager-loading)
    - [Saving related models](#saving-related-models)
      - [create](#create-and-createmany)
      - [save](#save-and-savemany)
      - [associate](#associate-and-dissociate)
      - [attach](#attach-detach-and-updatepivot)
      - [sync](#sync)
      - [toggle](#toggle)

***

## Installation

```bash
$ npm install --save vitamin

# Then add one of the supported database drivers
$ npm install pg
$ npm install mysql
$ npm install mysql2
$ npm install oracle
$ npm install sqlite3
$ npm install mariasql
$ npm install strong-oracle
```

Vitamin is initialized by passing an initialized Knex client instance.
The [knex documentation](//knexjs.org/#Installation) provides a number of examples for different use cases.

```js
// for example the database configuration is located at "app/config/database.js"
var knex = require('knex')({
  client: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'your_database_user',
    password : 'your_database_password',
    database : 'your_database_name',
    charset  : 'utf8'
  }
})

// exports
export default require('vitamin')(knex)
```

***

## Defining models

To get started, let's define a user model by specifying both, the `primaryKey` name, and the `tableName`

```js
// using the previous initialized vitamin object,
// we define a model called `user` using `model` method of vitamin object
export default vitamin.model('User', {
  
  // the primary key, default to `id`
  primaryKey: 'user_id',
  
  // the table name
  tableName: 'users',
  
  // set the default values of the model attributes
  defaults: {
    active: true,
    verified: false
  }
  
})
```

> `vitamin.model()` also accepts a custom mapper instance passed as a second argument instead of a config object.

## CRUD operations

> You can use the standard Node.js style callbacks by calling `.asCallback(function (error, result) {})` on any promise method

### Create

To create a new record in the database, simply create a new model instance, set its attributes, then call the `save` method

```js
// access the model defined earlier
var User = vitamin.model('User')

// we create a new instance of User model with `make()`
var user = User.make({ name: "John", occupation: "Developer" })
// or simply with the new operator
var user = new User({ name: "John", occupation: "Developer" })

// then we save it
user.save().then(result => {
  assert.deepEqual(result, user)
  assert.ok(result instanceof User)
})

// or using the callbacks
user.save().asCallback((error, result) => {
  if ( error ) throw error
  
  assert.deepEqual(result, user)
  assert.ok(result instanceof User)
})
```

Another shorthand to create and save a new user is the static method `create()`

```js
User
  .create({ name: "John", occupation: "Developer" })
  .catch(error => { ... })
  .then(model => {
    assert.ok(model instanceof User)
  })
```

### Read

Below a few examples of different data access methods provided by vitamin

* Retrieving multiple models

```js
// get a collection of all users
User.query().fetch().then(result => {
  assert.ok(result instanceof Collection)
})
```
The `fetch()` method will return all the rows in the `users` table as a [collection](#collections) of `User` models.

If you may also add constraints to queries, you can use the `where()` methods in the `query builder` object returned by `query()`

```js
User.query().where('role', "guest").offset(10).limit(15).fetch(['column1', 'column2', '...']).then(result => {
  assert.ok(result instanceof Collection)
  assert.ok(result.first() instanceof User)
})
```

The `findMany()` query method return a [collection](#collections) of models by their primary keys

```js
User.query().findMany([1, 2, 3]).then(result => {
  assert.ok(result instanceof Collection)
  assert.equal(result.length, 3) // we expect getting 3 models
})
```

* Retrieving single model

Of course, in addition to retrieve all records of a given table, you may also retrieve a single record using `find()` or `first()`
Instead of returning a collection of models, these methods return only a single model instance

```js
// find a user by its primary key
User.query().find(123).then(result => {
  assert.ok(result instanceof User)
  assert.equal(result.getId(), 123)
})

// fetch the `id` and `email` of the first admin user
User.query().where('is_admin', true).first('id', 'email').then(result => {
  assert.ok(result instanceof User)
  assert.ok(result.get('is_admin'))
})
```
> `findOrFail()`, `findOrNew()`, `firstOrCreate()`, `firstOrNew()`, `firstOrFail()` query methods are also available

> `findOrFail()` and `firstOrFail()` throw a `ModelNotFoundError` if no result found

### Update

The `save()` model method may be used to update a single model that already exists in the database.
To update a model, you should retrieve it, change any attributes you wish to update, and then call the `save()`

```js
// post model is retrieved from `posts` table
// then we modify the status attribute and save it
var Post = vitamin.model('post')

Post.query().find(1).then(post => post.set('status', "draft").save())
```

In case you have many attributes to edit, you may use the `update()` method directly

```js
var data = { 'status': "published", 'published_at': new Date }

Post.query().find(1).then(post => post.update(data)).then(result => {
  assert.deepEqual(result, post)
  assert.equal(result.get('status'), 'published')
})
```

### Delete

Likewise, once retrieved, a model can be destroyed which removes it from the database.
To delete a model, call `destroy()` on an existing model instance

```js
Post.make({ id : 45 }).destroy().then(result => {
  assert.deepEqual(result, post)
})
```

Of course, you may also run a delete query on a set of models.

```js
// we will delete all posts that are marked as draft
Post.query().where('status', 'draft').destroy().then(...)
```

## Events

Model events allow you to attach code to certain events in the lifecycle of yours models. 
This enables you to add behaviors to your models when those built-in events `creating`, `created`, `saving`, `saved`, `updating`, `updated`, `deleting` or `deleted` occur.

Events can be defined when you register the model using the `events` config property

```js
vitamin.model('user', {
  
  ...
  
  events: {
    
    'creating': handlerFn,
    
    'saved': [
      handler1,
      handler2,
    ]
  }
  
})
```

Or, later with the static method `on()`

```js
// attach a listener for `created` event
User.on('created', function (user) {
  assert.ok(user instanceof User)
})

// Events `saving - creating - created - saved` are fired in order when we create a new model
>>> User.create({ name: "John", occupation: "Developer" })
```

You can also attach the same handler for many events separated by a white space

```js
Post.on('creating updating', updateTimestamps)
```

The built-in events are fired automatically by the mapper, but you can trigger manually those events, or any custom ones with `emit()`

```js
Post.make().emit('saving')

orderModel.emit('purchased', ...arguments)
```

***

## Collections

All multi-result methods, like `fetch()` or `findMany()`, return instances of the `Collection` class instead of simple arrays.

However, collections are much more powerful than arrays and expose a variety of operations, including saving of emiting events, that may be chained using an intuitive interface.

```js
// retrieve the draft posts and make a delete query to remove those without 'publish_date'
Post
  .query()
  .where('status', 'draft')
  .fetch()
  .then(posts => {
    assert.ok(posts instanceof Collection)

    // destroy 
    return posts.filter(model => model.get('publish_date') != null).destroy()
  })
  .then(deleted_posts => {
    assert.ok(deleted_posts instanceof Collection)
  })
```

***

## Associations

Vitamin makes managing and working with relationships easy, and supports several types of relations:

* One To One
* One To Many
* Many To Many
* Polymorphic relations

### Defining relations

#### One to One

Let's define a relation one to one between `Person` and `Phone`.
```js
var Phone = vitamin.model('phone', {
  
  tableName: 'phones',
  
  relations: {
    
    owner: function () {
      // BelongsTo is the inverse relation of HasOne and HasMany
      // we refer to`Person` model by its name
      // the `owner_id` is the foreign key in `phones` table
      // the `id` is the primary key of the people table
      return this.belongsTo('person', 'owner_id', 'id')
    }
    
  }
  
})

var Person = vitamin.model('person', {
  
  tableName: 'people',
  
  relations: {
    
    phone: function () {
      // the first argument is the target model name
      // the second is the foreign key in phones table
      // the third parameter is optional, it corresponds to the primary key of person model
      return this.hasOne('phone', 'owner_id', 'id')
    }
    
  }
  
})
```

#### One To Many

An example for this type, is the relation between blog `Post` and its `Author`
```js
var User = vitamin.model('user', {
  
  tableName: 'users',
  
  relations: {
    
    posts: function () {
      // if the foreign key is not provided, 
      // vitamin will use the parent model name suffixed by '_id',
      // as a foreign key in the `posts` table, in this case `author_id`
      return this.hasMany('post')
    }
    
  }
  
})

var Post = vitamin.model('post', {
  
  tableName: 'posts',
  
  relations: {
    
    author: function () {
      return this.belongsTo('user', 'author_id')
    }
    
  }
  
})
```

#### Many To Many

This relation is more complicated than the previous. 
An example of that is the relation between `Product` and `Category`, when a product has many categories, and the same category is assigned to many products. 
A pivot table `product_categories` is used and contains the relative keys `product_id` and `category_id`
```js
vitamin.model('product', {
  
  tableName: 'products',
  
  relations: {
    
    categories: function () {
      return belongsToMany('category', 'product_categories', 'category_id', 'product_id')
    }
    
  }
  
})

vitamin.model('category', {
  
  tableName: 'categories',
  
  relations: {
    
    products: function () {
      return belongsToMany('product', 'product_categories', 'product_id', 'category_id')
    }
    
  }
  
})
```

#### Polymorphic relations

Polymorphic relations allow a model to belong to more than one other model on a single association.
For example, the users of the application can like both comments and posts.
Using polymorphic relationships, you can use a single `Like` model for the both scenarios.

Here is the schema  of this example database:
```
posts (id, title, body)
comments (id, post_id, body)
likes (id, likeable_id, likeable_type)
```
The `likeable_id` column will contain the ID of the post or the comment, while the `likeable_type` will contain the name of the owning model.

```js
var Post = vitamin.model('post', {
  
  relations: {
    
    likes: function () {
      return this.morphMany('like', 'likeable')
    }
    
  }
  
})

var comment = vitamin.model('', {
  
  relations: {
    
    likes: function () {
      return this.morphMany('like', 'likeable')
    }
    
  }
  
})

var Like = vitamin.model('like', {
  
  relations: {
    
    likeable: function () {
      // the inverse relation of `morphOne` and `morphMany`
      return this.morphTo('likeable')
    }
    
  }
  
})
```

In addition to those associations, you can also define many-to-many polymorphic relations.
For example, a `Post` and `Video` models could share both a relation to `Tag` model.
Using a polymorphic many-to-many relation, you can use a single list of unique tags that are shared across blog posts and videos, or any other model.

```
tags (id, name)
posts (id, title, body)
videos (id, name, filename)
taggables (tag_id, taggable_id, taggable_type)
```
```js
var Post = vitamin.model('post', {
  
  relations: {
    
    tags: function () {
      return this.morphToMany('tag', 'taggables', 'taggable')
    }
    
  }
  
})

// `taggables` is the pivot table name.
// `taggable` will be used as a prefix for morph columns `taggable_id` and `taggable_type`

var Tag = vitamin.model('tag', {
  
  relations: {
    
    posts: function () {
      return this.morphedByMany('post', 'taggables', 'taggable')
    },
    
    videos: function () {
      return this.morphedByMany('video', 'taggables', 'taggable')
    }
    
  }
  
})
```

### Querying relations

#### Lazy loading

We will use the relations defined below, to lazy load the related models
```js
// load the related phone model of the person with the id 123
// we access the relation via `phone()` which return a HasOne relation instance
var person = Person.make({ id: 123 })

person.load(['posts']).then(function (model) {
  assert.equal(model, person)
  assert.instanceOf(model.getRelated('posts'), Collection)
})
```

#### Eager loading

To load a model and its relationships in one call, you can use the query method `withRelated`
```js
// fetch the first article and its author
Post.query().withRelated('author').first().then(function (post) {
  assert.instanceOf(post.getRelated('author'), User)
})

// load all authors with their posts
User.query().withRelated('posts').fetch().asCallback((error, authors) => {
  assert.instanceOf(authors, Collection)
  
  authors.forEach(function (author) {
    assert.instanceOf(author.getRelated('posts'), Collection)
    assert.instanceOf(author.getRelated('posts').first(), Post)
  })
})
```

### Saving related models

Instead of manually setting the foreign keys, Vitamin provides many methods to save the related models.

#### `create()` and `createMany()`

In addition to the `save` and `saveMany` methods, you may also use the `create` method, 
which accepts an array of attributes, creates a model, and inserts it into the database.

```js
// create and attach a post comment
post.comments().create({ body: "Hello World !!" }).then(function (error, model) {
  assert.instanceOf(model, Comment)
})

// create and attach the post comments
post.comments().createMany([
  { body: "first comment" }, { body: "second comment" }
]).then(function (result) {
  assert.instanceOf(result, Collection)
  assert.instanceOf(result.first(), Comment)
})
```

#### `save()` and `saveMany()`

```js
var comment = Comment.make({ body: "Hello World !!" })

// saving and attach one comment
post.comments().save(comment).then(
  function (model) {
    assert.equal(model, comment)
  },
  function (error) {
    ...
  }
)

// saving many events
post.comments().saveMany([
  Comment.make({ body: "first comment" }),
  Comment.make({ body: "second comment" })
]).then(function (result) {
  assert.instanceOf(result, Collection)
  assert.instanceOf(result.first(), Comment)
})
```

#### `associate()` and `dissociate()`

When updating a `belongsTo` or `morphTo` relationship, you may use the `associate` method.

```js
var john = Person.make({ id: 123 })

// set the foreign key `owner_id` and save the phone model
phone.owner().associate(john).save().then(...)

// unset the foreign key, then save
like.likeable().dissociate().save().then(...)
```

#### `attach()`, `detach()` and `updatePivot()`

When working with many-to-many relationships, Vitamin provides a few additional helper methods to make working with related models more convenient.

```js
// to attach a role to a user by inserting a record in the joining table
user.roles().attach(roleId).then(
  function (result) {
    ...
  },
  function (error) {
    ...
  }
)
```

To remove a many-to-many relationship record, use the detach method.

```js
// detach all roles of the loaded user
user.roles().detach().asCallback(function (error, result) {
  ...
})

// detach only the role with the given id
user.roles().detach(roleId).then(...)

// detach all roles with the given ids
user.roles().detach([1, 2, 3]).then(...)
```

If you need to update an existing row in your pivot table, you may use `updatePivot` method

```js
user.roles().updatePivot(roleId, pivotAttributes).then(...)
```

#### `sync()`

You may also use the `sync` method to construct many-to-many associations. 
The sync method accepts an array of IDs to place on the intermediate table. 
Any IDs that are not in the given array will be removed from the intermediate table. 
So, after this operation is complete, only the IDs in the array will exist in the intermediate table:

```js
// using callbacks
user.roles().sync([1, 2, 3], function (error, result) {
  ...
})

// using promises
user.roles().sync([1, 2, 3]).then(...)
```
You may also pass additional intermediate table values with the IDs:
```js
user.roles().sync([[1, { 'expires': true }], 2]).then(...)
```

#### `toggle`

This method allows you toggle relationships without pain.
It accepts a model, an ID or an array of IDs, and sync _only_ those ids without affecting the others.
Useful for `likes`, `stars` or `following` relationships

```js
// grant or revoke the admin role to a specific user
user.roles().toggle(adminRole).then(...)

// add or remove a like on a project
user.likes().toggle(someProjectId).then(...)
```