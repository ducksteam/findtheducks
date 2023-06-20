import hashSync from "bcrypt";
import sql from "./db.js";

function register(email, username, password, confirmPassword) {
    let error;
    if (password !== confirmPassword) {
        error = "Passwords do not match";
    }
    const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (email.match(mailFormat)) {
        error = "Invalid email";
    }
    let emailCheck = sql`select * from users where email = ${email}`;
    if (emailCheck.length !== 0) {
        error = "Email already in use";
    }
    let usernameCheck = sql`select * from users where username = ${username}`;
    if (usernameCheck.length !== 0) {
        error = "Username already in use";
    }
    if (!error) {
        let hash = hashSync(password, 10);
        try {
            sql`insert into users (email, username, password_hash) values (${email}, ${username}, ${hash})`;
            return "Success!";
        } catch (err) {
            error = "Error inserting into database";
        }
    }
    return error;
}

export { register };