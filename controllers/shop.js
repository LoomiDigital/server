const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products =>
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Shop Products',
        path: '/products'
      })
    )
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products =>
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Shop Products',
        path: '/shop'
      })
    )
    .catch(err => console.log(err));
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product =>
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      })
    )
    .catch(err => console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.product')
    .execPopulate()
    .then(({ cart }) => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: cart.items
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;

  Product.findById(prodId)
    .then(product => req.user.addToCart(product))
    .then(() => res.redirect('/cart'));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
    .removeItem(prodId)
    .then(() => res.redirect('/cart'))
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        orders,
        pageTitle: 'Your Orders'
      });
    })
    .catch(err => console.log(err));
};

// exports.getCheckout = (req, res, next) => {
//   res.render('shop/checkout', {
//     path: '/checkout',
//     pageTitle: 'Checkout'
//   });
// };

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.product')
    .execPopulate()
    .then(({ cart }) => {
      const products = cart.items.map(({ product, quantity }) => ({
        product: { ...product._doc },
        quantity
      }));

      const order = new Order({
        products,
        user: {
          userId: req.user,
          name: req.user.name,
          email: req.user.email
        }
      });

      return order.save();
    })
    .then(() => req.user.clearCart())
    .then(() => res.redirect('/orders'))
    .catch(err => console.log(err));
};
