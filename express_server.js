// including all the packages we will need
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

// intializing all the packages we required
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cookieParser());





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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
  
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
    
};

// const emailLookup = (function (){
  
// })



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
  let templateVars = {urls: urlDatabase, user: users[req.cookies["user_ID"]]};
  res.render('url_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {user: users[req.cookies["user_ID"]]};
  res.render('urls_new', templateVars);
});

// app.get("/register", (req, res) => {
//   let templateVars = {user: users[req.cookies["user_ID"]]}
//   res.render('registration', templateVars);
// });


app.get("/register", (req, res) => {
  console.log("in register route");
  const userID = req.cookies["user_ID"];
  if (!userID) {
    res.render('registration', {user: null});
  }  else {
    let templateVars = {user: users[userID]};
    res.redirect('/urls',templateVars);
  }
});
app.post("/register", (req, res) => {
  const randomUserID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (email === "") {
    res.statusCode = 400;
    res.end("You did not enter ethier a username or password \n");
  } else if (password === "") {
    res.statusCode = 400;
    res.end("You did not enter ethier a username or password \n");
  } else {

    for (const key in users) {
      if (users[key].email === email) {
        res.statusCode = 400;
        res.end("username already exists");
      }
    }

    let newUser = {
      id: randomUserID,
      email: email,
      password: password
    };
    users[randomUserID] = newUser;
    res.cookie('user_ID', randomUserID);
    // console.log(users);
    res.redirect('/urls',);
  }
});

app.get("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let templateVars = {user: users[req.cookies['user_ID']],
    email: email,
    password: password,
  };
  res.render('login', templateVars);
});

app.post("/login", (req, res) => {
  // inputs submitted via login form
  const email = req.body.email;
  const password = req.body.password;
  let existingUserID;

  //   If a user with that e-mail cannot be found, return a response with a 403 status code.
  // If a user with that e-mail address is located, compare the password given in the form with the existing user's password. If it does not match, return a response with a 403 status code.
  // If both checks pass, set the user_id cookie with the matching user's random ID, then redirect to /urls.

  // loop through users object to see if the email exists
 


  for (const userID in users) {
    if (users[userID].email === email && users[userID].password === password) {
       
      // if username and password match redirct to urls
      existingUserID = users[userID].id;
      res.cookie('user_ID', existingUserID);
      res.redirect("/urls");
      return;
    } else if (users[userID].email === email && users[userID].password !== password) {
      res.statusCode = 403;
      res.end("Oops! looks like the password is incorrect");
      return;
    }
  }
  res.statusCode = 403;
  res.end("Oops! user does not exist");
  
});

app.post("/urls", (req, res) => {
  const randomURL = generateRandomString();
  urlDatabase[randomURL] = req.body.longURL;
  res.redirect(`/urls/${randomURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const urlToDelete = req.params.shortURL;
  for (const shortURL in urlDatabase) {
    if (shortURL === urlToDelete) {
      delete urlDatabase[shortURL];
    }
  }
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// app.post("/login", (req, res) => {
//   res.cookie('user_ID', req.body.username)
//   res.redirect("/urls")
// });

app.post("/logout", (req, res) => {
  res.clearCookie('user_ID');
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_ID"]]};
  res.render('url_show', templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// generateRandomString();