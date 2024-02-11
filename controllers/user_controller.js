const db = require('../util/dbconn');
const bcrypt = require('bcrypt');

exports.getUser = (req, res) => {
    res.send('user route');
}

exports.postLogin = async (req, res) => {
    //destructure the values into variables
    const { email, password } = req.body;

    //set up in an array for the query function
    const vals = [email, password];
    const selectSQL = `SELECT * FROM user WHERE email_address = ?`;

    try {
        //query the database
      const [userData, fieldData] = await db.query(selectSQL, vals);
      //check if at least one row is returned, if so a user exists with the email address given
      if (userData.length >= 1) {
        console.log("user exists");
        //access the first element of the array to get the user details (we should only ever return one element)
        console.log(userData[0].email_address);

        //get the stored hashed password from the database
        const hashedPassword = userData[0].password.toString();

        //check if the plain text password matches the hashed password
        const passwordMatch = await comparePassword(password, hashedPassword);
        if (passwordMatch) {
          //email and password matches - pass back a success status and the user details record
            res.status(200);
            res.json({
                status: 'success',
                message: 'Username and password match',
                result: userData
            });
        } else {
            //password does not match
          console.log("Password does not match");
          res.status(401);
          res.json({
            status: 'failure',
            message: 'invalid credentials'
          });
        }
      } else {
        //user does not exist
        console.log("user does not exist");
        res.status(404);
        res.json({
            status: 'failure',
            message: 'invalid email address'
        });
      }
    } catch (err) {
        //server error
      res.status(500);
      res.json({
        status: 'failure',
        message: `Error making API request: ${err}`
      });
    }
}

//takes a plain text password, returns a salted and hashed password using bcrypt
async function hashPassword(password) {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (err) {
      throw err;
    }
  }
  
  //compares a plain text password and a salted/hashed password (bcrypt), returns true if they are a match
  async function comparePassword(password, hashedPassword) {
    try {
      const match = await bcrypt.compare(password, hashedPassword);
      return match;
    } catch (err) {
      throw err;
    }
  }