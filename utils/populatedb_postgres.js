const prisma = require("../config/prismaClient");

// This file has not been developed as yet.
// See populated_mongo.js for the approach taken

async function main() {
  await createSingleRecord();
  await getAllRecords();
}

// note the disconnect is used because this is a one-off process,
//  otherwise would allow prisma to manage the connection pool
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

async function createSingleRecord() {
  // returns a PrismaPromise
  const user = await prisma.user.create({
    data: {
      username: "john",
      salt: "gfgfgfgfgf",
      hash: "hsjdshdjsdhjs",
    },
  });
}

async function getAllRecords() {
  const users = await prisma.user.findMany();
  console.log(users);
}
