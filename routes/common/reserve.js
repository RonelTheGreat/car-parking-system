const express       = require('express'),
      formatTime    = require('../../bin/format-time'),
      getTime       = require('../../bin/get-time'),
      calcExp       = require('../../bin/calc-expiration'),
      router        = express.Router(),
      User          = require('../../models/User'),
      Slot          = require('../../models/Slot')
      

// RESERVE
router.post('/', (req, res) => {
    let username = req.body.username;
    let slotLetter = req.body.slotLetter;
    let requestFrom = req.body.requestFrom;

    // find specific slot in the DB
    Slot.findOne({slotLetter: slotLetter}, (err, slot) => {
        if (err) return console.log('Error finding the slot');

        // find the user who is reserving in the DB
        User.findOne({username: username}, (err, user) => {

            if (err) return console.log('Something went wrong');

            // check if the user reserving is the first one to reserve
            if (slot.currentUsers[0] !== username) {
                slot.currentUsers.filter(user => user !== username);
                return res.json({response: 'slot already taken'});
            }

            // check if the state is occupied
            if (slot.state == 'reserved' || slot.state == 'occupied') {
                return res.json({ response: 'someone has reserved this slot' });
            }

            // check if BALANCE is 0 or less than slot reservation rate
            if (user.balance == 0 || user.balance < slot.slotRate.reservationRate) {
                if (requestFrom === 'user') {
                    return res.json({response: "your balance is not enough"});
                } else {
                    return res.json({response: `${username}'s balance is not enough`});
                }
            }

            // check if slot is valid
            if (user.reservation.slot != undefined) {
                if (requestFrom === 'user') {
                    return res.json({response: "can't reserve because you have an active subscription"}); 
                } else {
                    return res.json({response: `can't reserve because ${username} have an active subscription`});
                }       
            }

            // if nothing fails above, time to save it to the DB
            // set the date today
            let date = new Date();

            // calculate expiration date and time from the date above
            let expiration = calcExp(date, slot.slotRate.maxDuration);
            
            // formatted time e.g 12:00 PM
            // START AND END TIME for reservation
            let formattedStartTime = formatTime(date);
            let formattedEndTime = formatTime(new Date(expiration.rawDateTime));
            
            let remainingTime = getTime(new Date(expiration.rawDateTime));            

            // toggle slot state and indicator
            // and save the id of the user
            slot.state = 'reserved';
            slot.parokya = user._id;
            slot.indicator = 'orange';
            slot.currentUsers = [];
            slot.save();

            // deduct user balance according to the reservation rate
            user.balance -= slot.slotRate.reservationRate;
            // save reservation TIME which is the formatted time
            user.reservation.time = formattedStartTime.time;
            // save the reservation DATE
            user.reservation.date = expiration.before;
            // save the particular slot where the user has reserved
            user.reservation.slot = slotLetter;
            // save remaining time hh:mm:ss (e.g 8 : 30 : 00)
            user.reservation.remainingTime = remainingTime;
            // save the expiration time string
            user.reservation.expiration.str = formattedEndTime.time
            // save the expiration time for future time calculations
            user.reservation.expiration.raw = expiration.rawDateTime;
            // save the duration    
            user.reservation.duration = expiration.duration;
            user.save();
            
            // check where the request is coming from
            // flash corresponding message to the user or admin
            if (requestFrom === 'user') {
                res.json({response: `successfully reserved at slot ${slotLetter}`,  refresh: true});
            } else {
                res.json({response: `${user.username} has been reserved successfully at slot ${user.reservation.slot}`,  refresh: true});
            }
            
        })
       

    })  
})


module.exports = router;