const Slot = require('../models/Slot'),
      User = require('../models/User');


let reset = () => {
    Slot.find({}, (err, slots) => {
        slots.forEach(slot => {
            if (slot.parokya !== undefined) {
                slot.parokya = undefined;
                slot.state = 'vacant';
                slot.indicator = 'green';
                slot.save();
            }
        })

        User.find({}, (err, users) => {
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