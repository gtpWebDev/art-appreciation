const prisma = require("../config/prismaClient");

/**
 * create
 * createMany
 * findUnique
 * findMany
 * findFirst
 * findMany
 * update
 * updateMany
 * upsert
 * delete
 * deleteMany
 */

async function main() {
  // await createSingleRecord();
  // await createManyRecords();
  // await createNestedSingleRecord();
  // await createMultipleNestedSingleRecord();
  // await createSingleRecordNestedMany();
  // await getSingleRecord();
  // await getAllRecords();
  // await getFirstRecord();
  // await getSomeRecords();
  // await getSomeUsingCriteriaAcrossTables();
  // await updateSingleRecord();
  // await updateMultipleRecords();
  // await updateOrCreateRecord();
  // await updateNumberRecords();
  // await deleteSingleRecord();
  // await deleteMultipleRecords();
  // await deleteAllRecords()
}

async function deleteSingleRecord() {
  const deleteUser = await prisma.user.delete({
    where: {
      email: "bert@prisma.io",
    },
  });
}

// would fail unless dealt with carefully
async function deleteMultipleRecords() {
  const deleteUsers = await prisma.user.deleteMany({
    where: {
      email: {
        contains: "prisma.io",
      },
    },
  });
}

async function deleteAllRecords() {
  const deleteUsers = await prisma.user.deleteMany({});
}

async function updateNumberRecords() {
  // can for exampleincrement
  const updatePosts = await prisma.post.updateMany({
    data: {
      views: {
        increment: 1,
      },
      likes: {
        increment: 1,
      },
    },
  });
}

//upsert - update or create
async function updateOrCreateRecord() {
  const upsertUser = await prisma.user.upsert({
    where: {
      email: "viola@prisma.io",
    },
    update: {
      name: "Viola the Magnificent",
    },
    create: {
      email: "viola@prisma.io",
      name: "Viola the Magnificent",
    },
  });
}

async function updateSingleRecord() {
  const updateUser = await prisma.user.update({
    where: {
      email: "saanvi@prisma.io",
    },
    data: {
      name: "Saanvi the Magnificent",
    },
  });
}

async function updateMultipleRecords() {
  const updateUsers = await prisma.user.updateMany({
    where: {
      email: {
        contains: "prisma.io",
      },
    },
    data: {
      role: "ADMIN",
    },
  });
}

// get any users where (have had profile views and are ADMIN) or name starts with E
async function getSomeRecords() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          name: {
            startsWith: "E",
          },
        },
        {
          AND: {
            profileViews: {
              gt: 0,
            },
            role: {
              equals: "ADMIN",
            },
          },
        },
      ],
    },
  });
  console.log(users);
}

async function getSomeUsingCriteriaAcrossTables() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        endsWith: "prisma.io",
      },
      posts: {
        some: {
          published: false,
        },
      },
    },
  });
  console.log(users);
}

// orders descending id, gets first user with at least post with >= 0 likes
async function getFirstRecord() {
  const findUser = await prisma.user.findFirst({
    where: {
      posts: {
        some: {
          likes: {
            gte: 0,
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
  console.log(findUser);
}

async function getAllRecords() {
  const users = await prisma.user.findMany();
  console.log(users);
}

async function getSingleRecord() {
  // By unique identifier
  const user1 = await prisma.user.findUnique({
    where: {
      email: "elsa@prisma.io",
    },
    // can use select to only return some fields
    select: {
      email: true,
      name: true,
    },
  });

  // By ID
  const user2 = await prisma.user.findUnique({
    where: {
      id: 2,
    },
    // optional select to collect certain details even in related tables
    select: {
      email: true,
      posts: {
        select: {
          likes: true,
        },
      },
    },
  });
  console.log(user1);
  console.log(user2);
}

async function createSingleRecord() {
  const user = await prisma.user.create({
    data: {
      email: "elsa@prisma.io",
      name: "Elsa Prisma",
    },
  });
  console.log("User", user);
}

async function createManyRecords() {
  const multData = [
    { name: "Bob", email: "bob@prisma.io" },
    { name: "Bobo", email: "bob@prisma.io" }, // Duplicate unique key!
    { name: "Yewande", email: "yewande@prisma.io" },
    { name: "Angelique", email: "angelique@prisma.io" },
  ];

  const createMany = await prisma.user.createMany({
    data: multData,
    skipDuplicates: true, // Skip 'Bobo'
  });

  console.log(multData);
}

async function createNestedSingleRecord() {
  // write a new record with one or more related records at the same time

  const result = await prisma.user.create({
    data: {
      email: "new@person",
      name: "New Person",
      posts: {
        create: [
          { title: "How to make an omelette" },
          { title: "How to eat an omelette" },
        ],
      },
    },
    include: {
      posts: true, // Include all posts in the returned object
    },
  });
}

// would need to be careful around duplicates?
async function createMultipleNestedSingleRecord() {
  const result = await prisma.user.create({
    data: {
      email: "yvette@prisma.io",
      name: "Yvette",
      posts: {
        create: [
          {
            title: "How to make an omelette",
            categories: {
              create: {
                name: "Easy cooking",
              },
            },
          },
          { title: "How to eat an omelette" },
        ],
      },
    },
    include: {
      // Include posts
      posts: {
        include: {
          categories: true, // Include post categories
        },
      },
    },
  });
}

// note cannot nest inside a create many
async function createSingleRecordNestedMany() {
  const result = await prisma.user.create({
    data: {
      email: "saanvi@prisma.io",
      posts: {
        createMany: {
          data: [{ title: "My first post" }, { title: "My second post" }],
        },
      },
    },
    include: {
      posts: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
