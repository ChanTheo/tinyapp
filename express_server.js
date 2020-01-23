// including all the packages we will need
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

// intializing all the packages we required
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser());


const generateRandomString = function () {
  let result = "";
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;

  for (let index = 0; index < 6; index++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));

  }

  return result;
};

// create a function that only returns the urls where the userID in the database is equal to the id of the 
// currently logged in user

// const urslForUserID = function (id) {
//   let resultArray = []

//   for (const shortURL in urlDatabase) {
//     if(urlDatabase[shortURL].userID === id){
//       resultArray.push({longURL: urlDatabase[shortURL].longURL, shortURL: shortURL})
//     }
//   }
//   return resultArray;
// }

// Globally scoped objects that are our databases in memory

// urlDatabase: keeps short url as the key: now it keeps track of the user that created it 

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};
// create a function that only returns the urls where the userID in the database is equal to the id of the 
// currently logged in user
const urslForUserID = function (id) {
  let resultArray = []

  for (const shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userID === id){
      resultArray.push({longURL: urlDatabase[shortURL].longURL, shortURL: shortURL})
    }
  }
  return resultArray;
}

// Old urlDatabase

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"

// };


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
  let resultArray = []
  const loggedInID = req.cookies["user_ID"];
  if (loggedInID){
    // loop through url database and check if the logged in user id matches 
    const correctURLs = urslForUserID(loggedInID);
    // console.log(correctURLs);
    // for (const key in urlDatabase) {
    //   if(urlDatabase[key].userID === loggedInID){
    //     resultArray.push({longURL: urlDatabase[key].longURL, shortURL: key})
    //   }
    // }
    // loop over all the elements in the array and display them in url index
    let templateVars = { urls: correctURLs, user: users[req.cookies["user_ID"]] };
  res.render('url_index', templateVars);
  } else {
    res.statusCode = 403;
  res.end("Please login or register before requesting to view the urls");
  }
  
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_ID"];
  if (userID) {
    let templateVars = { user: users[req.cookies["user_ID"]] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
    // didn't pass in templatevars to redirect * might need to check on this later
  }


});

app.get("/register", (req, res) => {
  console.log("in register route");
  const userID = req.cookies["user_ID"];
  if (!userID) {
    res.render('registration', { user: null });
  } else {
    let templateVars = { user: users[userID] };
    res.redirect('/urls', templateVars);
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
    res.redirect('/urls');
  }
});

app.get("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let templateVars = {
    user: users[req.cookies['user_ID']],
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

  let newURL = {
    longURL: req.body.longURL,
    userID: req.cookies["user_ID"]
  }

  urlDatabase[randomURL] = newURL;
  res.redirect(`/urls/${randomURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const urlToDelete = req.params.shortURL;
  const loggedInID = req.cookies["user_ID"];
  const loggedInIDUrlArray = urslForUserID(loggedInID);

  // check to see if it the user is the owner of the endpoints
  if(urlDatabase[req.params.shortURL].userID === loggedInID ){

  for (const shortURL in urlDatabase) {
    if (shortURL === urlToDelete) {
      delete urlDatabase[shortURL];
    }
  }
  res.redirect("/urls");
} else {
  res.statusCode = 400;
  res.send('Easy there cowboy, this is not your URL to Delete!!!')
}
});

// this is the edit button
app.post("/urls/:id", (req, res) => {
  const loggedInID = req.cookies["user_ID"];
  if(urlDatabase[req.params.id].userID === loggedInID ){
  // the below changes the long URL in our in memory data object
  urlDatabase[req.params.id].longURL = req.body.longURL;
  console.log(urlDatabase);

  res.redirect("/urls");
  } else {
    res.statusCode = 403;
  res.send('Easy there cowboy, this is not your URL to edit!!!')
  }
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
  const loggedInID = req.cookies["user_ID"];
  const loggedInIDUrlArray = urslForUserID(loggedInID);
  let shortURL = req.params.shortURL;

  // check if they are logged in
  if (loggedInID) {
    // check if the id(shortURL) === the one in urlDatabase
    if(urlDatabase[req.params.shortURL].userID === loggedInID ){

    let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
        user: users[req.cookies["user_ID"]]
      };

    res.render('url_show', templateVars);
    } else {
      res.statusCode = 400;
      res.send('this url does not belong to you')
    }
  } else {
    res.statusCode = 400;
    res.send('Please log in')
  }
  

  // send them some 400 status code and message if not logged in
  // send some message if the url does not belong to them



  // let templateVars = {
  //   shortURL: req.params.shortURL,
  //   longURL: urlDatabase[req.params.shortURL].,
  //   user: users[req.cookies["user_ID"]]
  // };
  
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// generateRandomString();