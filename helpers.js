const findUserByEmail = (email, database) => {
  const foundUser = Object.keys(database).find(
    (user) => database[user].email === email
  );
  return database[foundUser];
};

module.exports = { findUserByEmail };
