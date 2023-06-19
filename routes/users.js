import express from "express";
const router = express.Router();

router.get('/profile', (req, res) => {
    res.render('profile')
})

router.get('/register', (req, res) => {
    res.render('register')
})

router.post('/login', (req, res) => {
    res.render('login')
})

export default router;