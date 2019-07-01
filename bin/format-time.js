// format time to h:m AM/PM
// PARAMS {date, durationHours[number], durationMinutes[number]}
// returns {start time, end time, end time in milliseconds}
function formatTime(date) {

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = `${(minutes < 10) ? '0' + minutes : minutes}`;


    let obj = {
        time: `${hours}:${minutes} ${ampm}`,
    };
    
    return obj;
}


module.exports = formatTime;