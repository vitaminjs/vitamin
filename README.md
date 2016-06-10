# Vitamin

Vitamin provides a simple and easy to use ActiveRecord implementation for working with your database. Each table or view is wrapped into a "Model" class. Thus, a model instance is tied to a single row in the table. Models allow you to query for data in your tables, as well as inserting or updating records.

It supports **Postgres**, **MySQL**, **MariaDB**, **SQLite3**, and **Oracle** databases, featuring both promise based and traditional callback interfaces, providing lazy and eager relationships loading, and support for one-to-one, one-to-many, and many-to-many relations.

***

## Installation
```
$ npm install --save vitamin

# Then add one of the following (adding a --save) flag:
$ npm install pg
$ npm install sqlite3
$ npm install mysql
$ npm install mysql2
$ npm install mariasql
$ npm install strong-oracle
$ npm install oracle
```

Database connection is initialized by passing a config object to `connection` static method. The [knex documentation](//knexjs.org/#Installation) provides a number of examples for different use cases.

```js
var Model = require('vitamin/model')

// An example of config object for MySQL which will be used by knex
Model.connection({
  client: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test',
    charset  : 'utf8'
  }
})
```

## Examples of usage

### Defining models

```js
var Model = require('vitamin/model')

var User = new Model.extend({
  
  // the primary key, defaults to `id`
  $pk: 'id',
  
  // the table name
  $table: 'users'
  
})
```

### CRUD : Reading and writing data

#### 1 - Create
```js
// we create a new instance of User model with `factory` method
var user = User.factory({ name: "John", occupation: "Developer" })

// or set the attributes manually after instantiation
var user = new User
user.set('name', "John")
user.set('occupation', "Developer")

// then we save it

// using callbacks
user.save(function (error, result) {
  assert.instanceOf(Model, result)
})

// or using promises
user.save().then(
  function (result) {
    assert.instanceOf(Model, result)
  },
  function (error) {
    ...
  }
)
```
Another shorthand to create and save a new user is the `create` method
```js
var data = { name: "John", occupation: "Developer" }

// using callabcks
User.create(data, function (error, result) {
  assert.instanceOf(Model, result)
})

// using promises
User.create(data).then(
  function (result) {
    assert.instanceOf(Model, result)
  }, 
  function (error) {
    ...
  }
)
```

#### 2 - Read

Below a few examples of different data access methods provided by Vitamin

* Retrieving multiple models

```js
// get na array of all users 

// using callbacks
User.all(function (error, result) {
  assert.isArray(result)
})

// using promises
User.all().then(
  function (result) {
    assert.isArray(result)
  },
  function (error) {
    ...
  }
)
```

```js


// using callbacks
User.where('role', "guest").limit(15).fetchAll(function (error, result) {
  ...
})

// using promises
User.where('role', "guest").limit(15).fetchAll().then(
  function (result) {
    ... 
  },
  function (error) {
    ...
  }
)
```

* Retrieving single model

```js
// find a user by its primary key

// using callbacks
User.find(123, function (error, result) {
  assert.instanceOf(Model, result)
})

// using promises
User.find(123).then(
  function (result) {
    assert.instanceOf(Model, result)
  },
  function (error) {
    ...
  }
)
```

```js
// using callbacks
User.where('is_admin', true).fetch(function (error, result) {
  ...
})

// using promises
User.where('is_admin', true).fetch().then(
  function (result) {
    ...
  },
  function (error) {
    ...
  }
)
```

#### 3 - Update
The `save` method may also be used to update a single model that already exists in the database.
```js
// post model is retrieved from `posts` table
// then we modify the status attribute and save it
Post
  .find(1)
  .then(function (post) {
    return post.set('status', "draft").save()
  })
```

#### 4 - Delete
Likewise, once retrieved, a model can be destroyed which removes it from the database

```js
User.find(123).then(function (user) {
  return user.destroy()
})
```










