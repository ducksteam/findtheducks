const express = require('express');
const app = express();
const postgres = require('postgres');

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
})

const userRouter = require('./routes/users');

app.use('/users', userRouter);

app.use(express.static("public"));

app.listen(3000);