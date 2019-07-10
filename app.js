// DEPENDENCIES
const createAdmin   = require('./bin/create-admin'),
      createSlots   = require('./bin/create-slots'),
      updateTime    = require('./bin/update-time'),
      bodyParser    = require('body-parser'),
      formatTime    = require('./bin/format-time'),
      excessTime    = require('./bin/excess-time'),
      validator     = require('express-validator'),
      mongoose      = require('mongoose'),
      session       = require('express-session'),
      express       = require('express'),
      getTime       = require('./bin/get-time'),
      calcExp       = require('./bin/calc-expiration'),
      bcrypt        = require('bcrypt'),
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




//========================================================//
//                    GENERAL ROUTE                       //
//========================================================//

// LANDING
app.get('/', (req, res) => {
    req.session.loginErrors = null;
    req.session.success = null;
    req.session.regErrors = null;
    req.session.inputValues = null;

    Slot.find({})
    .sort([['slotLetter', 'ascending']])
    .then((slots) => {
        Slot.countDocuments({state: 'vacant'}, (err, count) => {
            if (err) return console.log('Something went wrong querying the slots ...');

            res.render('landing', {slots: slots,  vacant: count});
        })     
    })
})


// LOGIN
app.get('/login', (req, res) => {
    req.session.regErrors = null;
    req.session.success = null;

    res.render('login', {errors: req.session.loginErrors, inputValues: req.session.inputValues});
})

app.post('/login', (req, res) => {

    let username = req.body.username;
    let password = req.body.password;

    // validate form if not empty
    req.checkBody('username', 'enter your username').notEmpty();
    req.checkBody('password', 'enter your password').notEmpty();

    // save errors
    let errors = req.validationErrors();

    // put the username to session
    req.session.inputValues = [{
        username: username,
    }];

    // if errors are found, show errors and
    // redirect to login page again
    if (errors) {
        req.session.loginErrors = errors;
        res.redirect('/login');
        return;
    }

    // if username and password not empty
    // find the specific user
    if (username && password != "") {

        // find user with the username
        User.findOne({username: username})
        .then((user) => {

            // if no such username
            if (!user) {
                req.session.loginErrors = [{msg: 'no such user'},];
                req.session.isValidated = false;
                res.redirect('/login');
            } else {

                // if username is valid, compare the password with the hashed password on DB
                bcrypt.compare(password, user.password, (err, result) => {

                    // if password match then we have a valid user
                    if (result) {

                        // if admin, redirect to admin's page
                        if (user.isAdmin) {
                            req.session.isAdmin = true;
                            req.session.admin = {
                                username: user.username,
                            }
                            res.redirect('/admin/home');
                        
                        // if user and not admin, redirect to user's home page
                        } else {
                            req.session.isValidated = true;
                            req.session.user = {
                                username: user.username,
                                balance: user.balance,
                                id: user._id,
                                reservation: user.reservation
                            }
                            res.redirect('/user/home');   
                        }
                    
                    // passwords don't match then flash error message
                    // redirect to login page
                    } else {
                        req.session.loginErrors = [{ msg: 'no such user' },];
                        req.session.isValidated = false;
                        res.redirect('/login');
                    }
                })
            }
        })
    }
})


