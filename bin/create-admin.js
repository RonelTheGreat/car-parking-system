const bcrypt    = require('bcrypt'),
      User      = require('../models/User');

// create an admin with hashed password
// params {username, password}
let createAdmin = (username, password) => {

    // hash the given password
    // output would be (e.g syx89sfx.123sf#$df-s9)
    bcrypt.hash(password, 10, (err, hashedPW) => {
    
        // store hashed password and username
        // set admin to true
        let newUser = {
            username: username,
            password: hashedPW,
            isAdmin: true,
        };
    
        // create new admin and save to DB
        User.create(newUser, (err, newUser) => {
    
            if (err) return console.log(`MESSAGE:Error in creating a new admin ERROR: ${err}`);

            console.log(newUser);
        })
    })
}

module.exports = createAdmin;
