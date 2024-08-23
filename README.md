# skeleton-jwt-auth

A template appropriate for publishing a nodejs server with:

- full authentication framework through passport using the JSON Web Token strategy.
- configuration for a postgres database for data storage (at this stage hosted locally)

Incorporates the following elements:

- Basic project set-up with Vite
- Testing environment for react
- Basic endpoints to allow login and registration

A step-by-step guide which would set-up much of the project is described below.
However, in using this template, the steps do not need to be followed. The only things to do to get up and running are:

1. npm install
2. create .env, the public and private keys, and add the db strings

## Install the express-generator

It is assumed that the express generator has been installed globally. If not, do so:

```bash
$ npm install -g express-generator
```

## Create the express project and git repository

Create the express project, initialise the git repository locally, then add the repository to github...

### Option 1 - create the express project first:

Create the project with the projectname, from the general repo directory
(Note, this supports the ejs web templates but its likely I won't use these)

```bash
 express projectname --view=ejs
```

In the directory, install the dependencies

```bash
 npm install
```

Add **.gitignore** and remove node_modules and .env

```bash
node_modules
.env
```

Initialise the git repo, setting the name of the default branch.
Add and commit the new files.

```git
git init -b main
git add .
git commit -m "Initial commit"
```

Create the repository on github as usual, with no readme file or gitignore.
Then follow the instructions for
"…or push an existing repository from the command line"
which are more or less...

```bash
git remote add origin insertSSHhere
git branch -M main
git push -u origin main
```

A note: the default express files still use "var" syntax. Ideally these should be replaced with const or let as appropriate. This will presumably be tidied up with the next version.

## Install nodemon to enable live updates of the server

(If nodemon is installed globally, this is not necessary.)
Nodemon ensures that on any update to the server, it is refreshed.
Note though, a page refresh is still necessary to see any changes created by the server.

```bash
npm install --save-dev nodemon
```

## Add npm scripts for ease

Note the serverstart option enables console logging

```js
  "scripts": {
    "devstart": "nodemon ./bin/www",
    "serverstart": "DEBUG=projectname:* npm run devstart"
  },
```

## Bring the dependency versions up to date, and update them

**package.json**

```js
  "dependencies": {
    "cookie-parser": "^1.4.6",
    "debug": "^4.3.5",
    "express": "^4.19.2",
    "http-errors": "~2.0.0",
    "morgan": "^1.10.0",
    "ejs": "^3.1.10"
  },
```

```bash
npm install
```

## Install dotenv and set up .env

Install dotenv for environment variable handling, in dev stage at least.

```bash
npm install dotenv
```

Create **.env** and add the following environment variables:

PORT used by bin/www
NODE_ENV would be used to direct use of the dev and prod databases
DATABASE_URL is used directly by the prisma schema
RSA public and private keys enable the JWT authorisation in passport.js

```bash
PORT = 3000
NODE_ENV = "development"
DATABASE_URL = ""
RSA_PUBLIC_KEY = ""
RSA_PRIVATE_KEY = ""
```

## Install cors

Allows requests to be carried out from other domain names - e.g. separate react front end.

```bash
npm install cors
```

## Install Useful Express Middleware

express-async-handler is a simplifying library that gives a short hand for error catching, replacing a try catch structure which sends the error to the next middleware on error

express-validator is for validating the content of requests - body, params, query

```bash
npm install express-async-handler
npm install express-validator
```

## Add directory structure

1. **config** directory for database and passport configuration
2. **models** directory for data models
3. **controllers** directory for controllers
4. (**views** and **routes** directories already exist)
5. **utils** for general utility functions
6. **constants** for constants with scalability

## Authentication

Install **passport** and **passport-jwt** for the application of authenticaition using JWT
Install **crypto** and **jsonwebtoken** to generate the salt and hash at registration / generate the JWT at login/registration

```bash
npm install passport
npm install crypto
npm install passport-jwt
npm install jsonwebtoken
```

## Development of basic functionality

The following files have been created or significantly developed for the template - run through them each very carefully:

- **app.js**
- **config/passport.js**
- **routes/indexRoutes.js**
- **routes/userRoutes.js**
- **controllers/userController.js**
- **utils/authMiddleware.js**
- **utils/generateKeyPair.js**
- **utils/passwordUtils.js**
- **utils/populatedb_mongo.js** - this is here for reference but not - relevant
- **utils/populatedb_mongo.js** - this has not yet been developed
- **utils/populatedb_mongo.js** - this is a useful reference file for prisma queries

## Generate the public and private keys for the server secret

Use the follwoing command:

```bash
node utils/generateKeyPair
```

Then copy the keys generated in the lib subdirectory into .env, format:

```js
RSA_PUBLIC_KEY="-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEApZ3krY0pIX+xGt0VryRqpdEWZaNJsgT5Ea8T/T4jGT85FasNJKRG
...
6V827vuqQ3uL38lxrYV6la1RQWwmxfYW4rjyVi9bn+mSNuuW4nAhNo0CAwEAAQ==
-----END RSA PUBLIC KEY-----"
```

**Don't forget to delete the generated .pem files!**

## Setting up Prisma ORM for Postgres

Add the Prisma CLI as a development dependency and invoke it

```bash
npm install prisma --save-dev
npx prisma
```

### Setup prisma ORM

Note, the prisma element of the project is setup using the following command, which is safe to use, but because the project already has a .env and .gitignore, will only carry out part of the necessary stages:

```bash
npx prisma init
```

It will setup the prisma directory with the schema file inside **schema.prisma**

The data source in **schema.prisma** will be fine - referring to DATABASE_URL in **.env**.
For DATABASE_URL, user and password should be known. mydb in this template will be "skeleton_test" to get up and running

```bash
DATABASE_URL =
  "postgresql://<USER>>:<PASSWORD>>@localhost:5432/<MYDB>?schema=public"
```

Prisma provides useful instructions in the CLI if you're struggling.

## Set up a postgres database

Note, the below assumes that postgres is installed. If it isn't, follow the instructions [here](https://www.theodinproject.com/lessons/nodejs-installing-postgresql)

Also, [Odin](https://www.theodinproject.com/lessons/nodejs-using-postgresql) has an explanation of how to setup your database locally.

For the purposes of the template and just being able to check that everything is setup correctly, we will create or connect to a database called
**skeleton_test**

Run the Postgres shell in the terminal:

```bash
psql
```

(A useful commands is "\l" to view current databases)

If it doesn't exist, create the skeleton_test database. (The semicolons are important in postgres shell!)

```bash
CREATE DATABASE skeleton_test;
```

Change to the new database:

```bash
\c dbname
```

Exit out of postgres shell:

```bash
\q
```

## Create a starting database schema

Update **schema.prisma** with a simple User table

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         Int      @id @default(autoincrement())
  username   String   @unique
  salt       String
  hash       String
  admin      Boolean  @default(false)
}
```

Then map the data model to the database schema in the client. This does the heavy lifting of updating the database model in postgres to match that of the schema.
The documentation for migrations is [here](https://www.prisma.io/docs/orm/prisma-migrate/getting-started).

Create the first migration:

```bash
npx prisma migrate dev --name init
```

(My interpretation is that **Prisma migrate dev** is used for code driven development, creating the schema, migrating it to a postgres schema, then incrementally amending the prisma schema.)

Then similar to git commits, use text for updates

```bash
npx prisma migrate dev --name usefulupdatetext
```

(For existing projects, introspect existing databases - see the documentation)

### Install Prisma Client

```bash
npm install @prisma/client
```

Note, installing prisma client invokes **prisma generate** which generates a version of the client that is tailored to the models.

Every time the prisma schema is updated, run prisma generate again

```bash
npx prisma generate
```
