var mongoose = require('mongoose');

//User mongodb Schema
var userSchema = mongoose.Schema({
	username: String,
    email: String,
    salt: String, 
    passwordHash: String
});

var User = mongoose.model('User', userSchema);

module.exports = User;