const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transport = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_SECRET
    }
  })
);

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: req.flash('error')
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Sign Up',
    isAuthenticated: false,
    errorMessage: req.flash('error')
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/login');
      }

      return bcrypt.compare(password, user.password).then(doMatch => {
        if (doMatch) {
          req.session.user = user;
          req.session.isLoggedIn = true;

          return req.session.save(err => {
            res.redirect('/');
          });
        }

        req.flash('error', 'Invalid email or password');
        res.redirect('/login');
      });
    })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => res.redirect('/'));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.findOne({ email })
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', 'Email already exists, please pick another one');
        return res.redirect('/signup');
      }

      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(() => {
          transport.sendMail({
            to: email,
            from: 'admin@loomi.io',
            subject: 'Signup succeeded!',
            html: '<h1>Welcome to the bookshop</h1>'
          });
        })
        .then(() => res.redirect('/login'));
    })
    .catch(err => console.log(err));
};

exports.getReset = (req, res, next) => {
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    isAuthenticated: false,
    errorMessage: req.flash('error')
  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;

  crypto.randomBytes(32, (err, buffer) => {
    const token = buffer.toString('hex');

    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }

    User.findOne({ email })
      .then(user => {
        if (!user) {
          req.flash('error', 'An account for this email does not exist');
          return res.redirect('/login');
        }
        user.resetToken = token;
        user.tokenExpiration = Date.now() + 3600000;

        return user.save();
      })
      .then(() => {
        res.redirect('/');

        transport.sendMail({
          to: email,
          from: 'admin@loomi.io',
          subject: 'Password reset',
          html: `
          <h1>Password Reset</h1>
          <p>You requested a password reset</p>
          <p>Please click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password</p>
          `
        });
      })
      .catch(err => console.log(err));
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({ resetToken: token, tokenExpiration: { $gt: Date.now() } })
    .then(user => {
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: req.flash('error'),
        userId: user._id,
        passwordToken: token
      });
    })
    .catch(err => console.log(err));
};

exports.postNewPassword = async (req, res, next) => {
  const { userId, passwordToken, password } = req.body;

  const user = await User.findOne({
    _id: userId,
    resetToken: passwordToken,
    tokenExpiration: { $gt: Date.now() }
  }).catch(err => console.log(err));

  const hashedPassword = await bcrypt.hash(password, 12);

  user.password = hashedPassword;
  user.resetToken = undefined;
  user.tokenExpiration = undefined;

  await user.save();
  res.redirect('/login');
};
