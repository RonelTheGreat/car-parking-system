const express   = require('express'),
      router    = express.Router(),
      User      = require('../../models/User')


// EDIT USER
router.get('/:username/edit', (req, res) => {

    // if not admin redirect to login page
    if (!req.session.isAdmin) return res.redirect('/login');

    // find the username given in the URL 
    User.findOne({username: req.params.username}, 'username fname mi lname rfid contact', (err, user) => {

        if (err) return console.log(`MESSAGE: Error in finding user ERROR: ${err}`); 

        // if nothing fails, render edit page
        res.render('admin/edit', {user: user});
    })
    
})

router.post('/:username', (req, res) => {

    // find specific user and update
    User.findOneAndUpdate({username: req.params.username}, req.body.user, (err, user) => {

        if (err) return console.log(`MESSAGE: Error in UPDATING user ERROR: ${err}`); 
        // redirect to user's page
        res.redirect(`/admin/load/${req.body.user.username}`);
    })
})

module.exports = router;