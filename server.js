require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const path = require('path')
const passport = require('passport')
const session = require('express-session')
const routes = require('./routes')
const auth = require('./auth')



const app = express();

const http = require('http').createServer(app)
const io = require('socket.io')(http)

const passportSocketIo = require('passport.socketio')
const cookieParser = require('cookie-parser')

const MongoStore = require('connect-mongo')(session)
const URI = process.env.MONGO_URI
const store = new MongoStore({ url: URI })

app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "pug");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    key: "express.sid",
    store: store,
  })
);

app.use(passport.initialize())
app.use(passport.session())

const onAuthorizeSuccess = (data, accept) => {
  console.log('successful connection to socket.io')
  accept(null, true)
}

const onAuthorizeFail = (data, message, error, accept) => {
  if (error) { throw new Error(message) }
  console.log('failed connection to socket.io', message)
  accept(null, false)
}


io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  routes(app, myDataBase)
  auth(app, myDataBase)

  let currentUsers = 0;

  io.on('connection', socket => {
    ++currentUsers
    io.emit('user', {
      name: socket.request.user.username,
      currentUsers,
      connected: true
    });

    socket.on('chat message', (message) => {
      io.emit('chat message', { name: socket.request.user.username, message });
    });

    socket.on('disconnect', () => {
    --currentUsers
    io.emit('user', {
      name: socket.request.user.username,
      currentUsers,
      connected: false
    });
  })
  })

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found')
  })


}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' })
  })
})


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});