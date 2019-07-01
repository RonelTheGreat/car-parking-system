const months = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July',
    'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];


// expiration calculator
// params {date object, duration[minutes]}
// returns {formatted date mm:dd:yy hh:mm:ss}
function calcExpiration(date, duration=0) {

    let timeInMinutes = date / (1000 * 60);
    let expiration = new Date((timeInMinutes + duration) * (1000 * 60));

    let hours = expiration.getHours();
    let minutes = expiration.getMinutes();
    let seconds = expiration.getSeconds();

    let rawTime = `${hours}:${minutes}:${seconds}`;

    let obj = {
        duration: duration,
        before: `${months[date.getMonth()]} ${date.getDate()},${date.getFullYear()}`,
        rawDateTime: `${months[date.getMonth()]} ${date.getDate()},${date.getFullYear()} ${rawTime}`,
        formattedDate: `${months[date.getMonth()]} ${date.getDate()},${date.getFullYear()}`,
    };


    return obj;
}

module.exports = calcExpiration;