import express from "express";
const router = express.Router();
import { register } from "../functions.js";

router.get('/profile', (req, res) => {
    res.render('users/profile', { pageTitle: "profile" })
})

router.get('/register', (req, res) => {
    res.render('users/register', { errorMsg: "", pageTitle: "sign up" })
})

router.get('/login', (req, res) => {
    res.render('users/login', { pageTitle: "sign in" })
})

router.post('/signup', (req, res) => {
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    let error = register(email, username, password, confirmPassword);
    res.redirect('/register', { errorMsg: error });
})

router.use(express.static("public"));

export default router;