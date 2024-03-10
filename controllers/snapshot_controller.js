const db = require("../util/dbconn");
//import utility custom functions
const {
  formatDatabaseDate,
  getCurrentDate,
  getCurrentTime,
} = require("../util/helper_functions");

exports.getSnapshot = async (req, res) => {
  //get the snapshot id
  const { id } = req.params;
  const userid = req.headers.userid; //user id sent through headers

  //set up query
  const queryEmotions = `SELECT snapshot.snapshot_id, snapshot.user_id, note, date, time, snapshot_emotion_id, emotion, emotion.emotion_id, snapshot_emotion.rating FROM snapshot INNER JOIN snapshot_emotion ON snapshot.snapshot_id = snapshot_emotion.snapshot_id INNER JOIN emotion ON snapshot_emotion.emotion_id = emotion.emotion_id
        WHERE snapshot.snapshot_id = ? AND user_id = ?`;

  //store in an array for the query
  const vals = [id, userid];

  try {
    const [rows, fielddata] = await db.query(queryEmotions, vals);

    //check if any rows were returned
    if (rows.length > 0) {
      //snapshot exists, set up an empty object which we will parse the data into
      const groupedData = {};

      //parse the data into a data structure representing a snapshot
      rows.forEach((row) => {
        //destructure the information from each row retrieved
        const {
          snapshot_id,
          user_id,
          note,
          date,
          time,
          snapshot_emotion_id,
          rating,
          emotion,
          emotion_id,
        } = row;

        //if the current snapshot doesnt exist in the groupedData object, initialise it
        if (!groupedData[snapshot_id]) {
          groupedData[snapshot_id] = {
            snapshot_id,
            user_id,
            note,
            date: formatDatabaseDate(date),
            time,
            emotions: {},
            triggers: null,
          };
        }

        //add each emotion to the snapshot along with correspoding data relating to that emotion
        groupedData[snapshot_id].emotions[emotion_id] = {
          emotion: emotion,
          emotion_id: emotion_id,
          snapshot_emotion_id: snapshot_emotion_id,
          rating: rating,
          ratings: {},
        };
      });

      //get rating data for each emotion and insert it into the groupedData object, under each emotion as an array of ratings (Used later for DOM manipulation)
      for (const emotion of Object.values(groupedData[id].emotions)) {
        const vals = [emotion.emotion_id];
        const query = `SELECT rating, emotion.emotion_id, short_desc, long_desc FROM emotion INNER JOIN emotion_rating ON emotion.emotion_id = emotion_rating.emotion_id INNER JOIN rating ON emotion_rating.rating_id = rating.rating_id WHERE emotion.emotion_id = ?`;
        const [rows, fielddata] = await db.query(query, vals);
        rows.forEach((row) => {
          emotion.ratings[row.rating] = {
            rating: row.rating,
            short_desc: row.short_desc,
            long_desc: row.long_desc,
          };
        });
      }

      //get the triggers for the snapshot and add to the data structure
      const triggerQuery = `SELECT trigger_name, icon, triggers.trigger_id, snapshot_trigger_id, CASE WHEN snapshot_trigger.snapshot_trigger_id IS NOT NULL THEN true ELSE false END AS selected FROM triggers LEFT JOIN snapshot_trigger ON triggers.trigger_id = snapshot_trigger.trigger_id AND snapshot_trigger.snapshot_id = ?`;
      const [trigrows, field] = await db.query(triggerQuery, [id]);
      //console.log(trigrows);
      groupedData[id].triggers = trigrows;

      //send data and 200 status code
      res.status(200);
      res.json({
        status: "success",
        message: `Snapshot ${id} retrieved`,
        result: groupedData[id],
      });
    } else {
      //no snapshot exists or does not belong to user, send 404 status code and message
      res.status(404);
      res.json({
        status: "failure",
        message: `Invalid snapshot id ${id} or does not belong to user`,
      });
    }
  } catch (err) {
    //server error, send 500 status code and error message
    res.status(500);
    res.json({
      status: "failure",
      message: `Error making API request: ${err}`,
    });
  }
};

