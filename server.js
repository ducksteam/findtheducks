import express from 'express';
import sql from './db.js';
import { hashSync, compareSync } from 'bcrypt';

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
})

app.get('/entry', (req, res) => {
    res.render('entry');
});

app.get('/scoreboard', (req, res) => {
    res.render('scoreboard');
});

import userRouter from './routes/users.js';

app.use('/users', userRouter);

app.use(express.static("public"));

function register(email, username, password, confirmPassword) {
    let error = "";
    if (password !== confirmPassword) {
        error = "Passwords do not match";
    }
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (email.match(mailformat)) {
        error = "Invalid email";
    }
    let emailCheck = sql`select * from users where email = ${email}`;
    if(emailCheck.length !== 0) {
        error = "Email already in use";
    }
    let usernameCheck = sql`select * from users where username = ${username}`;
    if(usernameCheck.length !== 0) {
        error = "Username already in use";
    }
    if(!error){
        let hash = hashSync(password, 10);
        try {
            sql`insert into users (email, username, password) values (${email}, ${username}, ${hash})`;
        } catch (error) {
            error = "Error inserting into database";
        }
        error = "Success";
    }
}

app.listen(3000);