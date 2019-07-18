const express   = require('express'),
      router    = express.Router(),
      Slot      = require('../../models/Slot'),
      User      = require('../../models/User')


// LOAD USER
router.get('/load/:username', (req, res) => {
    let username = req.params.username;

    // if not admin redirect to login page
    if (!req.session.isAdmin) return res.redirect('/login');

    // find specific user to load
    User.findOne({username: username}, (err, user) => {
        if (err) return console.log('Something went wrong getting users ...');

        // find all users and sort from a-z
        // to be rendered on the page
        User.find()
        .sort([['username', 'ascending']])
        .then((users) => {

            // find a one slot to get the reservation rates
            Slot.findOne({ slotLetter: 'a' }, (err, slot) => {

                // then render user's page
                res.render('user',
                    {
                        slotRate: slot.slotRate,
                        users: users,
                        user: user,
                        admin: req.session.admin,
                    });
            })

        })

    })
})

router.post('/load', (req, res) => {
    let username = req.body.username;
    let amount = req.body.amount;
    
    // check if amount is not undefined
    if (amount === undefined) {
        return res.json({response: 'invalid amount'});
    }

    // find specific user using the username
    User.findOne({username: username})
    .then((user) => {

        // variable for storing responses
        let msg = '';

        // convert amount to number
        amount = Number(amount);
        // save username to session
        req.session.username = username;
        // add the amount to balance
        user.balance += amount;

        // check if balance is sufficient to pay debt
        if (user.balance < user.debt) {
            user.debt -= user.balance;
            user.balance = 0;
            msg = `successfully loaded P ${amount} to ${username}
            & debt has been deducted P ${amount}, remaining debt is P ${user.debt}`;
        
        // if balance is equal to debt
        } else if (user.balance === user.debt) {
            user.balance -= user.debt;
            user.debt = 0;
            msg = `successfully loaded P ${amount} to ${username} 
            & balance has been deducted P ${user.balance}, remaining balance is 0`;
        
        // if debt is zero (0)
        } else if (user.debt === 0) {
            msg = `successfully loaded P ${amount} to ${username}`;
        
        // if balance is greater than debt
        } else {
            user.balance -= user.debt;  
            user.debt = 0;
            msg = `successfully loaded P ${amount} to ${username}
            & debt is fully paid, remaining balance is P ${user.balance}`;
        }

        // save the user's balance and debt update
        // send a response
        user.save();
        res.json({msg: msg, success: true});
    })

})


module.exports = router;