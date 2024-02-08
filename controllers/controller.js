const db = require("./../util/dbconn");

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
      const triggerQuery = `SELECT trigger_name, icon, triggers.trigger_id, snapshot_trigger_id FROM snapshot_trigger INNER JOIN triggers ON snapshot_trigger.trigger_id = triggers.trigger_id WHERE snapshot_id = ?`;
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

function formatDatabaseDate(date) {
  const databaseDate = new Date(date);
  const year = databaseDate.getFullYear();
  const month = databaseDate.getMonth() + 1; //zero indexed
  const day = databaseDate.getDate();

  return `${day}/${month}/${year}`;
}
