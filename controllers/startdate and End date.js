 const startDate = moment.utc(new Date(Date.UTC(2023, 0, 1))).toISOString(); // January 1, 2023 in UTC ISO format
        const endDate = moment.utc(new Date(Date.UTC(2023, 1, 1))).toISOString(); // March 1, 2023 in UTC ISO format

        const currentDate = moment().toISOString(); // Get the current date in ISO format

        // Use the current date for your query or other operations
        console.log(currentDate); // Output: 2024-06-03T10:54:23.000Z
        console.log(typeof startDate, endDate)