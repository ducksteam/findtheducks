import express from "express";
const router = express.Router();
import { register, login } from "../functions.js";

router.get("/profile", (req, res) => { // Serve profile page
	if(req.session.authorised){
		res.render("users/profile", { pageTitle: "profile", username: req.session.user.username, authorised: req.session.authorised });
	} else {
		res.redirect("login");
	}
});

router.get("/register", (req, res) => { // Serve register page
	const errorMsg = decodeURIComponent(req.query.error) || "";
	res.render("users/register", { errorMsg, pageTitle: "sign up", authorised: req.session.authorised });
});

router.get("/login", (req, res) => { // Serve login page
	if(req.session.authorised){
		res.redirect("profile");
	} else {
		const errorMsg = decodeURIComponent(req.query.error) || "";
		res.render("users/login", { errorMsg, pageTitle: "sign in", authorised: req.session.authorised });
	}
});

router.get("/logout", (req, res) => { // Handle logout
	req.session.destroy();
	res.redirect("login?error=" + encodeURIComponent("Logged out"));
});

router.post("/register", async (req, res) => { // Handle register form submission
	const { email, username, password, confirmPassword } = req.body;
	const error = await register(email, username, password, confirmPassword);
	res.redirect("/users/register?error=" + encodeURIComponent(error));
});

router.post("/login", async (req, res) => { // Handle login form submission
	const { email, password } = req.body;
	const error = await login(req, res, email, password);
	if (error === "Success!") {
		res.redirect("profile");
	} else {
		res.redirect("/users/login?error=" + encodeURIComponent(error));
	}
});

router.use(express.static("public")); // Serve static files

export default router;