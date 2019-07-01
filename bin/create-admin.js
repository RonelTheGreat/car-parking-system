const bcrypt    = require('bcrypt'),
      User      = require('../models/User');


let createAdmin = (username, password) => {

    bcrypt.hash(password, 10, (err, hashedPW) => {
    
        let newUser = {
            username: username,
            password: hashedPW,
            isAdmin: true,
        };
    
        User.create(newUser, (err, newUser) => {
    
            if (err) return console.log('Error in creating a new admin ...');

            console.log(newUser);
        })
    })
}

module.exports = createAdmin;
