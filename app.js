var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
var session = require('express-session');             // Инициализация сессий
var passport = require('passport');                  // Для авторизации
var flash = require('connect-flash');                // Для вывода сообщения об ошибки (прикр. к request)
var validator = require('express-validator');       // Для валидации данных прикрепленных к request
var MongoStore = require('connect-mongo')(session); // Пакет для хранения памти сессии на сервере

var index = require('./routes/index');
var userRoutes = require('./routes/user');

mongoose.connect('mongodb://localhost:27017/shopping');
require('./config/passport');

var app = express();

// view engine setup
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUnitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),// Нам не нужно создавать новое соеденение,
    // если мы уже открыли mongoose
    cookie: { maxAge: 180 * 60 * 1000 } // Время жизни сессии
    }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.locals.login = req.isAuthenticated(); // set a global variable
    res.locals.session = req.session;
    next();
});

app.use('/user', userRoutes);
app.use('/', index);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
