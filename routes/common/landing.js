const express   = require('express'),
      router    = express.Router(),
      Slot      = require('../../models/Slot')


// LANDING
router.get('/', (req, res) => {
    req.session.loginErrors = null;
    req.session.success = null;
    req.session.regErrors = null;
    req.session.inputValues = null;

    Slot.find({})
    .sort([['slotLetter', 'ascending']])
    .then((slots) => {
        Slot.countDocuments({state: 'vacant'}, (err, count) => {
            if (err) return console.log(`MESSAGE: Error in COUNTING slots ERROR: ${err}`); 

            res.render('common/landing', {slots: slots,  vacant: count});
        })     
    })
})

module.exports = router;