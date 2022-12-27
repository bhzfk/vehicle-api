const User = require("../models/user.model.js");
const config = require("../config/config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {NotFoundError} = require("../helpers/utility");

const express  = require('express');
const path     = require('path');
const bodyParser = require('body-parser');
const app = express();
const expressValidator = require('express-validator');


exports.home = (req, res) => {
    res.redirect('/user');
};

app.set('views','./views');
app.set('view engine','ejs');


exports.logout = async (req, res) => {
    console.log('logu');
    res.cookie('token', {expires: Date.now()}).redirect('/login');
};


// Register a new User
exports.register = async (req, res) => {

    console.log('hi');

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create an user object
    const user = new User({
        mobile: req.body.mobile,
        email: req.body.email,
        name: req.body.name,
        password: hashedPassword,
        status: req.body.status || 1
    });

    console.log(user);

    // Save User in the database
    try {
        const id = await User.create(user);
        user.id = id;
        delete user.password;
        res.send(user);
    }
    catch (err){
        res.status(500).send(err);
    }
};

// Login
exports.login = async (req, res) => {
    try {
        // Check user exist
       // console.log(req.body.username);

        const user = await User.login(req.body.username);
        validPass = false;

        if (user) {

            if(req.body.password === user.password)
                 validPass = true;

            //await bcrypt.compare()
            console.log(user.password);
            console.log(req.body.password);


            if (!validPass) return res.status(400).send("نام کاربری یا رمز عبور اشتباه است !");

            // Create and assign token
            const token = jwt.sign({id: user.id, username: req.body.username}, config.TOKEN_SECRET);
            console.log(token);
            res.cookie('token', token, { maxAge: 90000000, httpOnly: true }).send({"token": token});
        }
    }
    catch (err) {
        if( err instanceof NotFoundError ) {
            res.status(401).send(`نام کاربری یا رمز عبور اشتباه است ! 2`);
        }
        else {
            let error_data = {
                entity: 'User',
                model_obj: {param: req.params, body: req.body},
                error_obj: err,
                error_msg: err.message
            };
            res.status(500).send("Error retrieving User");
        }
    }
};

exports.getlogin = async (req, res) => {
    res.render('login',{title:"ورود به پنل"});
}


// Access auth users only
exports.authuseronly = (req, res) => {
    res.send("Hey,You are authenticated user. So you are authorized to access here.");
};

// Admin users only
exports.adminonly = (req, res) => {
    res.send("Success. Hellow Admin, this route is only for you");
};



