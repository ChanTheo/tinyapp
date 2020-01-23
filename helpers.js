// function that looks up a given email in a database
const getUserByEmail = function(email, database) {
  
// loop through the database (assumably an object)

for (const key in database) {
  // if the key is found then return the user
  if(email === database[key].email){
    return database[key];
  }
}
  return undefined;
};


module.exports =  getUserByEmail;
