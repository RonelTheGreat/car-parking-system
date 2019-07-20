const express   = require('express'),
      router    = express.Router(),
      User      = require('../../models/User'),
      Slot      = require('../../models/Slot')


router.get('/home', (req, res) => {

    // empty unnecessary session variables
    req.session.loginErrors = null;
    req.session.success = null;
    req.session.regErrors = null;
    req.session.inputValues = null;

    // if user is not validated, return to login page
    if (!req.session.isValidated) return res.redirect('/login');

    // find all slots
    Slot.find({})
    // sort slots from A - D
    .sort([['slotLetter', 'ascending']])
    .then((slots) => {
        // count vacant slots
        Slot.countDocuments({state: 'vacant'}, (err, count) => {
            if (err) return console.log(`MESSAGE: Error finding the slot ERROR: ${err}`); 

            // find user
            User.findOne({username: req.session.user.username}, 
            '_id username balance debt reservation remainingTime expiration', (err, user) => {

                // if something goes wrong, log error
                if (err) return console.log('error finding such user ...');

                // if nothing else fails render home page
                res.render('user/home',
                    {
                        user: user,
                        slots: slots, 
                        vacant: count,
                    }
                );
               
            })
        })     
    })
})

module.exports = router;