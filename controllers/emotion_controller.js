const db = require('../util/dbconn');

exports.getEmotions = async (req, res) => {
    const selectEmotions = `SELECT emotion.emotion_id, emotion, rating, short_desc, long_desc FROM emotion INNER JOIN emotion_rating ON emotion.emotion_id = emotion_rating.emotion_id INNER JOIN rating ON emotion_rating.rating_id = rating.rating_id`;
    try {
        const [emotions, fieldData] = await db.query(selectEmotions);

        const groupedData = {};
    //parse data into an appropriate structure to pass to the template
    emotions.forEach((row) => {
      //if it doesnt already exist, create the emotion object
      const { emotion_id, emotion, rating, short_desc, long_desc } = row;
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

        res.json({
            status: 'success',
            message: `Emotion records retrieved`,
            result: groupedData
        });
    } catch (err) {
        res.status(500);
        res.json({
            status: 'failure',
            message: `Error making API request: ${err}`
        });
    }
}