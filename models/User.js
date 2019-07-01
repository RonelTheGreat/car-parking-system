var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    mi: String,
    contact: Number,
    username: String,
    password: String,
    balance: Number,
    rfid: String,
    debt: {type: Number, default: 0},
    reservation: {
        time: String,
        date: String,
        slot: String,
        duration: String,
        expiration: {
            str: String,
            raw: String,
        },
        remainingTime: {
            hour: Number,
            min: Number,
            sec: Number,
        },

        excessTime: {
            hour: Number,
            min: Number,
            sec: Number,
        }
    },
    isAdmin: Boolean,
});

module.exports = mongoose.model('User', userSchema);