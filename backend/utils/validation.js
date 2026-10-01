const mongoose = require("mongoose");


function isValidObjectId(id) {

    return mongoose.Types.ObjectId.isValid(id);

}


function isNonEmptyString(value) {

    return (
        typeof value === "string" &&
        value.trim().length > 0
    );

}


function isPositiveInteger(value) {

    return (
        Number.isInteger(Number(value)) &&
        Number(value) > 0
    );

}


module.exports = {
    isValidObjectId,
    isNonEmptyString,
    isPositiveInteger
};