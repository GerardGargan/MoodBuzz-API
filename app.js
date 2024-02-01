const express = require('express');
const dotenv = require('dotenv').config({ path: 'config.env' });

const PORT = process.env.PORT || 3001;

const app = express();

app.listen(PORT, (err) => {
    console.log(`API Server listening on PORT ${PORT}`);
});