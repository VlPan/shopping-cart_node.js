var express = require('express');
var router = express.Router();
var passport = require('passport');

var Product = require('../models/product');
var Cart = require('../models/cart');
var Admin = require('../models/admin');
var Order = require('../models/order');
var User = require('../models/user');

/* GET home page. */
router.get('/', function (req, res, next) {
    var successMsg = req.flash('success')[0];
    Product.find(function (err, docs) {
        var productsChunks = [];
        chunkSize = 3;
        for (var i = 0; i < docs.length; i += chunkSize) {
            productsChunks.push(docs.slice(i, i + chunkSize));
        }
        res.render('shop/index', {
            title: 'Shopping-list',
            products: productsChunks,
            successMsg: successMsg,
            noMessages: !successMsg
        });
    });
});

router.get('/add-to-cart/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    Product.findById(productId, function (err, product) {
        if (err) return res.redirect('/');

        cart.add(product, product.id);
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('/');
    });
});

router.get('/shopping-cart', function (req, res, next) {
    if (!req.session.cart) {
        return res.render('shop/shopping-cart', {products: null});
    }

    var cart = new Cart(req.session.cart);
    console.log(cart.generateArray());
    res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/checkout', isLoggedIn, function (req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];
    res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});

});

router.post('/checkout', isLoggedIn, function (req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart);
    var stripe = require("stripe")("sk_test_pgbholRGLA5rYJBPa1LZqJ3q");

    stripe.charges.create({
        amount: cart.totalPrice * 100,
        currency: "usd",
        source: req.body.stripeToken,
        description: 'Test Charge'
    }, function (err, charge) {
        if (err) {
            req.flash('error', err.message);
            return redirect('/checkout')
        }

        var order = new Order({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        });
        order.save(function (err, result) {
            req.flash('success', 'Successfully boat product');
            req.session.cart = null;
            res.redirect('/');
        });
    });
});

router.get('/admin',function (req,res,next) {
    res.render('admin/signin')
});

router.get('/admin/adminPanel',isLoggedIn, function (req, res, next) {
    res.render('admin/adminPanel')
});

router.post('/admin/signin', function (req, res, next) {
    console.log(req.body.email);
    Admin.findOne({email: req.body.email}, function (err, admin) {
        if(err){
            console.log('err')
           return res.render('admin/signin');
        }
        if(!admin){
            console.log('No admin');
            return res.render('admin/signin');
        }
        var orders = Order.find(function (err, orders){
            var products = Product.find(function (err, products) {
                var users = User.find(function (err, users) {
                    res.render('admin/adminPanel', {orders, products, users})
                });
            });
        });
    });

});
module.exports = router;

function isLoggedIn(req, res, next) { // Если user авторизирован то просто продолжить, если нет - переслать на главную
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}