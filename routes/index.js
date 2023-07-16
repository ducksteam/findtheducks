import express from "express";
const router = express.Router();

import { entry, getScoreboard, insertDuck } from "../functions.js";
import duckFact from "../duckFacts.js";
import sql from "../db.js";

router.get("/", async (req, res) => { // Serve home page
	let stats = {
		totalDucks: 0,
		unfoundDucks: 0,
		totalUsers: 0,
		totalFinds: 0,
		showStats: false
	};
	if(req.session.authorised){
		stats.showStats = true;
		let totalDucks = await sql`SELECT COUNT(*) FROM ducks`;
		let unfoundDucks = await sql`SELECT COUNT(*) FROM ducks WHERE first_user IS NULL`;
		let totalUsers = await sql`SELECT COUNT(*) FROM users WHERE permissions = 0`;
		let totalFinds = await sql`SELECT COUNT(*) FROM finds`;
		stats.totalDucks = totalDucks[0].count;
		stats.unfoundDucks = unfoundDucks[0].count;
		stats.totalUsers = totalUsers[0].count;
		stats.totalFinds = totalFinds[0].count;
	}
	res.render("index", { stats, pageTitle: "home", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact()  });
});

router.get("/entry", (req, res) => { // Serve entry page
	if(req.session.authorised){
		const status = decodeURIComponent(req.query.status) || "";
		res.render("entry", { pageTitle: "duck entry", authorised: req.session.authorised, permissions: req.session.permissions, status, duckFact: duckFact() });
	} else {
		res.redirect("users/login?status=" + encodeURIComponent("Please log in to enter a duck"));
	}
});

router.get("/scoreboard", async (req, res) => { // Serve scoreboard page
	let scoreboard = await getScoreboard();
	res.render("scoreboard", { pageTitle: "scoreboard", authorised: req.session.authorised, permissions: req.session.permissions, scoreboard, duckFact: duckFact() });
});

router.get("/newduck", (req, res) => { // Serve new duck page
	if(req.session.permissions > 0){
		const status = decodeURIComponent(req.query.status) || "";
		res.render("newduck", { pageTitle: "new duck", authorised: req.session.authorised, permissions: req.session.permissions, status, duckFact: duckFact() });
	} else {
		res.status(403).render("errors/403", { pageTitle: "403", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact() });
	}
});

router.post("/newduck", async (req, res) => { // Handle new duck form submission
	if(req.session.permissions > 0){
		const status = await insertDuck(req, req.body.code, req.body.location);
		res.redirect("newduck?status=" + encodeURIComponent(status));
	} else {
		res.status(403).render("errors/generic", { errorCode: 403, message: "Sorry, you don't have permission to view this page.", pageTitle: "403", authorised: req.session.authorised, permissions: req.session.permissions, duckFact: duckFact() });
	}
});

router.post("/entry", async (req, res) => { // Handle entry form submission
	const status = await entry(req, res, req.body.duckCode);
	res.redirect("/entry?status=" + encodeURIComponent(status));
});

router.use(express.static("public")); // Serve static files

export default router;