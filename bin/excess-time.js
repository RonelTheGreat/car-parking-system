// calculate remaining time
function excessTime(expirationTime) {

    let timeNow = new Date().getTime();
    let t = timeNow - expirationTime;

    let hour = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let min = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
    let sec = Math.floor((t % (1000 * 60)) / 1000);

    let obj = {
        hour: hour,
        min: min,
        sec: sec,
    };

    // console.log(`${hour} : ${min} : ${sec}`);

    return obj;
}

module.exports = excessTime;