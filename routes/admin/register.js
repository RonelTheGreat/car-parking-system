const express   = require('express'),
      router    = express.Router(),
      bcrypt    = require('bcrypt'),
      User      = require('../../models/Slot')


// REGISTER USER
router.get('/register', (req, res) => {
    req.session.loginErrors = null;
    req.session.success = null;
    req.session.username = null;

    // if not admin redirect to login page
    if (!req.session.isAdmin) return res.redirect('/login');

    // if nothing fails, render registration page
    res.render('admin/register', {errors: req.session.regErrors, inputValues: req.session.inputValues});
})

router.post('/register', (req, res) => {

    // parse request body
    let fname = req.body.fname;
    let lname = req.body.lname;
    let mi = req.body.mi;
    let username = req.body.username;
    let password = req.body.password;
    let cpassword = req.body.cpassword;
    let contact = req.body.contact;
    let rfid = req.body.rfid;
    let balance = req.body.balance;


    // check for empty fields before saving to db
    req.checkBody('fname', 'first name is required').notEmpty();
    req.checkBody('lname', 'last name is required').notEmpty();
    req.checkBody('mi', 'middle initial is required').notEmpty();
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('password', 'please provide a password').notEmpty();
    req.checkBody('balance', 'please provide initial balance').notEmpty();
    req.checkBody('contact', 'contact number is required').notEmpty();

    // store errors in the session
    let errors = req.validationErrors();

    // store input fields
    req.session.inputValues = [{
        username: username,
        fname: fname,
        lname: lname,
        mi: mi,
        password: password,
        rfid: rfid,
        balance: balance,
        contact: contact,
    }];


    // check for errors
    if (errors) {
        req.session.regErrors = errors;
        res.redirect('/admin/register');
        return;
    }

    // check if passwords match
    if (password != cpassword) {
        req.session.regErrors = [{msg: 'Password do not match!'}];
        res.redirect('/admin/register');
        return;
    }

    // if no errors, hash the pw and save to DB
    // and create new user
    bcrypt.hash(password, 10, (err, hashedPW) => {

        let newUser = {
            fname: fname,
            lname: lname,
            mi: mi,
            username: username,
            password: hashedPW,
            rfid: rfid,
            balance: balance,
            contact: contact,
        };

        if (err) return console.log('Error hashing the password');

        User.create(newUser, (err, newUser) => {

            if (err) return console.log(`MESSAGE: Error in creating a new user ERROR: ${err}`); 

            req.session.success = 'successfully added new user !';
            req.session.inputValues = null;
            req.session.regErrors = null;
            res.redirect('/admin/home');
        })
    })
    
})

module.exports = router;