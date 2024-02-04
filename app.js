const express = require('express');

const router = require('./routes/routes');

const PORT = process.env.PORT || 3001;

const app = express();

app.use('/', router);

module.exports = app;