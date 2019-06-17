const express = require("express");

const mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);

const bodyParser = require("body-parser");
const passport = require("passport");
const path = require("path");

const users = require("./routes/api/users");
const auth = require("./routes/api/auth");
const privakey = require("./routes/privakey");

const app = express();
const http = require('http').Server(app);

// Bodyparser middleware
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
app.use(bodyParser.json());

// DB Config
const db = require('./config/keys').mongoURI;

// Connect to Mongo
mongoose
    .connect(
        db,
        { useNewUrlParser: true }
    )
    .then(() => console.log("MongoDB successfully connected!"))
    .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

// Set up web sockets
let session = require('express-session')({
    secret: 'shhhhhh',
    resave: true,
    saveUninitialized: true
});

let websocket = require('./helpers/websocket');
let io = websocket.ioHelper(http, session)();

// Routes
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/auth", privakey(io));

// Serve static assets if in production
if(process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static('client/build'));
    
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

const port = process.env.PORT || 5000; // process.env.port is used by Heroku

http.listen(port, () => console.log(`Server up and running on port ${port}!`));