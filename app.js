// DEPENDENCIES
const createAdmin   = require('./bin/create-admin'),
      createSlots   = require('./bin/create-slots'),
      updateTime    = require('./bin/update-time'),
      bodyParser    = require('body-parser'),
      validator     = require('express-validator'),
      mongoose      = require('mongoose'),
      session       = require('express-session'),
      express       = require('express'),
      reset         = require('./bin/reset-slots'),
      User          = require('./models/User'),
      Slot          = require('./models/Slot'),
      app           = express();
      http          = require('http').Server(app),
      io            = require('socket.io')(http);


reset();

// update slot timer every 5 sec
let timer1 = setTimeout(function update() {
    updateTime();
    timer1 = setTimeout(update, 5000);
}, 5000);


// MIDDLEWARES
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(validator());
app.use(session({
    secret: 'th1s 1s @ r@nd0m s3cr3t k3y f0r mY w3b@pp',
    resave: false,
    saveUninitialized: true,
}))


// MONGODB CONNECTION
const DB_URL = 'mongodb+srv://admin123:admin123@cluster0-brxlt.mongodb.net/parkya_app?retryWrites=true&w=majority';
mongoose.connect(DB_URL);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


// ADMIN ROUTES 
app.use('/admin', require('./routes/admin/home'));
app.use('/admin', require('./routes/admin/load'));
app.use('/admin', require('./routes/admin/change_rate'));
app.use('/admin', require('./routes/admin/register'));
app.use('/admin', require('./routes/admin/delete'));
app.use('/admin', require('./routes/admin/edit'));


// USER ROUTE
app.use('/user', require('./routes/user/home'));


// COMMON ROUTES
app.use('/', require('./routes/common/landing'));
app.use('/login', require('./routes/common/login'));
app.use('/reserve', require('./routes/common/reserve'));
app.use('/logout', require('./routes/common/logout'));
app.use('/terms', require('./routes/common/terms'));
app.use('/contact', require('./routes/common/contact'));



// listen for socket connection
io.on('connection', (socket) => {
    
    // log if someone has connected
    console.log('a client has connected');
    
    // log if someone has disconnected 
    socket.on('disconnect', () => console.log('user has disconnected'));


    // listen for a signal from client
    // if someone has reserved a slot
    socket.on('signalFromClient', (signal) => {
        if (signal.reservation) {
            return io.sockets.emit('signalFromServer', 
                {
                    refresh: true, 
                    reserved: true, 
                    slot: signal.slot
                });
        }
        
        io.sockets.emit('signalFromServer', {refresh: true});
    })

    // update if user is loaded
    socket.on('signalFromAdmin', (signal) => {
        signal.isLoaded && io.sockets.emit('signalFromServer', { refresh: true });
    })


    // listen for a signal when someone is actively reserving
    socket.on('activelyReserving', (data) => {

        // actively reserving
        if (data.isReserving) {

            Slot.findOne({slotLetter: data.slot}, (err, slot) => {

                let user = slot.currentUsers.filter(user => user === data.username)[0];
                
                if (data.username !== '' && data.username !== user) {
                    slot.currentUsers.push(data.username)
                    slot.save();
                    socket.broadcast.emit('activelyReserving', {isReserving: true, slot: data.slot});
                }
            })
            return;   
        }

        // if cancelled reservation
        Slot.findOne({ slotLetter: data.slot }, (err, slot) => {

            const remainingUsers = slot.currentUsers.filter(user => user !== data.username);
            slot.currentUsers = remainingUsers;
            slot.save();
            socket.broadcast.emit('activelyReserving', { isReserving: false, slot: data.slot });
        })

        
    })


    // listen for a signal coming from NodeMCU
    socket.on('signalFromMCU', (signal) => {

        if (signal.source === 'park') {
            
            let parkingSlot = signal.slot.toLowerCase();

            // find specific slot
            Slot.findOne({slotLetter: parkingSlot}, (err, slot) => {
                if (err) return console.log("No such slot!");

                // update SLOT database, change state
                // check if the slot is reserved
                if (slot.state === 'reserved') {
                    // change state and indicator
                    slot.indicator = 'red';
                    slot.state = 'occupied';
                    slot.save();

                    // send update to all connected devices
                    // socket.emit('signalForMCU', {fromServer: 'Hello NodeMCU'});
                    io.sockets.emit('signalFromServer', {refresh: true});
                }
            })

        } else if (signal.source === 'depart') {
            // update SLOT database, change state
            let departedSlot = signal.slot.toLowerCase();

            // find specific slot
            Slot.findOne({slotLetter: departedSlot})
            .populate('parokya')
            .exec((err, slot) => {

                if (err) return console.log("No such slot!");


                // check if the slot occupied
                if (slot.state === 'occupied') {
                    // change state and indicator
                    slot.indicator = 'green';
                    slot.state = 'vacant';
                    slot.parokya.reservation = {};
                    
                    slot.save();
                    slot.parokya.save();

                    // send update to all connected devices
                    io.sockets.emit('signalFromServer',
                        {
                            refresh: true,
                        });
                }
            })


        } else if (signal.source == 'entrance') {

            User.findOne({ rfid: signal.rfid }, (err, user) => {
                if (err) {
                    return socket.emit('signalFromServer', { access: 'denied' });
                }
                
                if (user === null || (user.reservation.slot === undefined)) {
                    console.log('access denied');
                    return socket.emit('signalFromServer', { access: 'denied' });
                }

                if (user.reservation.slot !== undefined) {

                    Slot.findOne({slotLetter: user.reservation.slot}, (err, slot) => {
                        if (slot.state === 'occupied') {
                            return socket.emit('signalFromServer', { access: 'denied' });
                        }
                        console.log('access granted');
                        return socket.emit('signalFromServer', { access: 'granted' });
                    })

                }
            })
        }
    });
})



// server listener
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log('Listening to PORT: ' + PORT);
});

            