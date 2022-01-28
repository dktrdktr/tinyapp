const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

// Finds user by email and returns user object
const findUserByEmail = (email, userDb) => {
  const foundUser = Object.keys(userDb).find(
    (user) => userDb[user].email === email
  );
  return userDb[foundUser];
};

// Creates a random 6 character long string
function generateRandomString() {
  const rndString = Math.random().toString(36).slice(2, 8);
  return rndString;
}

// Returns a new object with the urls that belong to the user
const urlsForUser = (id, urlDb) => {
  // Find the keys of the urls that belong to the user
  const userUrlKeys = Object.keys(urlDb).filter((url) => {
    return urlDb[url].userID === id;
  });
  // Create a new object with the urls of the user
  const userUrls = {};
  for (let key of userUrlKeys) {
    userUrls[key] = urlDb[key];
  }
  return userUrls;
};

// Adds a new user to the user database with a hashed password, returns the user id
const addNewUser = (email, password, userDb) => {
  const id = generateRandomString();

  const newUserObj = {
    id,
    email,
    password: bcrypt.hashSync(password, salt),
  };

  userDb[id] = newUserObj;

  return id;
};

// Returns the user object if the user exists and the passwords match
const authenticateUser = (email, password, userDb) => {
  const user = findUserByEmail(email, userDb);
  if (user && bcrypt.compareSync(password, user.password)) {
    // user is authenticated
    return user;
  } else {
    return false;
  }
};

module.exports = {
  findUserByEmail,
  generateRandomString,
  urlsForUser,
  addNewUser,
  authenticateUser,
};
