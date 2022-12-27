const config = require("../config/config");
const jwt = require("jsonwebtoken");
var express = require('express');

var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());

exports.loggedIn = function (req, res, next) {
    //let token = req.header('authToken');
    try {

        let token = get_cookies(req)['token'];

        // token = get_cookies(req)['token'];
        if (!token) return res.redirect('/login');

        if (token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length).trimLeft();
        }
        const verified = jwt.verify(token, config.TOKEN_SECRET);
      /*  if( verified.user_type_id === 2 ){ // Check authorization, 2 = Customer, 1 = Admin
            let req_url = req.baseUrl+req.route.path;
            if(req_url.includes("users/:id") && parseInt(req.params.id) !== verified.id){
                return res.status(401).send("Unauthorized!");
            }
        }*/
        req.user = verified;
        next();
    }
    catch (err) {
        res.redirect('/login');
    }
}

exports.adminOnly = async function (req, res, next) {
    if( req.user.user_type_id === 2 ){
        return res.status(401).send("Unauthorized!");
    }
    next();
}


var get_cookies = function(request) {
    var cookies = {};
    request.headers && request.headers.cookie.split(';').forEach(function(cookie) {
        var parts = cookie.match(/(.*?)=(.*)$/)
        cookies[ parts[1].trim() ] = (parts[2] || '').trim();
    });
    return cookies;
};
