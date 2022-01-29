const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    createdAt: "2015-03-25T12:00:00.000Z", // look into that
    analytics: {
      totalVisits: 0,
      uniqueVisitors: 0,
      visitStamp: [],
    },
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    createdAt: "2015-03-25T12:00:00.000Z", // look into that
    analytics: {
      totalVisits: 0,
      uniqueVisitors: 0,
      visitStamp: [],
    },
  },
  abc123: {
    longURL: "https://www.metro.ca",
    userID: "user2RandomID",
    createdAt: "2015-03-25T12:00:00.000Z", // look into that
    analytics: {
      totalVisits: 0,
      uniqueVisitors: 0,
      visitStamp: [],
    },
  },
};

const users = {
  testUser: {
    id: "testUser",
    email: "test@test.lt",
    password: bcrypt.hashSync("test", salt),
  },
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", salt),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", salt),
  },
  aJ48lW: {
    id: "aJ48lW",
    email: "user3@example.com",
    password: bcrypt.hashSync("test", salt),
  },
};

module.exports = {
  urlDatabase,
  users,
};
