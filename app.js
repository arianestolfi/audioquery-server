var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var createPlayer = require('web-audio-player');

var index = require('./routes/index');

var translationApiRouter = require('./routes/translation');
var freesoundApiRouter = require('./routes/freesound');
var semantic = require('./routes/semantic');
var users = require('./routes/users');
var rooms = require('./routes/room');
var space = require('./routes/space');

var app = express();
var server = require('http').Server(app);
// var io = require('socket.io')(server); // Add this here
var io = require('socket.io')(server); // Add this here

// app.io=io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(function(req, res, next){
  res.io = io;
  next();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'node_modules', 'audioquery')));
app.use(express.static(path.join(__dirname, 'client')));
app.use('/translation', translationApiRouter);
app.use('/freesound', freesoundApiRouter);
app.use('/semantic', semantic);
app.use('/users', users);
// app.use('/chat/room', rooms);
app.use('/chat', rooms);
app.use('/space', space);
app.use('/', index);


app.get('/fs', () => console.log('fs'));
app.get('/chat', () => console.log('chat'));
app.get('/space', () => console.log('space'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
var err = new Error('Not Found');
err.status = 404;
next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}



// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = {app: app, server: server};
