const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const morgan = require("morgan");
const PORT = 8080; // default port 8080
const {
  findUserByEmail,
  generateRandomString,
  urlsForUser,
  addNewUser,
  authenticateUser,
} = require("./helpers");
const { urlDatabase, users } = require("./data");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(morgan("tiny"));
app.use(
  cookieSession({
    name: "session",
    keys: [
      "7d8b7d83-daf4-4071-9857-a4926eb937cf",
      "63fcc483-5b4c-41ac-94f7-e1179f907c56",
    ],
  })
);

app.get("/", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session["user_id"], urlDatabase),
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
  if (users[req.session["user_id"]]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session["user_id"]],
    };
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];

  // Authenticate the user
  const user = authenticateUser(email, password, users);

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
  if (users[req.session["user_id"]]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session["user_id"]],
    };
    res.render("register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  const user = findUserByEmail(email, users);
  if (email === "" || password === "") {
    res.status(400).send("Email and Password are required");
  } else if (!user) {
    const userId = addNewUser(email, password, users);
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
