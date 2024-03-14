const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true , unique: true,},
    priority: { type: Number, required: true }
});

module.exports = mongoose.model('User', userSchema);


