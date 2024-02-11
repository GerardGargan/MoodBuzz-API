const db = require('../util/dbconn');

exports.getTriggers = async (req, res) => {
    const selectTriggers = `SELECT trigger_id, trigger_name, icon FROM triggers`;

    try {
        const [triggerData, fieldData] = await db.query(selectTriggers);
        res.json({
            status: 'success',
            message: `retrieved ${triggerData.length} trigger records`,
            result: triggerData
        });

    } catch (err) {
        res.status(500);
        res.json({
            status: 'failure',
            message: `Error making API request: ${err}`
        });
    }
    //run the query to get the triggers
}