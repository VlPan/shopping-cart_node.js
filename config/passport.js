var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy; // выбираем локальную стратегию


// 2 обязательных метода для пасспорта
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    })
});


// Создаем новую локальную стратегию - middleware
passport.use('local.signup', new LocalStrategy({   // название. Обьект
    usernameField: 'email',    // Совпадение с инпут
    passwordField: 'password', // Совпадение с инпут
    passReqToCallback: true    // Передаем пароль в колбэк
}, function (req, email, password, done) {
    // Validation part
    req.checkBody('email', 'Invalid email').notEmpty().isEmail();  // Валидация прикреплена к req за счет express-validator
    req.checkBody('password', 'Invalid password. Min length: 6').notEmpty().isLength({min: 6});
    var errors = req.validationErrors(); // Если есть ошибки
    if (errors) {
        var messages = [];
        errors.forEach(function (error) {
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages)) // Заверишть рекуест и записать во влэш все сообщения об ошибках!
    }

    // IF Email EXIST or not
    User.findOne({'email': email}, function (err, user) {
        if (err)
            return done(err);
        if (user) {
            return done(null, false, {message: 'Email is already in use'});
        }
        var newUser = new User(); // Use User Model that we created for users
        newUser.email = email;
        newUser.password = newUser.encryptPassword(password); // Encrypt password via bcrypt
        newUser.save(function (err, result) {
            if (err) {
                return done(err)
            } else {
                return done(null, newUser);
            }
        })
    })
}));

passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, email, password, done) {
    req.checkBody('email', 'Invalid email').notEmpty().isEmail();
    req.checkBody('password', 'Invalid password.').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        var messages = [];
        errors.forEach(function (error) {
            messages.push(error.msg);
        })
        return done(null, false, req.flash('error', messages))
    }
    User.findOne({'email': email}, function (err, user) {
        if (err)
            return done(err);
        if (!user) {
            return done(null, false, {message: 'No User found'});
        }
        if (!user.validPassword(password)) {
            return done(null, false, {message: 'Incorrect password!!!'})
        }
        return done(null, user);
    });
}));