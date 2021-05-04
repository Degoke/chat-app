require("dotenv").config();
const passport = require("passport");
const ObjectID = require("mongodb").ObjectID;
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

module.exports = (app, myDataBase) => {
  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(`user ${username} tried to log in`);
        if (err) {
          return done(err);
        }
        if (!user) {
          console.log("not user");
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          console.log("not password");
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
};
