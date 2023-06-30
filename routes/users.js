import express from "express";
const router = express.Router();
import { register, login, getProfile } from "../functions.js";
import sql from "../db.js";

router.get("/profile", async (req, res) => { // Serve profile page
	if(req.session.authorised){
		const {parsedFinds, firstFinds} = await getProfile(req);
		res.render("users/profile", { pageTitle: "profile", user: req.session.user, authorised: req.session.authorised, permissions: req.session.permissions, parsedFinds, firstFinds });
	} else {
		res.redirect("login?status=" + encodeURIComponent("Please log in to view your profile"));
	}
});

router.get("/register", (req, res) => { // Serve register page
	const status = decodeURIComponent(req.query.status) || "";
	res.render("users/register", { status, pageTitle: "sign up", authorised: req.session.authorised, permissions: req.session.permissions });
});

router.get("/login", (req, res) => { // Serve login page
	if(req.session.authorised){
		res.redirect("profile");
	} else {
		const status = decodeURIComponent(req.query.status) || "";
		res.render("users/login", { status, pageTitle: "sign in", authorised: req.session.authorised, permissions: req.session.permissions });
	}
});

router.get("/logout", (req, res) => { // Handle logout
	req.session.destroy();
	res.redirect("login?status=" + encodeURIComponent("Logged out"));
});

router.get("/verify", (req, res) => { // Handle email verification
	const uuid = req.query.uuid; // Get verification ID from query string
	if(uuid){ 
		const user = sql`SELECT * FROM users WHERE verification_id = ${uuid}`; // Get user with matching verification ID
		if(new Date(user[0].verification_date + 30*60*1000) > Date.now()){ // Check if verification link has not expired
			sql`UPDATE users SET verification_id = NULL, verification_date = NULL, verified = TRUE WHERE id = ${user[0].id}`; // Update user to verified
			res.redirect("login?status=" + encodeURIComponent("Email verified"));
		} else {
			res.redirect("resend?status=" + encodeURIComponent("Verification link expired"));
		}
	} else {
		res.redirect("resend?status=" + encodeURIComponent("Invalid verification link"));
	}
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