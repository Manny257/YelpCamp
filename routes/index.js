const { ifError } = require("assert");

var express = require("express"),
  User = require("../models/user"),
  Campground = require("../models/campground"),
  passport = require("passport"),
  middleware = require("../Middleware"),
  async = require("async"),
  nodemailer = require("nodemailer"),
  crypto = require("crypto"),
  router = express.Router();


//root
router.get("/", function (req, res) {
  res.render("landing");
});

//Register form
router.get("/register", function (req, res) {
  res.render("register");
});

//SignUp Logic
router.post("/register", function (req, res) {
  var newUser = new User({
    username: req.body.username,
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName
  });
  if (req.body.adminCode === "secretCode") {
    newUser.isAdmin = true;
  }
  User.register(newUser, req.body.password, function (err, user) {
    if (err)
      return res.render("register", { error: err.message });

    passport.authenticate("local")(req, res, function () {
      req.flash("success", "Welcome to YelpCamp, " + user.firstName);
      res.redirect("/campgrounds");
    });

  });
});

//LogIn form
router.get("/login", function (req, res) {
  res.render("login");
});

//LogIn logic
router.post("/login", passport.authenticate("local",
  {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  }), function (req, res) {
  });

//LogOut
router.get("/logout", function (req, res) {
  req.logOut();
  req.flash("success", "Successfully Logged Out");
  res.redirect("/campgrounds");
});

//forgot password
router.get("/forgot", function (req, res) {
  res.render("forgot");
});

//forgot logic
router.post("/forgot", function (req, res, next) {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString("hex");
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash("error", "No account with that email exists");
          return res.redirect("/forgot");
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 36000000 //an hour
        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "webdevelopmenttrails@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOption = {
        to: user.email,
        from: "YelpCamp",
        subject: "YelpCamp Password Reset",
        text: "please click on the following link to reset your password.\n\n" +
          "http://" + req.headers.host + "/reset/" + token + "\n\n" +
          "If you don't request this ignore the mail"
      };
      smtpTransport.sendMail(mailOption, function (err) {
        console.log("mail sent");
        req.flash("success", "an e-mail has been sent to " + user.email);
        done(err, "done");
      });
    }
  ], function (err) {
    if (err)
      return next(err);
    res.redirect("/forgot");
  });
});

//reset
router.get('/reset/:token', function (req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', { token: req.params.token });
  });
});

//reset logic
router.post('/reset/:token', function (req, res) {
  async.waterfall([
    function (done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if (req.body.password === req.body.confirm) {
          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function (err) {
            if (err) {
              req.flash("error", "Somthing went wrong");
              res.redirect("/forgot");
            }
            req.logIn(user, function (err) {
              if (err) {
                req.flash("error", "Somthing went wrong");
                res.redirect("/forgot");
              }
            });
            done(err, user);
          });
        }
        else {
          req.flash("error", "Passwords don't match!");
          res.redirect("back");
        }
      });

    },
    function (user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: "webdevelopmenttrails@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'YelpCamp',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('success', 'Your password has been changed successfully.');
        done(err);
      });
    }
  ], function (err) {
    res.redirect('/campgrounds');
  });
});

//user profile
router.get("/users/:id", function (req, res) {
  User.findById(req.params.id).populate("followers").exec(function(err, user){
    if (err) {
      req.flash("error", "something went wrong");
      res.redirect("/campgrounds");
    }
    else {
      Campground.find().where("author.id").equals(user._id).exec(function (err, campgrounds) {
        if (err) {
          req.flash("error", "something went wrong");
          return res.redirect("/campgrounds");
        }
        res.render("users/show", { user: user, campgrounds: campgrounds });
      });
    }
  });
});

//follow user
router.get("/follow/:id", middleware.isLoggedIn, function(req,res){
  User.findById(req.params.id,function(err,user){
    if(err){
      req.flash("error","Something went wrong");
      return res.redirect("back");
    }
    user.followers.push(req.user._id);
    user.save();
    res.redirect("/users/"+req.params.id);
  });
});

module.exports = router;