const express = require('express');

const snapshot_router = require('./routes/snapshot_routes');
const user_router = require('./routes/user_routes');
const emotion_router = require('./routes/emotion_routes');
const trigger_router = require('./routes/trigger_routes');

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/snapshot', snapshot_router);
app.use('/user', user_router);
app.use('/emotions', emotion_router);
app.use('/triggers', trigger_router);

module.exports = app;