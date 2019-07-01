// calculate remaining time
function getTime(endTime) {
    let now = new Date().getTime();
    let t = endTime - now;

    let hour = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let min = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
    let sec = Math.floor((t % (1000 * 60)) / 1000);
    
    let obj = {
        hour: hour,
        min: min,
        sec: sec,
    }

    return obj;
}

module.exports = getTime;