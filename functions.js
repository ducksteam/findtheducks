import bcrypt from "bcrypt";
import sql from "./db.js";

async function register(email, username, password, confirmPassword) {
	let error;
	if (password !== confirmPassword) {
		console.log("Passwords do not match");
		error = "Passwords do not match";
	}
	const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
	if (!email.match(mailFormat)) {
		console.log("Invalid email");
		error = "Invalid email";
	}
	let emailCheck = await sql`select * from users where email = ${email}`;
	if (emailCheck.length !== 0) {
		console.log("Email already in use");
		error = "Email already in use";
	}
	let usernameCheck = await sql`select * from users where username = ${username}`;
	if (usernameCheck.length !== 0) {
		console.log("Username already in use");
		error = "Username already in use";
	}
	if (!error) {
		try {
			const passwordHash = await bcrypt.hash(password, 10);
			let insertUser = await sql`insert into users (email, username, password_hash, permissions) values (${email}, ${username}, ${passwordHash}, 0)`;
			console.log(insertUser);
			return "Success!";
		} catch (err) {
			error = "Error inserting into database";
		}
	}
	return error;
}

export { register };