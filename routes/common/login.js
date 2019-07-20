const express   = require('express'),
      router    = express.Router(),
      bcrypt    = require('bcrypt'),
      User      = require('../../models/User')


// LOGIN
router.get('/', (req, res) => {
    req.session.regErrors = null;
    req.session.success = null;

    res.render('common/login', {errors: req.session.loginErrors, inputValues: req.session.inputValues});
})

router.post('/', (req, res) => {

    let username = req.body.username;
    let password = req.body.password;

    // validate form if not empty
    req.checkBody('username', 'enter your username').notEmpty();
    req.checkBody('password', 'enter your password').notEmpty();

    // save errors
    let errors = req.validationErrors();

    // put the username to session
    req.session.inputValues = [{
        username: username,
    }];

    // if errors are found, show errors and
    // redirect to login page again
    if (errors) {
        req.session.loginErrors = errors;
        res.redirect('/login');
        return;
    }

    // if username and password not empty
    // find the specific user
    if (username && password != "") {

        // find user with the username
        User.findOne({username: username})
        .then((user) => {

            // if no such username
            if (!user) {
                req.session.loginErrors = [{msg: 'no such user'},];
                req.session.isValidated = false;
                res.redirect('/login');
            } else {

                // if username is valid, compare the password with the hashed password on DB
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) return console.log(`MESSAGE: Error in comparing passwords ERROR: ${err}`); 
                    // if password match then we have a valid user
                    if (result) {

                        // if admin, redirect to admin's page
                        if (user.isAdmin) {
                            req.session.isAdmin = true;
                            req.session.admin = {
                                username: user.username,
                            }
                            res.redirect('/admin/home');
                        
                        // if user and not admin, redirect to user's home page
                        } else {
                            req.session.isValidated = true;
                            req.session.user = {
                                username: user.username,
                                balance: user.balance,
                                id: user._id,
                                reservation: user.reservation
                            }
                            res.redirect('/user/home');   
                        }
                    
                    // passwords don't match then flash error message
                    // redirect to login page
                    } else {
                        req.session.loginErrors = [{ msg: 'no such user' },];
                        req.session.isValidated = false;
                        res.redirect('/login');
                    }
                })
            }
        })
    }
})

module.exports = router;