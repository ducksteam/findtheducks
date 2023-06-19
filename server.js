import express from 'express';
import sql from './db.js';

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
})

import userRouter from './routes/users.js';

app.use('/users', userRouter);

app.use(express.static("public"));

app.listen(3000);