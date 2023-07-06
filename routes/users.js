import express from "express";
const router = express.Router();
import { register, login, getProfile, sendVerificationEmail } from "../functions.js";
import sql from "../db.js";
import duckFact from "../duckFacts.js";

router.get("/profile", async (req, res) => { // Serve profile page
	if(req.session.authorised){
		const {parsedFinds, firstFinds} = await getProfile(req);
		res.render("users/profile", { pageTitle: "profile", user: req.session.user, authorised: req.session.authorised, permissions: req.session.permissions, parsedFinds, firstFinds, duckFact: duckFact() });
	} else {
		res.redirect("login?status=" + encodeURIComponent("Please log in to view your profile"));
	}
});

router.get("/register", (req, res) => { // Serve register page
	const status = decodeURIComponent(req.query.status) || "";
	res.render("users/register", { status, pageTitle: "sign up", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact() });
});

router.get("/login", (req, res) => { // Serve login page
	if(req.session.authorised){
		res.redirect("profile");
	} else {
		const status = decodeURIComponent(req.query.status) || "";
		res.render("users/login", { status, pageTitle: "sign in", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact() });
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
	res.render("users/resend", { status, pageTitle: "resend verification", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact() });
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

router.post("/profile", (req, res) => { // Handle username update form submission
	if(req.session.authorised){
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

router.use(express.static("public")); // Serve static files

export default router;