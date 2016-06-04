# vitamin (alpha)
ActiveRecord library for Node.js applications

## Introduction
Vitamin provides a simple and easy to use ActiveRecord implementation for working with your database. It supports **Postgres**, **MySQL**, **MariaDB**, **SQLite3**, and **Oracle**.

Each database table or view is wrapped into a "Model" class. Thus, a model instance is tied to a single row in the table. Models allow you to query for data in your tables, as well as inserting or updating records.

Vitamin is featuring both promise based and traditional callback interfaces, providing lazy and eager relationships loading, and support for one-to-one, one-to-many, and many-to-many relations.

***

## Installation
```sh
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

Database connection is initialized by passing a config object to `connection` static method. The [knex documentation](//knexjs.org/#Installation) provides a number of examples for different databases.

```js
var Model = require('vitamin/model')

// provide a config object for MySQL which will be used by knex
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
