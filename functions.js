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

async function login(req, res, email, password) {
	// Check email is valid
	const mailFormat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
	if (!email.match(mailFormat)) {
		return "Invalid email";
	}

	// Check email has associated account
	let user = await sql`select * from users where email = ${email}`;
	if (user.length === 0) {
		return "Email not registered";
	}

	// Check password is correct
	const passwordCheck = await bcrypt.compare(password, user[0].password_hash);
	if (!passwordCheck) {
		return "Incorrect password";
	}

	// Set session variables
	req.session.user = user[0];
	req.session.authorised = true;
	req.session.permissions = user[0].permissions;
}

async function entry(req, res, duckCode){
	// Check duck code is valid
	let duckCheck = await sql`select * from ducks where duck_key = ${duckCode}`;
	if (duckCheck.length === 0) {
		return "Duck not found";
	}
	// Check duck has not already been found by user
	let findCheck = await sql`select * from finds where duck_id = ${duckCheck[0].id}`;
	findCheck.forEach(find => {
		if(find.user_id === req.session.user.id){
			return "Duck already found";
		}
	});
	// Check if duck not yet been found and increment user's first_finds
	if(findCheck.length == 0){ 
		await sql`update users set first_finds = first_finds + 1 where id = ${req.session.user.id}`;
		await sql`update ducks set first_user = ${req.session.user.id} where id = ${duckCheck[0].id}`;
	}
	// Increment user's finds
	await sql`update users set finds = finds + 1 where id = ${req.session.user.id}`;
	// Insert find into database
	await sql`insert into finds (user_id, duck_id, find_date) VALUES (${req.session.user.id}, ${duckCheck[0].id}, NOW())`;
	return "Success!";
}

async function getScoreboard(){
	let scoreboard = await sql`select username, finds, first_finds from users where permissions = 0 order by first_finds desc, finds desc`;
	return scoreboard;
}

async function getProfile(req){
	let parsedFinds = [];
	let firstFinds = 0;
	const finds = await sql`SELECT * FROM finds WHERE user_id = ${req.session.user.id}`;
	for(const find of finds){
		let first = await sql`select first_user from ducks where id = ${find.duck_id}`;
		let duck = await sql`select location_description from ducks where id = ${find.duck_id}`;
		parsedFinds.push({
			location: duck[0].location_description,
			date: new Date(find.find_date).toLocaleDateString("en-NZ"),
			first: (first[0].first_user == req.session.user.id) ? true : false
		});
		if(first[0].first_user == req.session.user.id){
			firstFinds++;
		}
	}
	return {parsedFinds, firstFinds};
}

async function insertDuck(req, code, loc){
	const duckQuery = await sql`SELECT * FROM ducks WHERE duck_key = ${code}`;
	if(duckQuery.length !== 0){
		return "Code already exists";
	}
	try {
		await sql`INSERT INTO ducks (duck_key, location_description, date_placed) VALUES (${code}, ${loc}, NOW())`;
		return "Success!";
	} catch (err) {
		return "Error inserting into database";
	}
}

export { register, login, entry, getScoreboard, getProfile, insertDuck };