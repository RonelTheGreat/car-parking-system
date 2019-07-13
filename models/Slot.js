var mongoose = require('mongoose');

var slotSchema = new mongoose.Schema({
    slotLetter: String,
    parokya:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
    state: String,
    indicator: String,
    slotRate: {
        ratePerMin: Number,
        maxDuration: Number,
        reservationRate: Number,
    },
});

module.exports = mongoose.model('Slot', slotSchema);