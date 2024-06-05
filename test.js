const moment = require('moment');
function getFinancialYearDates(currentDate) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0 (January) to 11 (December)

    // Check if current month is before April (financial year starts previous year)
    const financialYearStart = new Date(currentMonth < 3 ? currentYear - 1 : currentYear, 3, 1); // April 1st
    const financialYearEnd = new Date(currentYear, currentMonth, currentDate.getDate()); // Current date

    return { financialYearStart, financialYearEnd };
}
const customYear = 2024;
const customMonth = 12;
const customDay = 10;
const currentDate = new Date(customYear, customMonth, customDay)
console.log(currentDate)
const { financialYearStart, financialYearEnd } = getFinancialYearDates(currentDate);
let startLoopdate = new Date(financialYearStart)
console.log("startLoopdate is ", startLoopdate)
for (
    let loopDate = moment(startLoopdate);
    loopDate.isBefore(financialYearEnd);
    loopDate.add(3, 'months')
) {
    const loopYear = loopDate.year();
    const quarter = Math.floor(loopDate.month() / 3);
    console.log(loopDate)
    console.log(`Processing year ${loopYear}, quarter ${quarter}`);





}