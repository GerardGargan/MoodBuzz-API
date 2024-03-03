const bcrypt = require('bcrypt');

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

  //format a date returned from a database
  function formatDatabaseDate(date) {
    const databaseDate = new Date(date);
    const year = databaseDate.getFullYear();
    const month = databaseDate.getMonth() + 1; //zero indexed
    const day = databaseDate.getDate();
  
    return `${day}/${month}/${year}`;
  }
  
  //Get the current date YY/MM/DD in this format for the mysql database insertion
  function getCurrentDate() {
    let currentDate = new Date();
  
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth() + 1; //zero indexed
    let date = currentDate.getDate();
  
    let formattedDate = `${year}/${month}/${date}`;
  
    return `${formattedDate}`;
  }
  
  //Get the current time
  function getCurrentTime() {
    let currentDate = new Date();
  
    let hours = currentDate.getHours();
    let minutes = currentDate.getMinutes();
    let seconds = currentDate.getSeconds();
  
    let formattedTime = `${hours}:${minutes}:${seconds}`;
    return formattedTime;
  }
  
  //export helper functions
  module.exports = {
    hashPassword, comparePassword, formatDatabaseDate, getCurrentDate, getCurrentTime
  }