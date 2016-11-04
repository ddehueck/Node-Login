var mongoose = require('mongoose');
var User = require('../lib/model.js');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
	if (req.session.loggedIn) {
		//Get user info
		User.findOne({ '_id': req.session._uid }, function (err, user) {
		  	if (err) return handleError(err);
		  	console.log(user)

			res.render('user/user', { 
		 		title: 'User Page',
		 		username: user.username,
		 		email: user.email 
 			});
		});

	} else {
		res.redirect('/login');
	}
});

module.exports = router;
