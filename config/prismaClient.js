/**
 * Modules are cached after the first time they are loaded.
 * Every call to this file will get the same object.
 * This avoids multiple PrismaClient instances
 * https://nodejs.org/api/modules.html#modules_caching
 *
 * It is also advised not to explicitly disconnect for long running apps
 * So only disconnect for one-off exercises like populating the db.
 *
 * Running the first query creates a connection pool
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query", // Log queries
    },
    {
      emit: "stdout",
      level: "info", // Log general information
    },
    {
      emit: "stdout",
      level: "warn", // Log warnings
    },
    {
      emit: "stdout",
      level: "error", // Log errors
    },
  ],
});

// prisma.$on("query", (event) => {
//   console.log(`Query: ${event.query}`);
//   // console.log(`Params: ${event.params}`);
//   console.log(`Duration: ${event.duration}ms`);
// });

module.exports = prisma;