exports.deleteSnapshot = async (req, res) => {
  //get snapshot id
  const { id } = req.params;
  //get userid
  const userid = req.headers.userid;

  //check the snapshot exists AND that it belongs to the current user logged in - query the database
  const snapshotQuery = `SELECT * FROM snapshot WHERE snapshot_id = ? AND user_id = ?`;
  try {
    //run the query
    const [snapshotRows, fieldData] = await db.query(snapshotQuery, [
      id,
      userid,
    ]);

    //check that a snapshot has been returned and belongs to the user
    if (snapshotRows.length > 0) {
      //snapshot exists and belongs to the user, perform deletion
      const deleteTriggersQuery = `DELETE FROM snapshot_trigger WHERE snapshot_id = ?`;
      const deleteEmotionsLogged = `DELETE FROM snapshot_emotion WHERE snapshot_id = ?`;
      const deleteSnapshotQuery = `DELETE FROM snapshot WHERE snapshot_id = ?`;

      const [delTrig, fielddata] = await db.query(deleteTriggersQuery, [id]);
      const [delEmo, fielddata2] = await db.query(deleteEmotionsLogged, [id]);
      const [delSap, fielddata3] = await db.query(deleteSnapshotQuery, [id]);

      //send 200 status code and success message
      res.status(200);
      res.json({
        status: "success",
        message: `Record id ${id} deleted`,
      });
    } else {
      //no snapshot found or does not belong to user, send 404 code and message
      res.status(404);
      res.json({
        status: "failure",
        message: `Invalid id ${id} or does not belong to user`,
      });
    }
  } catch (err) {
    //server error, send 500 status code and error message
    res.status(500);
    res.json({
      status: "failure",
      message: `Error making API request ${err}`,
    });
  }
};

exports.getUserSnapshots = async (req, res) => {
  //get the user id from params
  const { id } = req.params;
  //set up the query
  const selectSnapshots = `SELECT snapshot.snapshot_id, date, time, note, emotion, emotion.emotion_id, rating FROM snapshot 
  INNER JOIN snapshot_emotion ON snapshot.snapshot_id = snapshot_emotion.snapshot_id 
  INNER JOIN emotion ON snapshot_emotion.emotion_id = emotion.emotion_id 
  WHERE user_id = ?`;
  try {
    //run the query
    const [data, fielddata] = await db.query(selectSnapshots, [id]);

    //set up empty data structure to hold the information
    const groupedData = {};
    //loop through each row returned and process
    data.forEach((row) => {
      //destructure data into variables
      const { snapshot_id, date, time, emotion, emotion_id, rating, note } =
        row;

      //check if the snapshot object already exists in the array, if not create the object
      if (!groupedData[snapshot_id]) {
        groupedData[snapshot_id] = {
          snapshot_id,
          date: formatDatabaseDate(date),
          time,
          note: note,
          emotions: [],
        };
      }
      //add the emotion into the emotions array (within the snapshot object), along with the id and rating
      groupedData[snapshot_id].emotions.push({
        emotion_id: emotion_id,
        emotion: emotion,
        rating: rating,
      });
    });

    //transform to an array so we can sort the values
    var groupedDataArray = Object.values(groupedData);

    //sort the snapshots based on the id, in descending order - so that the most recent is displayed first.
    const groupedDataSorted = groupedDataArray.sort((a, b) => {
      return b.snapshot_id - a.snapshot_id;
    });
    //send the data with a 200 success status
    res.status(200);
    res.json({
      status: "success",
      message: `${groupedDataSorted.length} snapshots returned`,
      result: groupedDataSorted,
    });
  } catch (err) {
    //server error - send 500 status code and error message
    res.status(500);
    res.json({
      status: "failure",
      message: `Error making API request ${err}`,
    });
  }
};

