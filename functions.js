import bcrypt from "bcrypt";
import Filter from "bad-words";
import {v4 as uuidv4} from "uuid";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import sql from "./db.js";
import duckFact from "./duckFacts.js";

async function register(email, username, password, confirmPassword) {
	const filter = new Filter();

	// Check passwords match
	if (password !== confirmPassword) {
		return "Passwords do not match";
	}

	// Case lock email
	email = email.toLowerCase();

	// Check email is valid
	const mailFormat = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;	
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

	if(username.length > 30){
		return "Username cannot be longer than 30 characters";
	}

	// Hash password and insert into database
	try {
		const passwordHash = await bcrypt.hash(password, 10);
		await sql`insert into users (email, username, password_hash) values (${email}, ${username}, ${passwordHash})`;
	} catch (err) {
		console.log(err);
		return "Error inserting into database";
	}
	try {
		await sendVerificationEmail(email, username);
		return "Success!";
	} catch (err) {
		console.log(err);
		return "Error sending verification email";
	}
}

async function updatePassword(uuid, password){
	try{
		const passwordHash = await bcrypt.hash(password, 10);
		await sql`UPDATE users SET password_hash = ${passwordHash} WHERE reset_id =${uuid}`;
		await sql`UPDATE users SET reset_id = NULL, reset_date = NULL WHERE reset_id =${uuid}`;
		return "Success!";
	} catch(err){
		console.log(err);
		return "Error resetting password";
	}
}

async function login(req, res, email, password) {
	// Case lock email
	email = email.toLowerCase();

	// Check email is valid
	const mailFormat = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;	
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

	// Check email is verified
	if (!user[0].verified) {
		return "Email not verified";
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
	let findCheck = await sql`select * from finds where duck_id = ${duckCheck[0].id} and user_id = ${req.session.user.id}`;
	if (findCheck.length !== 0) {
		return "Duck already found";
	}

	if (duckCheck[0].round_id === 1) return "Success, but this resilient duck was from round 1";

	// Check if duck not yet been found and change first finder on duck
	let firstCheck = await sql`select * from finds where duck_id = ${duckCheck[0].id}`;
	if(firstCheck.length === 0){
		await sql`update ducks set first_user = ${req.session.user.id} where id = ${duckCheck[0].id}`;
	}
	// Insert find into database
	try {
		await sql`insert into finds (user_id, duck_id, find_date) VALUES (${req.session.user.id}, ${duckCheck[0].id}, NOW())`;
	} catch (err) {
		console.log(err);
		return "Error inserting into database";
	}
	// Update scoreboard
	await updateUserFinds();
	return "Success!";
}

async function getScoreboard(roundId, includeZeroFinds) {
	try {
		if(includeZeroFinds){
			if (roundId === 1) {
				return await sql`select username, round_1_finds, round_1_first_finds
								   from users
								   where permissions = 0
								   order by round_1_first_finds desc, round_1_finds desc, id`;
			} else if (roundId === 2) {
				return await sql`select username, round_2_finds, round_2_first_finds
								   from users
								   where permissions = 0
								   order by round_2_first_finds desc, round_2_finds desc, id`;
			} else {
				console.error("Invalid roundId " + roundId);
				return 0;
			}
		} else {
			if (roundId === 1) {
				return await sql`select username, round_1_finds, round_1_first_finds
								   from users
								   where permissions = 0 and round_1_finds > 0
								   order by round_1_first_finds desc, round_1_finds desc, id`;
			} else if (roundId === 2) {
				return await sql`select username, round_2_finds, round_2_first_finds
								   from users
								   where permissions = 0 and round_2_finds > 0
								   order by round_2_first_finds desc, round_2_finds desc, id`;
			} else {
				console.error("Invalid roundId " + roundId);
				return 0;
			}
		}
	} catch (err) {
		console.log(err);
	}
}

async function getProfile(req){
	let parsedFinds = [];
	let firstFinds = 0;
	const finds = await sql`SELECT * FROM finds WHERE user_id = ${req.session.user.id}`;
	for(const find of finds){
		let duck = await sql`SELECT location_description, first_user, obtainable, round_id FROM ducks WHERE id = ${find.duck_id}`;
		parsedFinds.push({
			location: duck[0].location_description,
			date: new Date(find.find_date).toLocaleDateString("en-NZ"),
			first: (duck[0].first_user === req.session.user.id),
			obtainable: duck[0].obtainable,
			round_id: duck[0].round_id
		});
		if(duck[0].first_user === req.session.user.id){
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
		await sql`INSERT INTO ducks (duck_key, location_description, date_placed, round_id) VALUES (${code}, ${loc}, NOW(), 2)`;
		return "Success!";
	} catch (err) {
		return "Error inserting into database";
	}
}

async function sendVerificationEmail(email, username) {
	const uuid = uuidv4();
	await sql`update users SET verification_id = ${uuid}, verification_date = NOW() where username = ${username}`;
	const mailgun = new Mailgun(FormData);
	const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_API_KEY, domain: "mg.findtheducks.com" });
	mg.messages.create("mg.findtheducks.com", {
		from: "Find The Ducks <noreply@findtheducks.com>",
		to: email,
		subject: "Welcome to the duckers",
		template: "verification",
		"h:X-Mailgun-Variables": JSON.stringify({uuid: uuid, duckFact: duckFact()})
	}).then(msg => console.log(msg))
		.catch(err => {
			console.log(err);
			return err;
		});
	return "Success!";
}

