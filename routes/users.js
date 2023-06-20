import express from "express";
const router = express.Router();
import { register, login } from "../functions.js";

router.get("/profile", (req, res) => {
	res.render("users/profile", { pageTitle: "profile" });
});

router.get("/register", (req, res) => {
	const errorMsg = decodeURIComponent(req.query.error) || "";
	res.render("users/register", { errorMsg, pageTitle: "sign up" });
});

router.get("/login", (req, res) => {
	const errorMsg = decodeURIComponent(req.query.error) || "";
	res.render("users/login", { errorMsg, pageTitle: "sign in" });
});

router.post("/register", async (req, res) => {
	const { email, username, password, confirmPassword } = req.body;
	const error = await register(email, username, password, confirmPassword);
	res.redirect("/users/register?error=" + encodeURIComponent(error));
});

router.post("/login", (req, res) => {
	const { email, password } = req.body;
	const error = login(email, password);
	res.redirect("/users/login?error=" + encodeURIComponent(error));
});

router.use(express.static("public"));

export default router;