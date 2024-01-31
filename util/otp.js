const Twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID
console.log(accountSid)
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_MOBILE_NUMBER
const client = new Twilio(accountSid, authToken);

const sendOTP = async (recipientPhoneNumber,otp) => {
  

    try {
        await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: twilioPhoneNumber,
            to: recipientPhoneNumber
        });

        console.log('OTP sent successfully');
        return otp;
    } catch (error) {
        console.error('Error sending OTP:', error.message);
        throw new Error('Failed to send OTP');
    }
};



module.exports = sendOTP;
