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
		return {"status": "error", "msg": "Invalid email"};
	}

	// Check email has associated account
	let emailCheck = await sql`select * from users where email = ${email}`;
	if (emailCheck.length === 0) {
		return {"status": "error", "msg": "Email not found"};
	}

	// Check password is correct
	const passwordCheck = await bcrypt.compare(password, emailCheck[0].password_hash);
	if (!passwordCheck) {
		return {"status": "error", "msg": "Incorrect password"};
	}
	
	let sessionId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16); // Generate random session ID
	let sessionCheck = await sql`select * from sessions where session_id = ${sessionId}`; // Check if session ID is already in use
	while (sessionCheck.length !== 0) {
		sessionId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16); // Generate new session ID if already in use
		sessionCheck = await sql`select * from sessions where session_id = ${sessionId}`;
	}
	console.log("found session id");
	let expiryDate = new Date(Date.now()); // Get current date
	expiryDate.setDate(expiryDate.getDate() + 14); // Set expiry date to 14 days from now
	expiryDate = expiryDate.toISOString().slice(0, 19).replace("T", " "); // Convert to SQL datetime format
	try {
		await sql`insert into sessions (session_id, user_id, expiry) values (${sessionId}, ${emailCheck[0].id}, ${expiryDate})`; // Insert session ID into database
	} catch (error) {
		console.error(error);
		return {"status": "error", "msg": "Error inserting into database"};
	}
	console.log("inserted session id");
	return {"status": "success", "msg": sessionId};
}

export { register, login };