exports.processNewSnapshot = async (req, res) => {
  //Extract data from the URL query params
  const formData = req.body;
  const { notes } = req.body;

  //obtain userid from the request headers
  const userid = req.headers.userid;

  //initialise empty array, we will later loop through each emotion submitted on the form and add to the array
  const emotionsToInsert = [];

  try {
    //insert snapshot record first into the snapshot table
    const snapshotInsert = `INSERT INTO snapshot (user_id, date, time, note) VALUES (?, ?, ?, ?)`;
    const date = getCurrentDate();
    const time = getCurrentTime();
    const snapshotVals = [userid, date, time, notes];
    const triggersToInsert = Array.isArray(req.body.trigger)
      ? req.body.trigger
      : req.body.trigger
      ? [req.body.trigger]
      : [];
    //Ensures triggers are stored in an array so we can later iterate through - as if only one trigger is submitted it does not create an array, it is stored as a string. We have avoided this behaviour.
    //We have also done a check to ensure we dont create an array with one object of undefined - if no triggers are selected

    const [snapInsert, fieldData] = await db.query(
      snapshotInsert,
      snapshotVals
    );
    //store the id of the snapshot - needs to be inserted on each many to many record we insert on the many to many table
    const snapshotId = snapInsert.insertId;
    //loop through emotions and values in the req body and insert into array
    for (const id in formData) {
      if (
        //only iterate through emotions - ignore triggers and notes
        Object.hasOwnProperty.call(formData, id) &&
        id != "notes" &&
        id != "trigger"
      ) {
        const value = formData[id];
        // push the data into the array as an object with the snapshot id, emotion id and the value submitted
        emotionsToInsert.push({ snapshotId, id, value });
      }
    }

    //now insert each emotion record in the many to many table snapshot_emotion
    if (emotionsToInsert.length > 0) {
      //check first if we have any records to insert
      const emotionQuery =
        "INSERT INTO snapshot_emotion (snapshot_id, emotion_id, rating) VALUES ?";
      const [rows, fielddata] = await db.query(emotionQuery, [
        emotionsToInsert.map((record) => [
          record.snapshotId,
          record.id,
          record.value,
        ]),
      ]);
    }

    //now insert each trigger in the many to many table snapshot_trigger
    if (triggersToInsert.length > 0) {
      console.log(triggersToInsert.length);
      console.log(triggersToInsert);
      const triggerQuery = `INSERT INTO snapshot_trigger (snapshot_id, trigger_id) VALUES (?, ?)`;
      triggersToInsert.forEach(async (trig) => {
        const vals = [snapshotId, trig];
        const [data, fielddata] = await db.query(triggerQuery, vals);
      });
    }

    //all successful - return json response and status
    res.status(201);
    res.json({
      status: "success",
      message: `Snapshot id ${snapshotId} created`,
      id: `${snapshotId}`,
    });
  } catch (err) {
    //server error
    res.status(500);
    res.json({
      status: "failure",
      message: `Error making API request: ${err}`,
    });
  }
};

exports.patchEditSnapshot = async (req, res) => {
  //Extract data from the body and params
  const { id } = req.params;
  const formData = req.body;
  const { notes } = req.body;
  const userid = req.headers.userid;

  try {
    //check snapshot exists
    const snapshotQuery = `SELECT * FROM snapshot WHERE snapshot_id = ? AND user_id = ?`;
    const [snapData, fieldData] = await db.query(snapshotQuery, [id, userid]);

    if (snapData.length > 0) {
      //record exists and belongs to current user
      //insert snapshot record first
      const snapshotUpdate = `UPDATE snapshot SET note = ? WHERE snapshot_id = ? AND user_id = ?`;
      const date = getCurrentDate();
      const time = getCurrentTime();
      const snapshotVals = [notes, id, userid];
      const triggersToInsert = Array.isArray(req.body.trigger)
        ? req.body.trigger
        : req.body.trigger
        ? [req.body.trigger]
        : [];
      //Ensures triggers are stored in an array so we can later iterate through - as if only one trigger is submitted it does not create an array, it is stored as a string. We have avoided this behaviour.
      //We have also done a check to ensure we dont create an array with one object of undefined - if no triggers are selected
      const [snapUpdate, fieldData2] = await db.query(
        snapshotUpdate,
        snapshotVals
      );

      //delete all existing triggers, we will reinsert the triggers submitted to ensure we dont retain any that may have been deselected
      const clearTriggers = `DELETE FROM snapshot_trigger WHERE snapshot_id = ?`;
      const [delTrig, fieldData3] = await db.query(clearTriggers, [id]);

      //now insert each trigger in the many to many table snapshot_trigger that was submitted in the form
      if (triggersToInsert.length > 0) {
        console.log(triggersToInsert.length);
        console.log(triggersToInsert);
        const triggerQuery = `INSERT INTO snapshot_trigger (snapshot_id, trigger_id) VALUES (?, ?)`;
        triggersToInsert.forEach(async (trig) => {
          const vals = [id, trig];
          const [data, fielddata] = await db.query(triggerQuery, vals);
        });
      }

      res.status(201);
      res.json({
        status: "success",
        message: `Record ${id} updated`,
      });
      //no shapshots in the database matching the id or belonging to the current logged in user
    } else {
      res.status(404);
      res.json({
        status: "failure",
        message: `Snapshot ${id} does not exist or does not belong to logged in user`,
      });
    }
  } catch (err) {
    res.status(500);
    res.json({
      status: "failure",
      message: `Error making API request: ${err}`,
    });
  }
};

