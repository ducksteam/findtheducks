import bcrypt from "bcrypt";
import Filter from "bad-words";
import sql from "./db.js";

async function register(email, username, password, confirmPassword) {
	const filter = new Filter();

	// Check passwords match
	if (password !== confirmPassword) {
		return "Passwords do not match";
	}

	// Check email is valid
	const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
	if (!email.match(mailFormat)) {
		return "Invalid email";
	}
	
	// Check username is valid
	let emailCheck = await sql`select * from users where email = ${email}`;
	if (emailCheck.length !== 0) {
		return "Email already in use";
	}

	// Check username is not profane
	if(filter.isProfane(username)){
		return "Username contains profanity";
	}

	// Check username is not taken
	let usernameCheck = await sql`select * from users where username = ${username}`;
	if (usernameCheck.length !== 0) {
		return "Username already in use";
	}

	// Hash password and insert into database
	try {
		const passwordHash = await bcrypt.hash(password, 10);
		await sql`insert into users (email, username, password_hash, permissions) values (${email}, ${username}, ${passwordHash}, 0)`;
		return "Success!";
	} catch (err) {
		return "Error inserting into database";
	}
}

async function login(email, password) {
	// Check email is valid
	const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
	if (!email.match(mailFormat)) {
		return "Invalid email";
	}

	// Check email has associated account
	let emailCheck = await sql`select * from users where email = ${email}`;
	if (emailCheck.length === 0) {
		return "Email not registered";
	}

	// Check password is correct
	const passwordCheck = await bcrypt.compare(password, emailCheck[0].password_hash);
	if (!passwordCheck) {
		return "Incorrect password";
	}
	
}

export { register, login };