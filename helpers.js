const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

const findUserByEmail = (email, userDb) => {
  const foundUser = Object.keys(userDb).find(
    (user) => userDb[user].email === email
  );
  return userDb[foundUser];
};

function generateRandomString() {
  const rndString = Math.random().toString(36).slice(2, 8);
  return rndString;
}

const urlsForUser = (id, urlDb) => {
  const urlKeys = Object.keys(urlDb).filter((url) => {
    return urlDb[url].userID === id;
  });
  const filteredUrls = {};
  for (let key of urlKeys) {
    filteredUrls[key] = urlDb[key];
  }
  return filteredUrls;
};

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

const authenticateUser = (email, password, userDb) => {
  const user = findUserByEmail(email, userDb);

  // if we got a user back and the passwords match then return the userObj
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