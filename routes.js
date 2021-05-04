const path = require('path')
const passport = require('passport')
const ObjectID = require('mongodb').ObjectID
const bcrypt = require('bcrypt')

module.exports = (app, myDataBase) => {
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    console.log('not authenticated')
    res.redirect('/')
  }

  app.route('/').get((req, res) => {
    res.render('pug', { title: 'Welcome', message: 'Please login', showLogin: true, showRegistration: true, showChat: false});
  });

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/chat')
  })

  app.route('/register').post((req, res, next) => {
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
      if (err) { next(err) }
      else if (user) { console.log('already user'); res.redirect('/') }
      else {
        const salt = 10
        const hash = bcrypt.hashSync(req.body.password, salt)
        myDataBase.insertOne({ username: req.body.username, password: hash }, (err, doc) => {
          if (err) { res.redirect('/') }
          else { next(null, doc.ops[0]) }
        })
      }

    })
  }, passport.authenticate('local', { failureRedirect: '/' }), (req, res, next) => {
    res.redirect('/chat')
  })

  app.route('/logout').get((req, res) => {
    req.logout()
    res.redirect('/')
  })

  app.route('/chat').get(ensureAuthenticated, (req, res) => {
    res.render("pug", {
      username: req.user.username,
      user: req.user,
      title: "",
      message: "",
      showLogin: false,
      showRegistration: false,
      showChat: true,
    });
  })
  
}