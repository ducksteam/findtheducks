import express from "express";
const router = express.Router();

router.get('/profile', (req, res) => {
    res.render('users/profile')
})

router.get('/register', (req, res) => {
    res.render('users/register')
})

router.get('/login', (req, res) => {
    res.render('users/login')
})

router.use(express.static("public"));

export default router;