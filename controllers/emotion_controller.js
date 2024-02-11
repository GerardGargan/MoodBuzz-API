const db = require('../util/dbconn');

exports.getEmotions = async (req, res) => {
    const selectEmotions = `SELECT emotion FROM emotion`;
    try {
        const [emotions, fieldData] = await db.query(selectEmotions);

        res.json({
            status: 'success',
            message: `${emotions.length} records retrieved`,
            result: emotions
        });
    } catch (err) {
        res.status(500);
        res.json({
            status: 'failure',
            message: `Error making API request: ${err}`
        });
    }
}