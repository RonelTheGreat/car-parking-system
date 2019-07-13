// calculate remaining time
// params {expiration time}
function getTime(endTime) {
    // grab the time now
    let now = new Date().getTime();
    // calculate the remaining time
    let t = endTime - now;

    // calculate and get hour, min, sec
    let hour = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let min = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
    let sec = Math.floor((t % (1000 * 60)) / 1000);
    
    // store hour, min, sec
    let obj = {
        hour: hour,
        min: min,
        sec: sec,
    }

    return obj;
}

module.exports = getTime;