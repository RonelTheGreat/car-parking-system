var excessTime  = require('../bin/excess-time'),
    getTime     = require('../bin/get-time'),
    Slot        = require('../models/Slot');
    

// update user remaining time
function updateTime (){
    Slot.find({})
    .populate('parokya')
    .exec((err, slots) => {
        
        slots.forEach(slot => {

            if (slot.state === 'reserved' || slot.state === 'occupied') {

                let expiration = slot.parokya.reservation.expiration.raw;
                let remainingTime = getTime(new Date(expiration).getTime());
                slot.parokya.reservation.remainingTime = remainingTime;

                // if remaining time is zero
                if (slot.parokya.reservation.remainingTime.hour <= 0 &&
                    slot.parokya.reservation.remainingTime.sec <= 0 &&
                    slot.parokya.reservation.remainingTime.min <= 0) {

                        slot.parokya.reservation.remainingTime = {
                            hour: 0,
                            min: 0,
                            sec: 0,
                        };

                    // check if it is not occupied
                    if (slot.state === 'reserved') {
                        //then reset slot
                        slot.parokya.reservation = {};
                        slot.state = 'vacant';
                        slot.indicator = 'green';
                        slot.save();

                        io.sockets.emit('signalFromServer', {refresh: true});

                    } else if (slot.state === 'occupied') {
                        let excess = excessTime(new Date(expiration).getTime());

                        slot.parokya.reservation.excessTime = excess;
                        let hour = slot.parokya.reservation.excessTime.hour;
                        let min = slot.parokya.reservation.excessTime.min;
                        let sec = slot.parokya.reservation.excessTime.sec;

                        console.log(`SLOT ${slot.slotLetter.toUpperCase()}: ${hour} : ${min} : ${sec}`);

                        //check if 1 min have passed
                        if ( (sec % 60 <= 4 || sec % 60 === 0) && (min !== 0 && min !== -1) ) {

                            if (slot.parokya.balance >= slot.slotRate.ratePerMin) {
                                console.log('iban balance na!');
                                slot.parokya.balance -= slot.slotRate.ratePerMin;
                            } else {

                                slot.parokya.debt += slot.slotRate.ratePerMin;
                                // io.sockets.emit('signalFromServer', {refresh: true});
                                console.log('kulang na ibarayad!');
                                console.log(slot.parokya.debt);
                            }

                            // console.log(`${slot.parokya.username}'s balance: ${slot.parokya.balance}`);
                        }
                    }
                }
                slot.parokya.save();
            }
        })
    })
}

module.exports = updateTime;

