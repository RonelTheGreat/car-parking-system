const Slot = require('../models/Slot'),
      User = require('../models/User');

// reset the slots current states
let reset = () => {

    // grab all slots from the database
    Slot.find({}, (err, slots) => {

        // loop through each slot and 
        // set state to vacant,
        // indicator to green,
        // and the current reserved user to none
        slots.forEach(slot => {
            if (slot.parokya !== undefined) {
                slot.parokya = undefined;
                slot.state = 'vacant';
                slot.indicator = 'green';
                slot.save();
            }
        })

        // grab all users from the DB
        User.find({}, (err, users) => {
            // loop through each user
            // if user is reserved
            // set the reservation to none
            users.forEach(user => {
               if (user.reservation.slot !== undefined) {
                    user.reservation = {};
                    user.debt = 0;
                    user.save();
               }
            })
        })
    })
}


module.exports = reset;