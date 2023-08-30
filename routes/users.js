import express from "express";
const router = express.Router();
import { register, login, getProfile, sendVerificationEmail, sendPasswordResetEmail, updatePassword } from "../functions.js";
import sql from "../db.js";
import duckFact from "../duckFacts.js";
import bcrypt from "bcrypt";
import Filter from "bad-words";


router.get("/profile", async (req, res) => { // Serve profile page
	if(req.session.authorised){
		try {
			const {parsedFinds, firstFinds} = await getProfile(req);
			const status = decodeURIComponent(req.query.status) || "";
			const csrfToken = req.csrfToken();
			res.render("users/profile", { status, pageTitle: "profile", user: req.session.user, authorised: req.session.authorised, permissions: req.session.permissions, parsedFinds, firstFinds, duckFact: duckFact(), csrfToken });
		} catch (err) {
			console.log(err);
			res.redirect("login?status=" + encodeURIComponent("Error getting profile"));
		}
	} else {
		res.redirect("login?status=" + encodeURIComponent("Please log in to view your profile"));
	}
});

router.get("/register", (req, res) => { // Serve register page
	const status = decodeURIComponent(req.query.status) || "";
	const csrfToken = req.csrfToken();
	res.render("users/register", { status, pageTitle: "sign up", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact(), csrfToken });
});

router.get("/login", (req, res) => { // Serve login page
	if(req.session.authorised){
		res.redirect("profile");
	} else {
		const status = decodeURIComponent(req.query.status) || "";
		const csrfToken = req.csrfToken();
		res.render("users/login", { status, pageTitle: "sign in", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact(), csrfToken });
	}
});

router.get("/logout", (req, res) => { // Handle logout
	req.session.destroy();
	res.redirect("login?status=" + encodeURIComponent("Logged out"));
});

router.get("/verify", async (req, res) => { // Handle email verification
	const uuid = req.query.uuid; // Get verification ID from query string
	if(uuid){
		const user = await sql`SELECT * FROM users WHERE verification_id = ${uuid}`; // Get user with matching verification ID
		if(user[0]){
			const issued = new Date(user[0].verification_date);
			const expiry = new Date();
			expiry.setTime(issued.getTime() + (30 * 60 * 1000)); // Set expiry to 30 minutes after verification link was issued
			const now = new Date();
			now.setTime(now.getTime() - 12 * 60 * 60 * 1000);
			if(expiry.getTime() > now.getTime()){ // Check if verification link has not expired
				await sql`UPDATE users SET verification_id = NULL, verification_date = NULL, verified = TRUE WHERE id = ${user[0].id}`; // Update user to verified
				res.redirect("login?status=" + encodeURIComponent("Email verified"));
			} else {
				res.redirect("resend?status=" + encodeURIComponent("Verification link expired"));
			}
		} else {
			res.redirect("login?status=" + encodeURIComponent("Email already verified"));
		}
	} else {
		res.redirect("resend?status=" + encodeURIComponent("Invalid verification link"));
	}
});

router.get("/resend", (req, res) => { // Serve resend verification page
	const status = decodeURIComponent(req.query.status) || "";
	const csrfToken = req.csrfToken();
	res.render("users/resend", { status, pageTitle: "resend verification", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact(), csrfToken});
});

router.post("/resend", async (req, res) => { // Handle resend verification form submission
	const { email } = req.body;
	const userCheck = await sql`SELECT * FROM users WHERE email = ${email}`;
	if(!userCheck[0]) return res.redirect("/users/resend?status=" + encodeURIComponent("Email not found"));
	if(userCheck[0].verified) return res.redirect("/users/resend?status=" + encodeURIComponent("Email already verified"));
	const username = userCheck[0].username;
	const status = await sendVerificationEmail(email, username);
	res.redirect("/users/resend?status=" + encodeURIComponent(status));
});

router.get("/resetlink", async (req, res) => {
	const status = decodeURIComponent(req.query.status) || "";
	const uuid = req.query.uuid;
	if(!uuid) {
		return res.redirect("/users/reset?status=" + encodeURIComponent("Invalid reset link"));
	} else {
		const uuidCheck = await sql`SELECT * FROM users WHERE reset_id = ${uuid}`; // Get user with matching reset ID
		if(!uuidCheck[0]){ // Check user exists
			return res.redirect("/users/reset?status=" + encodeURIComponent("No reset link found"));
		}
	}
	const csrfToken = req.csrfToken();
	res.render("users/resetlink", { uuid, status, pageTitle: "reset password", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact(), csrfToken });
});

