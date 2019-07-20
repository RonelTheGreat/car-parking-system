const express   = require('express'),
      getTime   = require('../../bin/get-time'),
      router    = express.Router(),
      Slot      = require('../../models/Slot'),
      User      = require('../../models/User');


//HOME
router.get('/home', (req, res) => {
    req.session.loginErrors = null;
    req.session.success = null;
    req.session.regErrors = null;
    req.session.inputValues = null;

    // if not admin, redirect to login page
    if (!req.session.isAdmin) return res.redirect('/login');

    // find all slot 
    // and find all the user who has an active reservation
    Slot.find({})
    .populate('parokya')
    .sort([['slotLetter', 'ascending']])
    .exec((err, slots) => {

        if (err) return console.log(`MESSAGE: Error querying slots ERROR: ${err}`); 

        // count vacant slots
        Slot.countDocuments({state: 'vacant'}, (err, count) => {
            if (err) return console.log(`MESSAGE: Error in COUNTING slots ERROR: ${err}`); 
            
            // find all users that are registered and sort from a-z
            User.find({})
            .sort([['username', 'ascending']])
            .then((users) => {

                if (err) return console.log(`MESSAGE: Error in getting all users ERROR: ${err}`); 

                // loop through each reserved user
                // calculate expiration and remaining time
                users.forEach(user => {
                    if (user.reservation.expiration.raw != undefined) {
                        let expiration = getTime(new Date(user.reservation.expiration.raw).getTime());
                        user.reservation.remainingTime = expiration;
                        user.save();
                    }
                })

                // if nothing fails above, render admin's page
                res.render('admin/home', {users: users, admin: req.session.admin, slots: slots, vacant: count});
            })
        })     
    })
})

module.exports = router;