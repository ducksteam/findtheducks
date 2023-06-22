import express from "express";
const router = express.Router();
import { register, login } from "../functions.js";
import sql from "../db.js";

router.get("/profile", async (req, res) => { // Serve profile page
	if(req.session.authorised){
		let userFinds = await sql`SELECT (ducks.location_description, ducks.first_user, finds.find_date) FROM ducks INNER JOIN finds ON finds.duck_id = ducks.id WHERE finds.user_id = ${req.session.user.id}`;
		console.log(userFinds);
		let firstFinds = await sql`SELECT first_finds FROM users WHERE id = ${req.session.user.id}`;
		console.log(firstFinds);
		res.render("users/profile", { pageTitle: "profile", username: req.session.user.username, authorised: req.session.authorised, userFinds, firstFinds });
	} else {
		res.redirect("login?status=" + encodeURIComponent("Please log in to view your profile"));
	}
});

router.get("/register", (req, res) => { // Serve register page
	const errorMsg = decodeURIComponent(req.query.status) || "";
	res.render("users/register", { errorMsg, pageTitle: "sign up", authorised: req.session.authorised });
});

router.get("/login", (req, res) => { // Serve login page
	if(req.session.authorised){
		res.redirect("profile");
	} else {
		const errorMsg = decodeURIComponent(req.query.status) || "";
		res.render("users/login", { errorMsg, pageTitle: "sign in", authorised: req.session.authorised });
	}
});

router.get("/logout", (req, res) => { // Handle logout
	req.session.destroy();
	res.redirect("login?status=" + encodeURIComponent("Logged out"));
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