// RESERVE
app.post('/reserve', (req, res) => {
    let username = req.body.username;
    let slotLetter = req.body.slotLetter;
    let requestFrom = req.body.requestFrom;

    // find specific slot in the DB
    Slot.findOne({slotLetter: slotLetter}, (err, slot) => {
        if (err) return console.log('Error finding the slot');

        // find the user who is reserving in the DB
        User.findOne({username: username}, (err, user) => {

            if (err) return console.log('Something went wrong');

            // check if the state is occupied
            if (slot.state == 'reserved' || slot.state == 'occupied') {
                return res.json({ response: 'someone has reserved this slot' });
            }

            // check if BALANCE is 0 or less than slot reservation rate
            if (user.balance == 0 || user.balance < slot.slotRate.reservationRate) {
                if (requestFrom === 'user') {
                    return res.json({response: "your balance is not enough"});
                } else {
                    return res.json({response: `${username}'s balance is not enough`});
                }
            }

            // check if valid slot
            if (user.reservation.slot != undefined) {
                if (requestFrom === 'user') {
                    return res.json({response: "can't reserve because you have an active subscription"}); 
                } else {
                    return res.json({response: `can't reserve because ${username} have an active subscription`});
                }       
            }

            // if nothing fails above, time to save it to the DB
            // set the date today
            let date = new Date();

            // calculate expiration date and time
            let expiration = calcExp(date, slot.slotRate.maxDuration);
            
            // formatted time e.g 12:00 PM
            // START AND END TIME for reservation
            let formattedStartTime = formatTime(date);
            let formattedEndTime = formatTime(new Date(expiration.rawDateTime));
            
            let remainingTime = getTime(new Date(expiration.rawDateTime));            

            // toggle slot state and indicator
            // and save the id of the user
            slot.state = 'reserved';
            slot.parokya = user._id;
            slot.indicator = 'orange';
            slot.save();

            // deduct user balance according to the reservation rate
            user.balance -= slot.slotRate.reservationRate;
            // save reservation TIME which is the formatted time
            user.reservation.time = formattedStartTime.time;
            // save the reservation DATE
            user.reservation.date = expiration.before;
            // save the particular slot where the user has reserved
            user.reservation.slot = slotLetter;
            // save remaining time hh:mm:ss (e.g 8 : 30 : 00)
            user.reservation.remainingTime = remainingTime;
            // save the expiration time string
            user.reservation.expiration.str = formattedEndTime.time
            // save the expiration time for future time calculations
            user.reservation.expiration.raw = expiration.rawDateTime;
            // save the duration    
            user.reservation.duration = expiration.duration;
            user.save();
            
            // check where the request is coming from
            // flash corresponding message to the user or admin
            if (requestFrom === 'user') {
                res.json({response: `successfully reserved at slot ${slotLetter}`,  refresh: true});
            } else {
                res.json({response: `${user.username} has been reserved successfully at slot ${user.reservation.slot}`,  refresh: true});
            }
            
        })
       

    })  
})


// LOGOUT
app.get('/logout', (req, res) => {
    // destroy session and redirect to login page
    req.session.destroy(() => {
        res.redirect('/login');
    })
})

app.get('/terms_conditions', (req, res) => {
    res.render('terms');
})


// SIMULATOR
app.get('/simulate', (req, res) => {
    res.render('simulate');
})
//                    GENERAL ROUTE                       //
//========================================================//





//========================================================//
//                       USER ROUTE                       //
//========================================================//
app.get('/user/home', (req, res) => {

    // empty unnecessary session variables
    req.session.loginErrors = null;
    req.session.success = null;
    req.session.regErrors = null;
    req.session.inputValues = null;

    // if user is not validated, return to login page
    if (!req.session.isValidated) return res.redirect('/login');

    // find all slots
    Slot.find({})
    // sort slots from A - D
    .sort([['slotLetter', 'ascending']])
    .then((slots) => {
        // count vacant slots
        Slot.countDocuments({state: 'vacant'}, (err, count) => {
            if (err) return console.log('Something went wrong querying the slots ...');

            // find user
            User.findOne({username: req.session.user.username}, 
            '_id username balance debt reservation remainingTime expiration', (err, user) => {

                // if something goes wrong, log error
                if (err) return console.log('error finding such user ...');

                // if nothing else fails render home page
                res.render('home',
                    {
                        user: user,
                        slots: slots, 
                        vacant: count,
                    }
                );
               
            })
        })     
    })
})

//                       USER ROUTE                       //
//========================================================//





//========================================================//
//                       ADMIN ROUTES                     //
//========================================================//

//HOME
app.get('/admin/home', (req, res) => {
    req.session.loginErrors = null;
    req.session.success = null;
    req.session.regErrors = null;
    req.session.inputValues = null;

    // if not admin, redirect to login page
    if (!req.session.isAdmin) return res.redirect('/login');

    // find all slot 
    // and find all the user who has an active reservation
    Slot.find({})
    .populate('parokya')
    .sort([['slotLetter', 'ascending']])
    .exec((err, slots) => {

        if (err) return console.log('Error querying slots ...');

        // count vacant slots
        Slot.countDocuments({state: 'vacant'}, (err, count) => {
            if (err) return console.log('Something went wrong querying the slots ...');
            
            // find all users that are registered and sort from a-z
            User.find({})
            .sort([['username', 'ascending']])
            .then((users) => {
                if (err) return console.log('Something went wrong getting users ...');

                // loop through each reserved user
                // calculate expiration and remaining time
                users.forEach(user => {
                    if (user.reservation.expiration.raw != undefined) {
                        let expiration = getTime(new Date(user.reservation.expiration.raw).getTime());
                        user.reservation.remainingTime = expiration;
                        user.save();
                    }
                })

                // if nothing fails above, render admin's page
                res.render('admin', {users: users, admin: req.session.admin, slots: slots, vacant: count});
            })
        })     
    })
})

