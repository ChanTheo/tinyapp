// including all the packages we will need
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const getUserByEmail = require('./helpers.js');

// intializing all the packages we required
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['random', 'tea', 'sky', 'hello there', 'something else'],
  maxAge: 1000 * 60 * 60 * 24
}));

// function generates a random 6 char string
const generateRandomString = function() {
  let result = "";
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;

  for (let index = 0; index < 6; index++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));

  }

  return result;
};

// Globally scoped objects that are our databases in memory

// urlDatabase: keeps short url as the key: now it keeps track of the user that created it

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};
// create a function that only returns the urls where the userID in the database is equal to the id of the
// currently logged in user
const urslForUserID = function(id) {
  let resultArray = [];

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      resultArray.push({longURL: urlDatabase[shortURL].longURL, shortURL: shortURL});
    }
  }
  return resultArray;
};

const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "password"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Article Routes

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const loggedInID = req.session.user_id;
  if (loggedInID) {
    // loop through url database and check if the logged in user id matches
    const correctURLs = urslForUserID(loggedInID);
    let templateVars = { urls: correctURLs, user: users[req.session.user_id] };
    res.render('url_index', templateVars);
  } else {
    res.statusCode = 403;
    res.end("Please login or register before requesting to view the urls");
  }
  
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    let templateVars = { user: users[req.session.user_id] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
    
  }


});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.render('registration', { user: null });
  } else {
    res.redirect('/urls');
  }
});

app.post("/register", (req, res) => {
  const randomUserID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password,10);
  const userEmailinUsers = getUserByEmail(email, users);

  if (email === "") {
    res.statusCode = 400;
    res.end("You did not enter ethier a username or password \n");
  } else if (password === "") {
    res.statusCode = 400;
    res.end("You did not enter ethier a username or password \n");
  } else if (userEmailinUsers !== undefined) {
    res.statusCode = 400;
    res.end("username already exists");
  } else {
    let newUser = {
      id: randomUserID,
      email: email,
      password: hashedPassword
    };
    users[randomUserID] = newUser;
    req.session.user_id = randomUserID;
    res.redirect('/urls');
  }
  
});

app.get("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let templateVars = {
    user: users[req.session.user_id],
    email: email,
    password: password,
  };
  res.render('login', templateVars);
});

app.post("/login", (req, res) => {
  // inputs submitted via login form
  const email = req.body.email;
  const password = req.body.password;
  // will a return a user object
  const user = getUserByEmail(email, users);
  

  if (user === undefined) {
    res.statusCode = 403;
    res.end("Oops! user does not exist");
  } else if (user !== undefined && !bcrypt.compareSync(password, user.password)) {
    res.statusCode = 403;
    res.end("Oops! looks like the password is incorrect");
  } else if (user.email === email && bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
  
});
  
app.post("/urls", (req, res) => {
  const randomURL = generateRandomString();

  let newURL = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };

  urlDatabase[randomURL] = newURL;
  res.redirect(`/urls/${randomURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const urlToDelete = req.params.shortURL;
  const loggedInID = req.session.user_id;

  // check to see if it the user is the owner of the endpoints
  if (urlDatabase[req.params.shortURL].userID === loggedInID) {

    for (const shortURL in urlDatabase) {
      if (shortURL === urlToDelete) {
        delete urlDatabase[shortURL];
      }
    }
    res.redirect("/urls");
  } else {
    res.statusCode = 400;
    res.send('Easy there cowboy, this is not your URL to Delete!!!');
  }
});

// this is the edit button
app.post("/urls/:id", (req, res) => {
  const loggedInID = req.session.user_id;
  if (urlDatabase[req.params.id].userID === loggedInID) {
  // the below changes the long URL in our in memory data object
    urlDatabase[req.params.id].longURL = req.body.longURL;
    console.log(urlDatabase);

    res.redirect("/urls");
  } else {
    res.statusCode = 403;
    res.send('Easy there cowboy, this is not your URL to edit!!!');
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/urls/:shortURL", (req, res) => {
  const loggedInID = req.session.user_id;

  // check if they are logged in
  if (loggedInID) {
    // check if the id(shortURL) === the one in urlDatabase
    if (urlDatabase[req.params.shortURL].userID === loggedInID) {

      let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
        user: users[req.session.user_id]
      };

      res.render('url_show', templateVars);
    } else {
      res.statusCode = 400;
      res.send('this url does not belong to you');
    }
  } else {
    res.statusCode = 400;
    res.send('Please log in');
  }
   
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
