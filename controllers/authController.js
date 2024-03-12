
const UserModel = require('../models/userModel');
const sendSMS = require('../util/otp');
const { logInValidation, otpValidation } = require('../util/validate')
// const otplib = require('otplib');

const otpGenerator = require('otp-generator')

function generateOTP() {
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
    return otp
}
const sendOTP = async (req, res) => {

    const { mobileNumber } = req.body;
    try {
        const value = await logInValidation(req.body)
        if (value.error) {
            return res.status(400).send({
                status: false,
                msg: value.error.message
            })
        }
        let user = await UserModel.findOne({ mobileNumber: mobileNumber })
        // console.log(user)
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }
        const otp = generateOTP();
        console.log(otp)
        user.otp = { value: otp, Date: new Date() };
        await user.save();
        console.log(user)

        await sendSMS(mobileNumber, otp);

        res.status(201).send({ status: true, msg: "Otp sent successfully" })
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Error sending OTP' });
    }
};
const verifyOTP = async (req, res) => {
    const { otp } = req.body;
    try {
        const value = await otpValidation(req.body);
        if (value.error) {
            return res.status(400).send({
                status: false,
                msg: value.error.message
            });
        }
        const user = await UserModel.findOne({ 'otp.value': otp });
        if (!user) {
            return res.status(401).json({ status: false, message: 'Invalid OTP' });
        }
        user.otp = undefined;
        await user.save();

        res.status(200).send({ status: true, message: 'OTP verification successful', data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Error verifying OTP' });
    }
};

module.exports = { sendOTP, verifyOTP }
