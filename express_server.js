const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const morgan = require("morgan");
app.use(morgan("tiny"));
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

const PORT = 8080; // default port 8080

app.use(
  cookieSession({
    name: "session",
    keys: [
      "7d8b7d83-daf4-4071-9857-a4926eb937cf",
      "63fcc483-5b4c-41ac-94f7-e1179f907c56",
    ],
  })
);

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  abc123: {
    longURL: "https://www.metro.ca",
    userID: "user2RandomID",
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

function generateRandomString() {
  const rndString = Math.random().toString(36).slice(2, 8);
  return rndString;
}

const findUser = (email, database) => {
  const foundUser = Object.keys(database).find(
    (user) => database[user].email === email
  );
  return database[foundUser];
};

const urlsForUser = (id) => {
  const urlKeys = Object.keys(urlDatabase).filter((url) => {
    return urlDatabase[url].userID === id;
  });
  const filteredUrls = {};
  for (let key of urlKeys) {
    filteredUrls[key] = urlDatabase[key];
  }
  return filteredUrls;
};

const addNewUser = (email, password) => {
  const id = generateRandomString();

  const newUserObj = {
    id,
    email,
    password: bcrypt.hashSync(password, salt),
  };

  users[id] = newUserObj;

  return id;
};

const authenticateUser = (email, password) => {
  const user = findUser(email, users);

  console.log("FORM PASSWORD:", password, "DB PASSWORD:", user.password);

  // if we got a user back and the passwords match then return the userObj
  if (user && bcrypt.compareSync(password, user.password)) {
    // user is authenticated
    return user;
  } else {
    return false;
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  console.log(urlDatabase, users);
  const templateVars = {
    urls: urlsForUser(req.session["user_id"]),
    user: users[req.session["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.status(400).send("Only a logged in user can do this");
  } else {
    const rndShortUrl = generateRandomString();
    urlDatabase[rndShortUrl] = {
      longURL: req.body["longURL"],
      userID: req.session["user_id"],
    };
    console.log("created new entry in urlDatabase", urlDatabase);
    res.redirect(`/urls/${rndShortUrl}`);
  }
});

app.get("/urls/new", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[req.session["user_id"]],
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.redirect("/404");
  } else if (!users[req.session["user_id"]]) {
    res.status(403).send("Please login first");
  } else if (
    urlDatabase[req.params.shortURL].userID !== req.session["user_id"]
  ) {
    res.status(403).send("You don't have access to this URL");
  } else {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      user: users[req.session["user_id"]],
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.redirect("/404");
  } else if (!users[req.session["user_id"]]) {
    res.status(403).send("Please login first");
  } else if (
    urlDatabase[req.params.shortURL].userID !== req.session["user_id"]
  ) {
    res.status(403).send("You don't have access to this URL");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL/", (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.redirect("/404");
  } else if (!users[req.session["user_id"]]) {
    res.status(403).send("Please login first");
  } else if (
    urlDatabase[req.params.shortURL].userID !== req.session["user_id"]
  ) {
    res.status(403).send("You don't have access to this URL");
  } else {
    urlDatabase[req.params.shortURL] = {
      ...urlDatabase[req.params.shortURL],
      longURL: req.body.newURL,
    };
    res.redirect("/urls");
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.redirect("/404");
  }
});

app.get("/404", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]],
  };
  res.render("404", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]],
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];

  // Authenticate the user
  const user = authenticateUser(email, password);

  if (user) {
    req.session["user_id"] = user.id;
    res.redirect("/urls");
  } else {
    res.status(401).send("Wrong credentials");
  }
});

app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]],
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  const user = findUser(email, users);
  if (email === "" || password === "") {
    res.status(400).send("Email and Password are required");
  } else if (!user) {
    const userId = addNewUser(email, password);
    req.session["user_id"] = userId;
    res.redirect("/urls");
  } else {
    res.status(400).send("Email already exists");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
