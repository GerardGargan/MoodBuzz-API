const dotenv = require('dotenv').config({ path: 'config.env' });
const app = require('./app');
const PORT = process.env.PORT || 3001;

app.listen(PORT, (err) => {
    console.log(`API Server listening on PORT ${PORT}`);
});