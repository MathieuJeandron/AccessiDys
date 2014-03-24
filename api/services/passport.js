'use strict';

// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
// dropBox 
var DropboxOAuth2Strategy = require('passport-dropbox-oauth2').Strategy;

var config = require('./../../env/config.json');
var URL_REQUEST = process.env.URL_REQUEST || config.URL_REQUEST;

var DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID || config.DROPBOX_CLIENT_ID; // 'ko5rdy0yozdjizw';
var DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET || config.DROPBOX_CLIENT_SECRET //'iqct32159hizifd';

// load up the user model
var User = require('../../models/User');

// expose this function to our app using module.exports

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new DropboxOAuth2Strategy({
            clientID: DROPBOX_CLIENT_ID,
            clientSecret: DROPBOX_CLIENT_SECRET,
            callbackURL: URL_REQUEST + '/auth/dropbox/callback',
            passReqToCallback: true
        },
        function(req, accessToken, refreshToken, profile, done) {
            if (req) {
                var tmp = req.user;
                tmp.dropbox.uid = profile._json.uid;
                tmp.dropbox.display_name = profile._json.display_name;
                tmp.dropbox.emails = profile._json.email;
                tmp.dropbox.country = profile._json.country;
                tmp.dropbox.referral_link = profile._json.referral_link;
                tmp.dropbox.accessToken = accessToken;
                tmp.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, tmp);
                });
            }
        }
    ));


    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            nomField: 'nom',
            prenomField: 'prenom',

            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, nom, prenom, done) {

            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function() {

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({
                    'local.email': email
                }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        // console.log('That email is already taken');
                        //var newUser = new User();
                        var erreur = {
                            message: 'email deja pris',
                            email: true
                        };
                        return done(404, erreur);
                        // return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // if there is no user with that email
                        // create the user
                        // console.log('creation new user');
                        var newUser = new User();
                        // set the user's local credentials
                        newUser.local.email = email;
                        newUser.local.password = newUser.generateHash(password);
                        newUser.local.nom = nom;
                        newUser.local.prenom = prenom;
                        newUser.local.role = 'user';
                        // console.log(newUser.local);
                        // save the user
                        // console.log('going to save in bdd');
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }

                });

            });

        }));

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            nomField: 'nom',
            prenomField: 'prenom',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, nom, prenom, done) { // callback with email and password from our form

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({
                'local.email': email
            }, function(err, user) {
                // if there are any errors, return the error before anything else
                // if (err) {
                //     console.log('1');
                //     console.log(err);
                //     return done(err);
                // }
                // if no user is found, return the message
                if (!user) {
                    return done(404, null);
                }

                //return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

                // if the user is found but the password is wrong
                if (!user.validPassword(password)) {
                    return done(404, null);
                }

                //if the user is a site Administrator

                if (user.local.role === 'admin') {
                    return done(null, user);
                }

                // return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                // console.log('4');
                return done(null, user);
            });
        }));

};