const db = require("../util/dbconn");

exports.getSnapshot = async (req, res) => {
  const { id } = req.params;
  const userid = req.headers.userid; //user id sent through headers

  const queryEmotions = `SELECT snapshot.snapshot_id, snapshot.user_id, note, date, time, snapshot_emotion_id, emotion, emotion.emotion_id, snapshot_emotion.rating FROM snapshot INNER JOIN snapshot_emotion ON snapshot.snapshot_id = snapshot_emotion.snapshot_id INNER JOIN emotion ON snapshot_emotion.emotion_id = emotion.emotion_id
        WHERE snapshot.snapshot_id = ? AND user_id = ?`;

  const vals = [id, userid];

  try {
    const [rows, fielddata] = await db.query(queryEmotions, vals);

    if (rows.length > 0) {
      //snapshot exists, parse the data structure needed
      const groupedData = {};

      rows.forEach((row) => {
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
        if (!groupedData[snapshot_id]) {
          groupedData[snapshot_id] = {
            snapshot_id,
            user_id,
            note,
            date: formatDatabaseDate(date),
            time,
            emotions: {},
            triggers: null
          };
        }
        groupedData[snapshot_id].emotions[emotion_id] = {
          emotion: emotion,
          emotion_id: emotion_id,
          snapshot_emotion_id: snapshot_emotion_id,
          rating: rating,
          ratings: {},
        };
      });

      //get rating data for each emotion and insert it into the groupedData object, under each emotion as an array of ratings
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
      
      res.status(200);
      res.json({
        status: 'success',
        message: `Snapshot ${id} retrieved`,
        result: groupedData[id]
      });

    } else {
      res.status(404);
      res.json({
        status: "failure",
        message: `Invalid snapshot id ${id}`,
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

exports.deleteSnapshot = async (req, res) => {
  const { id } = req.params;
  const userid = req.headers.userid;

  //check the snapshot exists AND that it belongs to the current user logged in - query the database
  const snapshotQuery = `SELECT * FROM snapshot WHERE snapshot_id = ? AND user_id = ?`;
  try {
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
      
        res.status(200);
      res.json({
        status: 'success',
        message: `Record id ${id} deleted`
      });
    }
    else {
      res.status(404);
      res.json({
        status: 'failure',
        message: `Invalid id ${id} or does not belong to user`
      });
    }
  }
  catch(err) {
    res.status(500);
    res.json({
      status: 'failure',
      message: `Error making API request ${err}`
    });
  } 
}

exports.getUserSnapshots = async (req, res) => {
  const { id } = req.params;

  const selectSnapshots = `SELECT snapshot.snapshot_id, date, time, emotion, emotion.emotion_id, rating FROM snapshot INNER JOIN snapshot_emotion ON snapshot.snapshot_id = snapshot_emotion.snapshot_id INNER JOIN emotion ON snapshot_emotion.emotion_id = emotion.emotion_id WHERE user_id = ?`;
  try {
    const [data, fielddata] = await db.query(selectSnapshots, [id]);

    const groupedData = {};

    data.forEach((row) => {
      //destructure into variables
      const { snapshot_id, date, time, emotion, emotion_id, rating } = row;

      //check if the snapshot object already exists in the array, if not create the object
      if (!groupedData[snapshot_id]) {
        groupedData[snapshot_id] = {
          snapshot_id,
          date: formatDatabaseDate(date),
          time,
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

    res.status(200);
    res.json({
      status: 'success',
      message: `${groupedDataSorted.length} snapshots returned`,
      result: groupedDataSorted
    });

  } 
  catch (err) {
    res.status(500);
    res.json ({
      status: 'failure',
      message: `Error making API request ${err}`
    });
  }
}

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
      status: 'success',
      message: `Snapshot id ${snapshotId} created`,
      id: `${snapshotId}`
    });
  } catch (err) {
    //server error
    res.status(500);
    res.json({
      status: 'failure',
      message: `Error making API request: ${err}`
    });
  }
}


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