// LOAD USER
app.get('/admin/load/:username', (req, res) => {
    let username = req.params.username;

    // if not admin redirect to login page
    if (!req.session.isAdmin) return res.redirect('/login');

    // find specific user to load
    User.findOne({username: username}, (err, user) => {
        if (err) return console.log('Something went wrong getting users ...');

        // find all users and sort from a-z
        // to be rendered on the page
        User.find()
        .sort([['username', 'ascending']])
        .then((users) => {

            // find a one slot to get the reservation rates
            Slot.findOne({ slotLetter: 'a' }, (err, slot) => {

                // then render user's page
                res.render('user',
                    {
                        slotRate: slot.slotRate,
                        users: users,
                        user: user,
                        admin: req.session.admin,
                    });
            })

        })

    })
})

app.post('/admin/load', (req, res) => {
    let username = req.body.username;
    let amount = req.body.amount;
    
    // check if amount is not undefined
    if (amount === undefined) {
        return res.json({response: 'invalid amount'});
    }

    // find specific user using the username
    User.findOne({username: username})
    .then((user) => {

        // variable for storing responses
        let msg = '';

        // convert amount to number
        amount = Number(amount);
        // save username to session
        req.session.username = username;
        // add the amount to balance
        user.balance += amount;

        // check if balance is sufficient to pay debt
        if (user.balance < user.debt) {
            user.debt -= user.balance;
            user.balance = 0;
            msg = `successfully loaded P ${amount} to ${username}
            & debt has been deducted P ${amount}, remaining debt is P ${user.debt}`;
        
        // if balance is equal to debt
        } else if (user.balance === user.debt) {
            user.balance -= user.debt;
            user.debt = 0;
            msg = `successfully loaded P ${amount} to ${username} 
            & balance has been deducted P ${user.balance}, remaining balance is 0`;
        
        // if debt is zero (0)
        } else if (user.debt === 0) {
            msg = `successfully loaded P ${amount} to ${username}`;
        
        // if balance is greater than debt
        } else {
            user.balance -= user.debt;  
            user.debt = 0;
            msg = `successfully loaded P ${amount} to ${username}
            & debt is fully paid, remaining balance is P ${user.balance}`;
        }

        // save the user's balance and debt update
        // send a response
        user.save();
        res.json({msg: msg, success: true});
    })

})


// CHANGE RATE
app.post('/admin/change_rate', (req, res) => {
    let ratePerMin = Number(req.body.ratePerMin);
    let maxDuration = req.body.maxDuration;
    let reservationRate = req.body.reservationRate;

    // find all slot and save the current reservation rates
    // i.e. rate per minute, max duration of reservation etc.
    Slot.find({}, (err, slots) => {
        slots.forEach(slot => {        
            slot.slotRate.ratePerMin = ratePerMin;
            slot.slotRate.maxDuration = maxDuration;
            slot.slotRate.reservationRate = reservationRate;
            slot.save();
        })
    })
    // send response
    res.json({slotRate: 'changed', msg: 'successfully changed parking rate'});
})


// REGISTER USER
app.get('/admin/register', (req, res) => {
    req.session.loginErrors = null;
    req.session.success = null;
    req.session.username = null;

    // if not admin redirect to login page
    if (!req.session.isAdmin) return res.redirect('/login');

    // if nothing fails, render registration page
    res.render('register', {errors: req.session.regErrors, inputValues: req.session.inputValues});
})

