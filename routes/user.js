var express = require('express');
var router = express.Router();
var csurf = require('csurf');
var passport = require('passport');

var csurfProtection = csurf();
router.use(csurfProtection);

router.get('/profile', isLoggedIn, function (req, res, next) {
    res.render('user/profile');
});

router.get('/logout',isLoggedIn, function (req,res,next) {
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
    successRedirect: '/user/profile',  // При успешном прохождении реквеста и валидации
    failureRedirect: '/user/signup',   // При НЕуспешном прохождении реквеста и валидации
    failureFlash: true                // Использовать флэш при провале
}));



router.get('/signin', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/signin', {csurfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0})
});

router.post('/signin', passport.authenticate('local.signin', {
    successRedirect: '/user/profile',
    failureRedirect: '/user/signin',
    failureFlash: true
}));


module.exports = router;

function isLoggedIn(req, res, next) { // Если user авторизирован то просто продолжить, если нет - переслать на главную
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}

function notLoggedIn(req, res, next) { // Функция обратная предыдущей
    if(!req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}