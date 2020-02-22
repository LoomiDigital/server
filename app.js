require('dotenv-safe').config();

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');

const errorController = require('./controllers/error');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  User.findById('5e5010a25fd3090a915226d4')
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

mongoose
  .connect(process.env.MONGODB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: 'Inigo',
          email: 'inigo@test.com',
          cart: {
            items: []
          }
        });
        user.save();
      }
    });

    app.listen(3000, () => console.log('Listening on 3000'));
  })
  .catch(err => console.log(err));

app.use(errorController.get404);
