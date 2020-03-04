const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  resetToken: String,
  tokenExpiration: Date,
  cart: {
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ]
  }
});

userSchema.methods.addToCart = function({ _id }) {
  const cartProductIndex = this.cart.items.findIndex(
    ({ product }) => product.toString() === _id.toString()
  );

  const updatedCart = [...this.cart.items];

  if (cartProductIndex !== -1) {
    updatedCart[cartProductIndex].quantity =
      this.cart.items[cartProductIndex].quantity + 1;
  } else {
    updatedCart.push({ product: _id, quantity: 1 });
  }

  this.cart = {
    items: updatedCart
  };

  return this.save();
};

userSchema.methods.removeItem = function(productId) {
  this.cart.items = this.cart.items.filter(
    ({ product }) => product.toString() !== productId.toString()
  );

  return this.save();
};

userSchema.methods.clearCart = function() {
  this.cart.items = [];

  return this.save();
};

module.exports = model('User', userSchema);