router.post("/resetlink", async (req, res) => { // Handle new password form submission
	if(req.body.password !== req.body.confirmPassword){ // Check passwords match
		return res.redirect("/users/resetlink?status=" + encodeURIComponent("Passwords do not match"));
	}
	let user = await sql`SELECT * FROM users WHERE reset_id = ${req.body.uuid}`; // Get user with matching reset ID
	if(!user[0]){ // Check user exists
		return res.redirect("/users/resetlink?status=" + encodeURIComponent("Email not found"));
	} else { 
		const issued = new Date(user[0].reset_date);
		const expiry = new Date();
		expiry.setTime(issued.getTime() + (30 * 60 * 1000)); // Set expiry to 30 minutes after reset link was issued
		const now = new Date();
		now.setTime(now.getTime() - 12 * 60 * 60 * 1000);
		if(expiry.getTime() < now.getTime()){ // Check if reset link has expired
			return res.redirect("/users/resetlink?status=" + encodeURIComponent("Reset link expired"));
		} else { // Update password 
			const status = await updatePassword(req.body.uuid, req.body.password);
			if(status === "Success!"){
				res.redirect("/users/login?status=" + encodeURIComponent("Password reset"));
			} else {
				res.redirect("/users/resetlink?status=" + encodeURIComponent(status));
			}
		}
	}
	
});

router.get("/reset", (req, res) => { // Serve reset password page
	const csrfToken = req.csrfToken();
	const status = decodeURIComponent(req.query.status) || "";
	res.render("users/reset", { status, pageTitle: "reset password", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact(), csrfToken });
});

router.post("/reset", async (req, res) => { // Handle reset password form submission
	const { email } = req.body;
	const userCheck = await sql`SELECT * FROM users WHERE email = ${email}`;
	if(!userCheck[0]) return res.redirect("/users/reset?status=" + encodeURIComponent("Email not found"));
	const username = userCheck[0].username;
	try {
		const status = await sendPasswordResetEmail(email, username);
		res.redirect("/users/reset?status=" + encodeURIComponent(status));
	} catch (err) {
		console.log(err);
		res.redirect("/users/reset?status=" + encodeURIComponent("Error sending reset email"));
	}
});

router.post("/profile", async (req, res) => { // Handle username update form submission
	const username = req.body.username;
	let filter = new Filter();
	if(req.session.authorised){
		// Check username is not profane
		if(filter.isProfane(username)){
			return res.redirect("profile?status=" + encodeURIComponent("Username contains profanity"));
		}
	
		// Check username is not taken
		let usernameCheck = await sql`select * from users where username = ${username}`;
		if (usernameCheck.length !== 0) {
			return res.redirect("profile?status=" + encodeURIComponent("Username already in use"));
		} 
	
		if(username.length > 30){
			return res.redirect("profile?status=" + encodeURIComponent("Username cannot be longer than 30 characters"));
		}

		sql`UPDATE users SET username = ${req.body.username} WHERE id = ${req.session.user.id}`.then(() => {
			req.session.user.username = req.body.username;
			res.redirect("profile?status=" + encodeURIComponent("Username updated"));
		});
	}
});

router.post("/register", async (req, res) => { // Handle register form submission
	const { email, username, password, confirmPassword } = req.body;
	const status = await register(email, username, password, confirmPassword);
	res.redirect("/users/register?status=" + encodeURIComponent(status));
});

router.post("/login", async (req, res) => { // Handle login form submission
	const { email, password } = req.body;
	const status = await login(req, res, email, password);
	if (status === "Success!") {
		res.redirect("profile");
	} else {
		res.redirect("/users/login?status=" + encodeURIComponent(status));
	}
});

router.post("/password", async (req, res) => { // Handle password update form submission
	if(req.session.authorised){
		const { oldPassword, password, confirmPassword } = req.body;
		if (password !== confirmPassword) return res.redirect("profile?status=" + encodeURIComponent("Passwords do not match"));
		if (password == oldPassword) return res.redirect("profile?status=" + encodeURIComponent("New password cannot be the same as the old password"));
		const hash = await bcrypt.hash(password, 10);
		try {
			await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${req.session.user.id}`;
		} catch (err) {
			return res.redirect("profile?status=" + encodeURIComponent("Error updating password in database"));
		}
		res.redirect("profile?status=" + encodeURIComponent("Success!"));
	}
});

router.use(express.static("public")); // Serve static files

export default router;