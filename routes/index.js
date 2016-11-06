var mongoose = require('mongoose');
var mongodb = require('mongodb');
var User = require('../lib/model.js');
var crypto = require('crypto');
var url = require('url');
var http = require('http');

var express = require('express');
var router = express.Router();

var HOUR = 3600000;

router.get('/', function(req, res, next) {
	console.log(url.parse(req.url, true).query);
	res.render('index', { title: 'Your App' });
});

router.get('/register', function(req, res, next) {
	var query = url.parse(req.url, true).query;
	
	if (query.error) {
		res.render('register', { 
			title: 'Register',
			error: true 
		});
	} else {
		res.render('register', { 
			title: 'Register',
			error: false 
		});
	}
});

router.post('/register', function(req, res, next) {
	var reqBody = req.body;
	var username = reqBody.username.toLowerCase(); //Removes case sensitivity
	var email = reqBody.email;
	var password = reqBody.password;
	var rememberMe = reqBody.remember;

	//Make sure email or username isn't used already
	User.find({ $or: [ { 'username': username }, { 'email': email } ] }, function(err, userArray) {
	  	if (err) return handleError(err);
	  	//Email and username not in use - Proceed
	  	if (userArray.length == 0) {
	  		//Generate salt
	  		var salt = crypto.randomBytes(64).toString('base64');

	  		crypto.pbkdf2(password, salt, 10000, 64, 'sha512', function(err, key){
			  	if (err) throw err;
			  	console.log(key.toString('hex'));

			  	//Register the new user
		  		var newUser = new User({
		  			username: username,
		  			email: email,
		  			passwordHash: key.toString('hex'),
		  			salt: salt
		  		});

		  		newUser.save(function (err, user) {
				  	if (err) return console.error(err);
					//Once user is saved, login
					var userId = mongodb.ObjectId(user._id).toString()

					//Info available in sessions
					req.session._uid = userId;
					req.session.loggedIn = true;
					req.session.name = username;

					//Handle cookie expiration
					if (rememberMe == 'on') {
						req.session.cookie.maxAge = 3 * 24 * HOUR; //Set cookie for 3 days
					} else {
						req.session.cookie.maxAge == false; //Set cookie until session expires
					}

					//Redirect to user page
					res.redirect('/user');
				});
			});

	  	} else {
	  		//Email is in use - Notify user
	  		console.log('Email is in use');
	  		res.redirect('/register?error=true')
	  	}
	});

});

router.get('/login', function(req, res, next) {
	var query = url.parse(req.url, true).query;
	
	if (query.error) {
		res.render('login', { 
			title: 'Login',
			error: true 
		});
	} else {
		res.render('login', { 
			title: 'Login',
			error: false 
		});
	}
	
});

router.post('/login', function(req, res, next) {
	var reqBody = req.body;
		var name = reqBody.name.toLowerCase(); //Removes case sensitivity
		var password = reqBody.password;
		var rememberMe = reqBody.remember;

	//username or email needed to login
	User.find({ $or: [ { 'username': name }, { 'email': name } ] }, function(err, userArray) {
	  	if (err) return handleError(err);
	  	//Make sure there is a user found
	  	if (userArray.length != 0) {
	  		//Get user info for only user in userArray
	  		var user = userArray[0];
			//Hash password
		  	crypto.pbkdf2(password, user.salt, 10000, 64, 'sha512', function(err, key){
				if (err) throw err;
				
				//Validate the passwords
				if (user.passwordHash == key.toString('hex')) {
				  	//Log them in
					var userId = mongodb.ObjectId(user._id).toString()

					req.session._uid = userId;
					req.session.loggedIn = true;
					req.session.name = user.username;

					if (rememberMe == 'on') {
						req.session.cookie.maxAge = 3 * 24 * HOUR //Set cookie for 3 days
					} else {
						req.session.cookie.maxAge == false; //Set cookie until session expires
					}

					//Redirect to user page
					res.redirect('/user');

				} else {
				  	//Password was not valid
				  	console.log('Wrong password');
				  	res.redirect('/login?error=true');
				}

			});	 

	  	} else {
	  		//No user was found
			console.log('Wrong email');
		  	res.redirect('/login?error=true');
	  	}

	});

});

router.get('/logout', function(req, res, next) {
	if (req.session.loggedIn) {
		req.session.destroy(function(err) {
	  		if (err) throw err;
		});
	} 

	res.redirect('/');
});


module.exports = router;
