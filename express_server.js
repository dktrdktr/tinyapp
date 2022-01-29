const express = require("express");
const methodOverride = require("method-override");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const morgan = require("morgan");
const PORT = 8080;
const {
  findUserByEmail,
  generateRandomString,
  urlsForUser,
  addNewUser,
  authenticateUser,
  updateAnalytics,
} = require("./helpers");
const { urlDatabase, users } = require("./data");
const { json } = require("body-parser");

app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));
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
app.set("view engine", "ejs");

// Redirects to the urls page, if the visitor is not logged-in redirects to the login page
app.get("/", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// Gets URLS that belong to the user
app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];
  const templateVars = {
    urls: urlsForUser(userId, urlDatabase), // returns a new object with the urls that belong to the user
    user: users[userId],
  };
  res.render("urls_index", templateVars);
});

// Creates a new URL, if the user is authenticated
app.post("/urls", (req, res) => {
  const userId = req.session["user_id"];
  if (!users[userId]) {
    res.status(400).send("Only a logged in user can do this");
  } else {
    // creates a random 6 char long string
    const rndShortUrl = generateRandomString();
    urlDatabase[rndShortUrl] = {
      longURL: req.body["longURL"],
      userID: userId,
      createdAt: new Date().toISOString(),
      analytics: {
        totalVisits: 0,
        uniqueVisitors: 0,
        visitStamp: [],
      },
    };
    res.redirect(`/urls/${rndShortUrl}`);
  }
});

// Gets a page for creating a new url, if not logged-in redirects to the login page
app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];
  if (!users[userId]) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[userId],
    };
    res.render("urls_new", templateVars);
  }
});

// Gets an individual url
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session["user_id"];
  // 404 if shortURL does not exist
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    return res.redirect("/404");
  }
  if (!users[userId]) {
    return res.status(403).send("Please login first");
  }
  if (urlDatabase[req.params.shortURL].userID !== userId) {
    return res.status(403).send("You don't have access to this URL");
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]["longURL"],
    user: users[userId],
    analytics: urlDatabase[req.params.shortURL].analytics,
  };
  res.render("urls_show", templateVars);
});

// Deletes an individual url
app.delete("/urls/:shortURL/", (req, res) => {
  const userId = req.session["user_id"];
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    return res.redirect("/404");
  }
  if (!users[userId]) {
    return res.status(403).send("Please login first");
  }
  if (urlDatabase[req.params.shortURL].userID !== userId) {
    return res.status(403).send("You don't have access to this URL");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Updates an individual url
app.put("/urls/:shortURL/", (req, res) => {
  const userId = req.session["user_id"];
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    return res.redirect("/404");
  }
  if (!users[userId]) {
    return res.status(403).send("Please login first");
  }
  if (urlDatabase[req.params.shortURL].userID !== userId) {
    return res.status(403).send("You don't have access to this URL");
  }
  urlDatabase[req.params.shortURL] = {
    ...urlDatabase[req.params.shortURL],
    longURL: req.body.newURL,
  };
  res.redirect("/urls");
});

// Redirects using the shortURL to the outbound longURL
app.get("/u/:shortURL", (req, res) => {
  if (!req.session["user_id"]) {
    req.session["visitor_id"] = generateRandomString();
  } else {
    req.session["visitor_id"] = req.session["user_id"];
  }
  if (Object.keys(urlDatabase).includes(req.params.shortURL)) {
    // analytics helper, updates visit data, only has side-effects
    updateAnalytics(
      urlDatabase,
      req.params.shortURL,
      req.session["visitor_id"]
    );
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.redirect("/404");
  }
});

// Gets a 404 error page
app.get("/404", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]],
  };
  res.render("404", templateVars);
});

// Gets a page for logging in, if the user is logged-in redirects to urls page
app.get("/login", (req, res) => {
  const userId = req.session["user_id"];
  if (users[userId]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[userId],
    };
    res.render("login", templateVars);
  }
});

// Authenticates and logs-in the user
app.post("/login", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  // Authenticates the user and returns the user object
  const user = authenticateUser(email, password, users);
  if (user) {
    req.session["user_id"] = user.id;
    res.redirect("/urls");
  } else {
    res.status(401).send("Wrong credentials");
  }
});

// Logs-out the user
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Gets the registration page, if the user is logged-in redirects to url
app.get("/register", (req, res) => {
  const userId = req.session["user_id"];
  if (users[userId]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[userId],
    };
    res.render("register", templateVars);
  }
});

// Creates a new user and redirects to urls page
app.post("/register", (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  // Finds user by email and returns the user object
  const user = findUserByEmail(email, users);
  if (email === "" || password === "") {
    return res.status(400).send("Email and Password are required");
  }
  if (!user) {
    // Adds user to the database with a hashed pass, returns the user id
    const userId = addNewUser(email, password, users);
    req.session["user_id"] = userId;
    return res.redirect("/urls");
  } else {
    res.status(400).send("Email already exists");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
