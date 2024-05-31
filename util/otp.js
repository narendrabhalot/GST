require('dotenv').config();
const { UserDetail } = require('otpless-node-js-auth-sdk');
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
console.log(clientId, clientSecret)
async function sendSMS(mobileNumber, channel, hash = null, orderId = null, expiry = 120, otpLength = 6) {
    console.log(`Sending OTP to: ${mobileNumber} channel: ${channel}`);
    try {
        const response = await UserDetail.sendOTP(
            mobileNumber,
            null, // Set email to null as it's not needed for SMS
            channel,
            hash,
            orderId,
            expiry,
            otpLength,
            clientId,
            clientSecret
        );
        return response;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
}


async function verifySMS(phoneNumber, orderId, otp) {
    console.log(phoneNumber, orderId, otp, clientId, clientSecret)
    console.log(typeof phoneNumber, typeof orderId, typeof otp, typeof clientId, typeof clientSecret)
    try {
        const response = await UserDetail.verifyOTP(null, phoneNumber, orderId, otp, clientId, clientSecret)
        console.log("response:", response);
        return response;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
}
module.exports = { sendSMS, verifySMS }