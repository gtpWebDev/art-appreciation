#! /usr/bin/env node

// This script populates some test data for the development stage
// Invoke with LCI command: - e.g.: node populatedb databaseurl
// databaseurl = "mongodb+srv://ADDUSERNAME:ADDPASSWORD@cluster0.lz91hw2.mongodb.net/ADDDATABASENAME?retryWrites=true&w=majority"
// (user name = "admin" will work but guess can also add other usernames)

// Get arguments passed on command line - in this case the database url
const userArgs = process.argv.slice(2);

const Account = require("../models/accountModel");

// used to link data correctly
const accounts = [];

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
  console.log("Debug: About to connect");
  await mongoose.connect(mongoDB);
  console.log("Debug: Should be connected?");

  // delete collections if they exist
  await deleteCollection("accounts");

  await createAccounts();

  console.log("Debug: Closing mongoose");
  mongoose.connection.close();
}

async function deleteCollection(collectionName) {
  const collections = await mongoose.connection.db
    .listCollections({ name: collectionName })
    .toArray();
  if (collections.length > 0) {
    // Drop the collection
    await mongoose.connection.db.dropCollection(collectionName);
    console.log(`Collection '${collectionName}' deleted successfully.`);
  }
}

async function createAccounts() {
  console.log("Adding accounts");
  // works with password "123"
  await Promise.all([
    accountCreate(
      0,
      "glen", // works with password "123"
      "f929fa38ea0de15e767c87420c0c912bc5d0c99b6df071610d64f2cd55f95b18",
      "d882f18e672b6fd138156ec9d159d892cdd7ccecf7d55da2703b48b7f8a4dd2a152ff5c6dba841de91ee1303ddd4ec933a5392c2ca1b55f9250d6751d74c0883",
      true
    ),
    accountCreate(
      1,
      "john", // works with password "456"
      "fd41e1e4105f9893caac816211e33c177ebe13df8aa30be25f55a97ca2363261",
      "32f3f57672e8be7df8842373820a1aa9196ca0c29ac28479dbe53857132ffb721065958495683ca26831832dd1673ef889b84422538eb48086c6a0235d07a92b",
      false
    ),
  ]);
}

// We pass the index to the ...Create functions so that, for example,
// condition[0] will always be the same condition, regardless of the order
// in which the elements of promise.all's argument complete.
async function accountCreate(index, username, salt, hash, admin) {
  const dateNow = new Date();
  const account = new Account({
    index: index,
    username: username,
    date_registered: dateNow,
    salt: salt,
    hash: hash,
    admin: admin,
  });
  await account.save();
  accounts[index] = account;
}
