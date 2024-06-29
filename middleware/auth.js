const jwt = require("jsonwebtoken");
const { isValidObjectId } = require("../util/validate");
const userModel = require("../models/userModel");
const getAllowedRoles = require('./roleRoute')

//=========================================== authentication ===========================================================================================

const authentication = async function (req, res, next) {
    try {
        let token = req.headers["authentication"] || req.headers["Authentication"];
        if (!token) return res.status(401).send({ status: false, msg: "token must be present in header" });
        let decodedToken = jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if (err) {
                return res.status(401).send({ msg: "Error", error: "invalid token" })
            } else {
                console.log(req.path)
                const allowedRoles = getAllowedRoles(req.path);
                console.log(allowedRoles)
                if (!allowedRoles.includes(decodedToken.user.role)) {
                    return res.status(403).send({ message: "Unauthorized role for this endpoint" });
                }
                req.user = decodedToken.user
                next();
            }
        });
    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).send({ msg: "Error", error: err.message });
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