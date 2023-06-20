import express from "express";
const router = express.Router();
import { register } from "../functions.js";

router.get("/profile", (req, res) => {
	res.render("users/profile", { pageTitle: "profile" });
});

router.get("/register", (req, res) => {
	const errorMsg = decodeURIComponent(req.query.error) || "";
	res.render("users/register", { errorMsg, pageTitle: "sign up" });
});

router.get("/login", (req, res) => {
	res.render("users/login", { pageTitle: "sign in" });
});

router.post("/register", async (req, res) => {
	console.log(req.body);
	const { email, username, password, confirmPassword } = req.body;
	const error = await register(email, username, password, confirmPassword);
	res.redirect("/users/register?error=" + encodeURIComponent(error));
});

router.use(express.static("public"));

export default router;