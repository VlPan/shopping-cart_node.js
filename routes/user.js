var express = require('express');
var router = express.Router();
var csurf = require('csurf');
var passport = require('passport');
var Order = require('../models/order');
var Cart = require('../models/cart');

var csurfProtection = csurf();
router.use(csurfProtection);

router.get('/profile', isLoggedIn, function (req, res, next) {
    Order.find({user: req.user}, function (err, orders) {
        if(err){
            return res.write('Error!');
        }
        var cart;
        orders.forEach(function (order) {
            var cart = new Cart(order.cart);
            order.items = cart.generateArray();
        });
        res.render('user/profile', {
            orders: orders
        });
    });

});

router.get('/logout', isLoggedIn, function (req, res, next) {
    req.logOut();
    res.redirect('/');
});

router.use('/', notLoggedIn, function (req, res, next) {
    next();
});

router.get('/signup', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/signup', {csurfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0})
});

router.post('/signup', passport.authenticate('local.signup', { // Используем стратегию созданную в passport.js
    // successRedirect: '/user/profile',  // При успешном прохождении реквеста и валидации
    failureRedirect: '/user/signup',   // При НЕуспешном прохождении реквеста и валидации
    failureFlash: true                // Использовать флэш при провале
}), function (req, res, next) { // если не failure
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);

    } else {
        res.redirect('/user/profile')
    }
});


router.get('/signin', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/signin', {csurfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0})
});

router.post('/signin', passport.authenticate('local.signin', {
    // successRedirect: '/user/profile',
    failureRedirect: '/user/signin',
    failureFlash: true
}), function (req, res, next) { // если не failure
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('/user/profile')
    }
});




module.exports = router;

function isLoggedIn(req, res, next) { // Если user авторизирован то просто продолжить, если нет - переслать на главную
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function notLoggedIn(req, res, next) { // Функция обратная предыдущей
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}