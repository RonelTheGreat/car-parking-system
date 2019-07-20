var excessTime  = require('../bin/excess-time'),
    getTime     = require('../bin/get-time'),
    Slot        = require('../models/Slot');
    

// update user remaining time or excess time
function updateTime (){

    // grab all slots from the DB
    Slot.find({})
    // grab also the current user that is reserved
    .populate('parokya')
    .exec((err, slots) => {
        
        if (err) return console.log(`MESSAGE: Error in UPDATING slot TIME ERROR: ${err}`); 
        // loop through each slot
        slots.forEach(slot => {

            // if slot state is reserved or occupied
            if (slot.state === 'reserved' || slot.state === 'occupied') {

                // grab the expiration time
                let expiration = slot.parokya.reservation.expiration.raw;
                // from the expiration time above,
                // calculate remaining time
                let remainingTime = getTime(new Date(expiration).getTime());
                // set users remaining time to the calculated time above
                slot.parokya.reservation.remainingTime = remainingTime;

                // check if remaining time is zero
                if (slot.parokya.reservation.remainingTime.hour <= 0 &&
                    slot.parokya.reservation.remainingTime.sec <= 0 &&
                    slot.parokya.reservation.remainingTime.min <= 0) {
                    
                    // save to db
                    slot.parokya.reservation.remainingTime = {
                        hour: 0,
                        min: 0,
                        sec: 0,
                    };

                    //  if remaining time is zero and
                    // slot state is reserved and NOT occupied
                    if (slot.state === 'reserved') {
                        // reset slot reservation
                        slot.parokya.reservation = {};
                        slot.state = 'vacant';
                        slot.indicator = 'green';
                        slot.save();

                        // update all connected clients that the slot is vacant
                        io.sockets.emit('signalFromServer', {refresh: true, vacant: true, slot: slot.slotLetter});

                    // else, if remaining time is zero AND
                    // slot state is OCCUPIED then calculate excess time
                    } else if (slot.state === 'occupied') {
                        // calculate excess time according to expiration time
                        let excess = excessTime(new Date(expiration).getTime());
                        // save excess time to db for a particular user
                        slot.parokya.reservation.excessTime = excess;
                        // grab hour, min, sec of the excess time
                        let hour = slot.parokya.reservation.excessTime.hour;
                        let min = slot.parokya.reservation.excessTime.min;
                        let sec = slot.parokya.reservation.excessTime.sec;

                        // update the admin for the excess time
                        // and the user currently occupying the slot
                        io.sockets.emit('updateTimeEvent', 
                            {
                                isExcess: true,
                                excess: excess,
                                username: slot.parokya.username, 
                            }
                        );

                        //check if 1 min have passed
                        // if so, deduct balance by the slot rate per minute
                        if ( (sec % 60 <= 4 || sec % 60 === 0) && (min !== 0 && min !== -1) ) {

                            if (slot.parokya.balance >= slot.slotRate.ratePerMin) {
                                slot.parokya.balance -= slot.slotRate.ratePerMin;
                            } else {

                                slot.parokya.debt += slot.slotRate.ratePerMin;
                            }
                        }
                    }
                
                // if slot doesnt exceed the alloted time of reservation
                // update the admin for the remaining time
                } else {
                    io.sockets.emit('updateTimeEvent', 
                        {
                            isExcess: false, 
                            remaining: slot.parokya.reservation.remainingTime,
                            username: slot.parokya.username, 
                        });
                }

                // save all the update to DB
                slot.parokya.save();
            }
        })
    })
}

module.exports = updateTime;

