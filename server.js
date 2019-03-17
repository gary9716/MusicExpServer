require('dotenv').config();
const IO_SERVER_PORT = process.env.PORT || 8080;
const express = require('express');
var cookieParser = require('cookie-parser');
var path = require('path');
const app = express();
app.use(cookieParser());

app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

let idCounter = 0;

/*
const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 1000 }
}));
*/

const server = require('http').Server(app);
const io = require('socket.io')(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
});
const masterGroup = io.of('/master');
const clientGroup = io.of('/client');

let isValid = () => { return true };
// middleware
masterGroup.use((socket, next) => {
    //ex: /master?token=abc
    let token = socket.handshake.query.token;
    if (isValid(token)) {
      return next();
    }
    else
        return next(new Error('authentication error'));
});

let sendCmd = (socket, channel, data) => {
    socket.emit(channel, data);
}

masterGroup.on('connect', (socket) => {
    //console.log('master connected');
    socket.on('color', (data) => {
        sendCmd(clientGroup, 'color', data);
    });
}); 

clientGroup.on('connect', (socket) => {
    //console.log('client connected');
    sendCmd(socket, 'color', JSON.stringify({ r:100, g:120, b:50 }));
});

app.get('/', (req, res) => {
    res.render('index', { cid: idCounter } );
    idCounter++;
});

server.listen(IO_SERVER_PORT, function (err) {
    if(err) throw err;
    console.log('server listen on ' + IO_SERVER_PORT);
});