async function sendPasswordResetEmail(email){
	const uuid = uuidv4();
	await sql`update users SET reset_id = ${uuid}, reset_date = NOW() where email = ${email}`;
	const mailgun = new Mailgun(FormData);
	const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_API_KEY, domain: "mg.findtheducks.com" });
	mg.messages.create("mg.findtheducks.com", {
		from: "Find The Ducks <noreply@findtheducks.com>",
		to: email,
		subject: "Password reset",
		template: "reset",
		"h:X-Mailgun-Variables": JSON.stringify({uuid: uuid, duckFact: duckFact()})
	}).then(msg => console.log(msg))
		.catch(err => {
			console.log(err);
			return err;
		});
	return "Success!";
}

async function sendPasswordIsResetEmail(email){
	const mailgun = new Mailgun(FormData);
	const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_API_KEY, domain: "mg.findtheducks.com" });
	mg.messages.create("mg.findtheducks.com", {
		from: "Find The Ducks <noreply@findtheducks.com>",
		to: email,
		subject: "We've reset your password",
		template: "reset-done",
		"h:X-Mailgun-Variables": JSON.stringify({duckFact: duckFact()})
	}).then(msg => console.log(msg))
		.catch(err => {
			console.log(err);
			return err;
		});
	return "Success!";
}

async function updateUserFinds() {
	// reset user finds
	await sql`UPDATE users SET round_1_finds = 0, round_1_first_finds = 0, round_2_finds = 0, round_2_first_finds = 0`;
	const finds = await sql`SELECT * FROM finds ORDER BY find_date DESC`; // Get all finds

	for (const find of finds) { // For each find
		const duck = await sql`SELECT * FROM ducks WHERE id = ${find.duck_id}`; // Get duck found
		if (duck[0].round_id === 1) { // If duck is from round 1
			if (duck[0].first_user === find.user_id) { // If user was first to find duck, add one to first finds and finds
				await sql`UPDATE users
                          SET round_1_first_finds = round_1_first_finds + 1,
                              round_1_finds       = round_1_finds + 1
                          WHERE id = ${find.user_id}`;
			} else { // If user was not first to find duck, add one to finds
				await sql`UPDATE users
                          SET round_1_finds = round_1_finds + 1
                          WHERE id = ${find.user_id}`;
			}
		} else if (duck[0].round_id === 2) { // If duck is from round 2
			if (duck[0].first_user === find.user_id) { // If user was first to find duck, add one to first finds and finds
				await sql`UPDATE users
                          SET round_2_first_finds = round_2_first_finds + 1,
                              round_2_finds       = round_2_finds + 1
                          WHERE id = ${find.user_id}`;
			} else { // If user was not first to find duck, add one to finds
				await sql`UPDATE users
                          SET round_2_finds = round_2_finds + 1
                          WHERE id = ${find.user_id}`;
			}
		}
	}
}

export { register, login, entry, getScoreboard, getProfile, insertDuck, sendVerificationEmail, sendPasswordResetEmail, sendPasswordIsResetEmail, updatePassword };