exports.getSnapshotsPerMonth = async (req, res) => {
  const { id } = req.params;

  try {
    //run query to retrieve all snapshot dates for the user
    const query = `SELECT date FROM snapshot WHERE user_id = ? ORDER BY date ASC`;
    const [data, fielddata] = await db.query(query, [id]);

    //set up empty object to hold data
    const snapshotsPerMonth = {};
    //create an array of dates
    const dateArray = data.map((row) => row.date);

    //date to start from (set to the first month of the current year)
    const startDate = new Date(getCurrentDate()).setMonth(0);
    //date to end at (set to the last month of the current year)
    const endDate = new Date(getCurrentDate()).setMonth(11);
    //store currentDate which will be updated in the while loop
    const currentDate = new Date(startDate);

    //populate snapshotsPerMonth and set up months each with an initial value of zero
    while (currentDate <= endDate) {
      //format the monthYear - 2024-01
      const monthYear = `${currentDate.getFullYear()}-${(
        currentDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}`;
      //set initial value to 0
      snapshotsPerMonth[monthYear] = 0;
      //update the currentDate to the next month and keep looping until we meet endDate
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    //loop through each date, update the snapshotsPerMonth object, increment the month by 1
    dateArray.forEach((date) => {
      //format the date to the correct format i.e. 2024-1
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      //increment the snapshotsPerMonth for that month by 1
      snapshotsPerMonth[monthYear]++;
    });

    res.status(200);
    res.json({
      status: "success",
      message: `${data.length} snapshots returned`,
      result: snapshotsPerMonth,
    });
  } catch (err) {
    res.status(500);
    res.json({
      status: "failure",
      message: `Error making API request: ${err}`,
    });
  }
};

exports.getSnapshotsByDay = async (req, res) => {
  //get the user id from the params
  const { id } = req.params;

  try {
    //run query to retrieve snapshot dates
    const query = `SELECT date FROM snapshot WHERE user_id = ?`;
    const [data, fielddata] = await db.query(query, [id]);

    //set up an array to store the day names (we will use later to convert int from getDay function to the days name)
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    //initialise each day with a zero count
    const snapshotsPerDay = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };

    //loop through each date record
    data.forEach((row) => {
      //convert the text to a date object
      const date = new Date(row.date);
      //get the day (int value, 0 = sunday, 1 = monday...)
      const day = date.getDay();
      //get the day name by using the array set up earlier
      const dayName = weekdays[day];
      //increment the value of that day name by 1
      snapshotsPerDay[dayName]++;
    });

    //send json data
    res.status(200);
    res.json({
      status: "success",
      message: `${data.length} records summarised into weekday counts for userid ${id}`,
      result: snapshotsPerDay,
    });
  } catch (err) {
    res.status(500);
    res.json({
      status: "failure",
      message: `Failure making API call: ${err}`,
    });
  }
};

exports.getEmotionRatings = async (req, res) => {
  //obtain emotion id
  const { id } = req.params;
  //obtain user id
  const { userid } = req.headers;
  const vals = [userid, id];

  const query = `SELECT emotion.emotion_id, emotion, rating, date, time FROM snapshot 
  INNER JOIN snapshot_emotion
  ON snapshot.snapshot_id = snapshot_emotion.snapshot_id 
  INNER JOIN emotion
  ON snapshot_emotion.emotion_id = emotion.emotion_id WHERE user_id = ? AND emotion.emotion_id = ?`;

  try {
    const [data, fielddata] = await db.query(query, vals);

    if (data.length > 0) {
      res.status(200);
      res.json({
        status: "success",
        message: `${data.length} records retrieved`,
        result: data,
      });
    } else {
      res.status(404);
      res.json({
        status: "failure",
        message: `No records found`,
        result: [],
      });
    }
  } catch (err) {
    res.status(500);
    res.json({
      status: "failure",
      message: `Error making API call: ${err}`,
    });
  }
};
