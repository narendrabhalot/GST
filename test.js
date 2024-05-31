const moment = require('moment')
let momenttz = require('moment-timezone');
function getPreviousQuarters(inputDate) {
    let date = inputDate.toString()
    console.log("date is a ", date)
    const quarters = [
        { name: "Q1", startMonth: 3, endMonth: 5 },
        { name: "Q2", startMonth: 6, endMonth: 8 },
        { name: "Q3", startMonth: 9, endMonth: 11 },
        { name: "Q4", startMonth: 0, endMonth: 2 }
    ];

    const previousQuarters = [];
    for (let i = 0; i < quarters.length; i++) {
        const IST_TIMEZONE = 'Asia/Kolkata';
        const { name, startMonth, endMonth } = quarters[i];

        // Create startDate and endDate objects with timezone and formatting
        let startDate = moment.tz(IST_TIMEZONE)
            .month(startMonth)
            .startOf('month')
            .add(5, 'hours')
            .add(30, 'minutes')
            .toDate().toString()
        let endDate = moment.tz(IST_TIMEZONE)
            .month(endMonth)
            .endOf('month')
            .toDate().toString()
        // Log for debugging (optional)

        // console.log("name, startMonth, endMonth:", name, startDate, endDate);
        // console.log("name, startMonth, endMonth:", typeof startDate, typeof date, typeof endDate)
        console.log(date)
        startDate = moment(startDate, "ddd MMM DD YYYY HH:mm:ss Z");
        endDate = moment(endDate, "ddd MMM DD YYYY HH:mm:ss Z");
        date = moment.utc(date);
        console.log(date, startDate, endDate)

        if (moment(date).isAfter(endDate)) { // Modified for inclusivity
            console.log("nare")
            if (name == "Q4") {
                previousQuarters.push({
                    startDate: moment.tz(IST_TIMEZONE)
                        .month(startMonth)
                        .startOf('month')
                        .add(5, 'hours')
                        .add(30, 'minutes').toDate(),

                    endDate: moment.tz(IST_TIMEZONE)
                        .month(endMonth).year(moment(date).year())
                        .endOf('month').toDate(),
                });
            } else {
                previousQuarters.push({
                    startDate: moment.tz(IST_TIMEZONE)
                        .month(startMonth)
                        .startOf('month')
                        .add(5, 'hours')
                        .add(30, 'minutes').toDate(),

                    endDate: moment.tz(IST_TIMEZONE)
                        .month(endMonth)
                        .endOf('month').toDate(),
                });
            }

        } else {
            previousQuarters.push({
                startDate: moment.tz(IST_TIMEZONE)
                    .month(startMonth)
                    .startOf('month')
                    .add(5, 'hours')
                    .add(30, 'minutes').toDate(),

                endDate: moment.tz(IST_TIMEZONE)
                    .month(endMonth).year(moment(date).year())
                    .endOf('month').toDate(),

            });
            break
        }
    }
    return previousQuarters;
}

// Example usage (assuming valid input)
console.log(getPreviousQuarters("2025-03-27T11:29:59.999Z"));
