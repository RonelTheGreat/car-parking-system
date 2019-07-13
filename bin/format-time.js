// format time to hh:mm AM/PM (e.g. 12:00 AM)
// params {date with time to format}
// returns the formatted time in hh:mm AM or PM
function formatTime(date) {

    // get hour and minute
    let hours = date.getHours();
    let minutes = date.getMinutes();
    
    // get time of the day, PM or AM
    // if hour is greater than 12, then it is PM else it is AM
    let ampm = hours >= 12 ? 'PM' : 'AM';

    // get hour
    hours = hours % 12;
    hours = hours ? hours : 12;

    // if minute less than 10, add 0 to the front (e.g 09, 08 etc.)
    minutes = `${(minutes < 10) ? '0' + minutes : minutes}`;

    // store the formatted time
    let obj = {
        time: `${hours}:${minutes} ${ampm}`,
    };
    
    return obj;
}


module.exports = formatTime;