const months = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July',
    'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];


// expiration calculator
// params {date object, duration[in minutes]}
// returns { formatted date mm:dd:yy hh:mm:ss }
//         { duration }
//         { raw date [e.g. Jan. 17, 1996 00:00:00]}
//         { current date of reservation }
function calcExpiration(date, duration=0) {

    // convert current date to minutes
    let timeInMinutes = date / (1000 * 60);
    // calculate expiration 
    let expiration = new Date((timeInMinutes + duration) * (1000 * 60));

    // get hour, min, sec of the expiration date
    let hours = expiration.getHours();
    let minutes = expiration.getMinutes();
    let seconds = expiration.getSeconds();
    let rawTime = `${hours}:${minutes}:${seconds}`;

    // store all necessary informations
    // i.e. duration of the reservation,
    //      the current date (e.g. July 13, 2019)
    //      raw date for future calculations
    //      and the formatted date (e.g. July 13, 2019)
    let obj = {
        duration: duration,
        before: `${months[date.getMonth()]} ${date.getDate()},${date.getFullYear()}`,
        rawDateTime: `${months[date.getMonth()]} ${date.getDate()},${date.getFullYear()} ${rawTime}`,
        formattedDate: `${months[date.getMonth()]} ${date.getDate()},${date.getFullYear()}`,
    };


    return obj;
}

module.exports = calcExpiration;