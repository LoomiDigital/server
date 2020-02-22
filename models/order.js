const { Schema, model } = require('mongoose');

const orderSchema = new Schema({
  products: [
    {
      product: {
        type: Object,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      }
    }
  ],
  user: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User' }
  }
});

module.exports = model('Order', orderSchema);
