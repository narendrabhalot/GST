const jwt = require("jsonwebtoken");
const { isValidObjectId } = require("../util/validate");
const userModel = require("../models/userModel");

//=========================================== authentication ===========================================================================================

const authentication = async function (req, res, next) {
    try {
        let token = req.headers["x-api-key"];
        if (!token) token = req.headers["x-Api-Key"];
        if (!token) return res.status(400).send({ status: false, msg: "token must be present in header" });
        console.log(token);
        let decodedToken = jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if (err) {
                return res.status(400).send({ msg: "Error", error: "invalid token" })
            }
        });
        req.userId = decodedToken.userId
        console.log(req.authorid)
        next()
    }
    catch (err) {
        console.log("This is the error :", err.message)
        return res.status(500).send({ msg: "Error", error: err.message })
    }

};



//=========================================== authorisation ============================================================================================

const authorisation = async function (req, res, next) {
    try {
        let userId = req.params.userId;

        // if userId is not a valid ObjectId
        if (!isValidObjectId(userId)) {
            res
                .status(400)
                .send({ status: false, message: `${userId} is not a valid userId` });
            return;
        }

        // if user does not exist
        let isUserExist = await userModel.findById(userId);
        if (!isUserExist) {
            return res
                .status(404)
                .send({ status: false, msg: "user does not exist" });
        }

        //📌 AUTHORISATION:
        if (req.userId !== userId) {
            return res.status(403).send({
                status: false,
                message: `Authorisation failed; You are logged in as ${req.userId}, not as ${userId}`,
            });
        }

        next();
    } catch (err) {
        res.status(500).send({
            status: false,
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

//======================================================================================================================================================

module.exports = { authentication, authorisation };