app.post('/admin/register', (req, res) => {

    // parse request body
    let fname = req.body.fname;
    let lname = req.body.lname;
    let mi = req.body.mi;
    let username = req.body.username;
    let password = req.body.password;
    let cpassword = req.body.cpassword;
    let contact = req.body.contact;
    let rfid = req.body.rfid;
    let balance = req.body.balance;


    // check for empty fields before saving to db
    req.checkBody('fname', 'first name is required').notEmpty();
    req.checkBody('lname', 'last name is required').notEmpty();
    req.checkBody('mi', 'middle initial is required').notEmpty();
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('password', 'please provide a password').notEmpty();
    req.checkBody('balance', 'please provide initial balance').notEmpty();
    req.checkBody('contact', 'contact number is required').notEmpty();

    // store errors in the session
    let errors = req.validationErrors();

    // store input fields
    req.session.inputValues = [{
        username: username,
        fname: fname,
        lname: lname,
        mi: mi,
        password: password,
        rfid: rfid,
        balance: balance,
        contact: contact,
    }];


    // check for errors
    if (errors) {
        req.session.regErrors = errors;
        res.redirect('/admin/register');
        return;
    }

    // check if passwords match
    if (password != cpassword) {
        req.session.regErrors = [{msg: 'Password do not match!'}];
        res.redirect('/admin/register');
        return;
    }

    // if no errors, hash the pw and save to DB
    // and create new user
    bcrypt.hash(password, 10, (err, hashedPW) => {

        let newUser = {
            fname: fname,
            lname: lname,
            mi: mi,
            username: username,
            password: hashedPW,
            rfid: rfid,
            balance: balance,
            contact: contact,
        };

        if (err) return console.log('Error hashing the password');

        User.create(newUser, (err, newUser) => {

            if (err) return console.log('Error in creating a new parokya ...');

            req.session.success = 'successfully added new parokya !';
            req.session.inputValues = null;
            req.session.regErrors = null;
            res.redirect('/admin/home');
        })
    })
    
})


// DELETE USER
app.post('/admin/delete', (req, res) => {

    User.findOneAndRemove({username: req.body.username}, (err, result) => {

        if (err) return res.json({msg: 'something went wrong deleting the user'});

        res.json({msg: 'user deleted successfully!'});
    })

})


// EDIT USER
app.get('/admin/:username/edit', (req, res) => {

    // if not admin redirect to login page
    if (!req.session.isAdmin) return res.redirect('/login');

    // find the username given in the URL 
    User.findOne({username: req.params.username}, 'username fname mi lname rfid contact', (err, user) => {

        // if nothing fails, render edit page
        res.render('edit', {user: user});
    })
    
})

app.post('/admin/:username', (req, res) => {

    // find specific user and update
    User.findOneAndUpdate({username: req.params.username}, req.body.user, (err, user) => {
        // redirect to user's page
        res.redirect(`/admin/load/${req.body.user.username}`);
    })
})


//                       ADMIN ROUTES                     //
//========================================================//




// listen for connection
io.on('connection', (socket) => {
    
    // log if someone has connected
    console.log('a client has connected');
    
    // log if someone has disconnected 
    socket.on('disconnect', () => console.log('user has disconnected'));


    // listen for a signal from client
    // if someone has reserved a slot
    socket.on('signalFromClient', (signal) => {
        if (signal.reservation) {
            io.sockets.emit('signalFromServer', {refresh: true, reserved: true, slot: signal.slot});

        } else if (signal.changedRate) {
            io.sockets.emit('signalFromServer', {refresh: true});

        } else if (signal.isCurrentlyReserving) {

            Slot.findOne({slotLetter: signal.slot}, (err, slot) => {
                if (err) return console.log('error finding slot');

                slot.state = 'reserved';
                slot.indicator = 'orange';
                slot.save();
                io.sockets.emit('signalFromServer', 
                    {
                        refresh: true, 
                        isCurrentlyReserving: true, 
                    });
            })

        // if cancelled on reserving
        } //else if (!signal.isCurrentlyReserving) {
        //     Slot.findOne({slotLetter: signal.slot}, (err, slot) => {

        //         if (err) return console.log('error finding slot');

        //         slot.state = 'vacant';
        //         slot.indicator = 'green';
        //         slot.save();
        //         io.sockets.emit('signalFromServer', 
        //             {
        //                 refresh: true,
        //             });             
        //     })
        // }
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
                    console.log('access granted');
                    return socket.emit('signalFromServer', { access: 'granted' });
                }
            })

        } else {
            socket.emit('signalFromServer', {messageFromServer: 'Hello'});
        }
    });

    socket.on('signalFromAdmin', (signal) => {
        if (signal.isLoaded) {
            io.sockets.emit('signalFromServer', {refresh: true});
        }
    })
})



// server listener
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log('Listening to PORT: ' + PORT);
});

            