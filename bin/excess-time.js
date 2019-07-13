// calculate excess time
// params {raw expiration date & time (e.g. July 13, 2019 12:00:00)}
// returns hour, min, sec of excess time
function excessTime(expirationTime) {

    // get the current time
    let timeNow = new Date().getTime();
    // calculate excess time
    let t = timeNow - expirationTime;

    // get hour, min, sec of excess time
    let hour = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let min = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
    let sec = Math.floor((t % (1000 * 60)) / 1000);

    // store hour, min, sec of excess time
    let obj = {
        hour: hour,
        min: min,
        sec: sec,
    };

    return obj;
}

module.exports = excessTime;