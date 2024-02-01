const express = require('express');
const dotenv = require('dotenv').config({ path: 'config.env' });
const router = require('./routes/routes');

const PORT = process.env.PORT || 3001;

const app = express();

app.use('/', router);

app.listen(PORT, (err) => {
    console.log(`API Server listening on PORT ${PORT}`);
});