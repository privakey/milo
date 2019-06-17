const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const RequestSchema = new Schema({
    accountId: String,
    requestGuid: String,
    requestType: String,
    socketId: String
});

module.exports = ActiveRequest = mongoose.model("activeRequests", RequestSchema);