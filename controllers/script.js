require('dotenv').config();
const dbConnectionString = process.env.DB_CONNECTION_STRING;
const sendOTP = require('../util/otp');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const sendOtpAndHandleResponse = async (mobileNumber) => {
    console.log("test otp");
    try {
        console.log("clientId, clientSecret", clientId, clientSecret);
        const response = await sendOTP(mobileNumber, 'nk580585@gmail.com', 'SMS', null, null, 60, 6, clientId, clientSecret)
        console.log('Response:', response);
        return response;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
const mobileNumber = '+918817730702';
sendOtpAndHandleResponse(mobileNumber)
    .then(result => {
        console.log(result);
    })
    .catch(error => {
        console.error(error);
    });
