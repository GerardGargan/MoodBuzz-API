const db = require("../util/dbconn");

exports.getEmotions = async (req, res) => {
  //set up query
  const selectEmotions = `SELECT emotion.emotion_id, emotion, rating, short_desc, long_desc FROM emotion INNER JOIN emotion_rating ON emotion.emotion_id = emotion_rating.emotion_id INNER JOIN rating ON emotion_rating.rating_id = rating.rating_id`;
  try {
    //run the query
    const [emotions, fieldData] = await db.query(selectEmotions);

    //parse data into an appropriate structure to pass to the template
    const groupedData = {};
    emotions.forEach((row) => {
      //if it doesnt already exist, create the emotion object
      const { emotion_id, emotion, rating, short_desc, long_desc } = row;
      //if the emotion doesnt exist in the data structure, set it up with its properties and an empty array for ratings
      if (!groupedData[emotion_id]) {
        groupedData[emotion_id] = {
          emotion_id,
          emotion,
          rating: [],
        };
      }
      //push each rating data into the rating array in the emotion object
      groupedData[emotion_id].rating.push({
        rating: rating,
        shortdesc: short_desc,
        longdesc: long_desc,
      });
    });

    //send data
    res.status(200);
    res.json({
      status: "success",
      message: `Emotion records retrieved`,
      result: groupedData,
    });
  } catch (err) {
    //server error, send status code and info
    res.status(500);
    res.json({
      status: "failure",
      message: `Error making API request: ${err}`,
    });
  }
};
