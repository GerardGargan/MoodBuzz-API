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
}

exports.getTriggerAnalytics = async (req, res) => {

    const { id } = req.params;
  
    const selectTriggers = `SELECT trigger_name, triggers.trigger_id FROM triggers 
    INNER JOIN snapshot_trigger
    ON triggers.trigger_id = snapshot_trigger.trigger_id
    INNER JOIN snapshot
    ON snapshot_trigger.snapshot_id = snapshot.snapshot_id WHERE user_id = ?`;

    try {
        const [data, fielddata] = await db.query(selectTriggers, [id]);

        //set up object to hold triggers and counts data
        const triggerCounts = {};

        //loop through each record returned
        data.forEach(trigger => {
            //if it doesnt exist in the triggerCounts object, initialise it with a value of zero

            if(!triggerCounts[`${trigger.trigger_name}`]) {
                triggerCounts[`${trigger.trigger_name}`] = 0;
            }
            //increment the count by one
            triggerCounts[`${trigger.trigger_name}`]++;
        });


        res.json({
            status: 'success',
            message: `${data.length} records returned`,
            result: triggerCounts
        });
    } catch (err) {
        res.status(500);
        res.json({
            status: 'Failure',
            message: `Error making API request: ${err}`
        });
    }
}