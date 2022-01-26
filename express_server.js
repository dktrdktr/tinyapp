const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
const cookieParser = require("cookie-parser");
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const findUser = (email) => {
  const foundUser = Object.keys(users).find(
    (user) => users[user].email === email
  );
  return users[foundUser];
};

function generateRandomString() {
  const rndString = Math.random().toString(36).slice(2, 8);
  return rndString;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  console.log(users);
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const rndShortUrl = generateRandomString();
  urlDatabase[rndShortUrl] = req.body["longURL"];
  res.redirect(`/urls/:${rndShortUrl}`);
});

app.get("/urls/new", (req, res) => {
  if (!users[req.cookies["user_id"]]) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[req.cookies["user_id"]],
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  if (Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.redirect(urlDatabase[req.params.shortURL]);
  } else {
    res.render("404");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  const foundUser = findUser(email);
  if (!foundUser) {
    res.status(403).send("Email cannot be found");
  } else if (foundUser.password !== password) {
    res.status(403).send("Password does not match");
  } else {
    res.cookie("user_id", foundUser.id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  if (email === "" || password === "") {
    res.status(400).send("Email and Password are required");
  } else if (findUser(email)) {
    res.status(400).send("Email already exists");
  } else {
    const id = generateRandomString();
    users[id] = {
      id,
      email,
      password,
    };
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
