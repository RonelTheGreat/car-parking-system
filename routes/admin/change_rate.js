const express   = require('express'),
      router    = express.Router(),
      Slot      = require('../../models/Slot')


// CHANGE RATE
router.post('/change_rate', (req, res) => {
    let ratePerMin = Number(req.body.ratePerMin);
    let maxDuration = req.body.maxDuration;
    let reservationRate = req.body.reservationRate;

    // find all slot and save the current reservation rates
    // i.e. rate per minute, max duration of reservation etc.
    Slot.find({}, (err, slots) => {

        if (err) return console.log(`MESSAGE: Error in changing slot rate ERROR: ${err}`); 

        slots.forEach(slot => {        
            slot.slotRate.ratePerMin = ratePerMin;
            slot.slotRate.maxDuration = maxDuration;
            slot.slotRate.reservationRate = reservationRate;
            slot.save();
        })
    })
    // send response
    res.json({slotRate: 'changed', msg: 'successfully changed parking rate'});
})

module.exports = router;