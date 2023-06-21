import bcrypt from "bcrypt";
import Filter from "bad-words";
import sql from "./db.js";

async function register(email, username, password, confirmPassword) {
	let error;
	const filter = new Filter();
	if (password !== confirmPassword) {
		error = "Passwords do not match";
	}
	const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
	if (!email.match(mailFormat)) {
		error = "Invalid email";
	}
	let emailCheck = await sql`select * from users where email = ${email}`;
	if (emailCheck.length !== 0) {
		error = "Email already in use";
	}
	if(filter.isProfane(username)){
		error = "Username contains profanity";
	}
	let usernameCheck = await sql`select * from users where username = ${username}`;
	if (usernameCheck.length !== 0) {
		error = "Username already in use";
	}
	if (!error) {
		try {
			const passwordHash = await bcrypt.hash(password, 10);
			await sql`insert into users (email, username, password_hash, permissions) values (${email}, ${username}, ${passwordHash}, 0)`;
			return "Success!";
		} catch (err) {
			error = "Error inserting into database";
		}
	}
	return error;
}

function login(email, password) {
	let error;
	const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
	if (!email.match(mailFormat)) {
		error = "Invalid email";
		return error;
	}
	let emailCheck = sql`select * from users where email = ${email}`;
	if (emailCheck.length === 0) {
		error = "Email not found";
		return error;
	}
	const passwordCheck = bcrypt.compare(password, emailCheck[0].password_hash);
	if (!passwordCheck) {
		error = "Incorrect password";
		return error;
	}
	if (!error) {
		// generate unique session id
		
		// store session id in database
	}
}

export { register, login };