import express from "express";
import session from "express-session";
import userRouter from "./routes/users.js";
import bodyParser from "body-parser";
import { entry, getScoreboard, insertDuck } from "./functions.js";

const app = express(); // Create express app

app.use(bodyParser.urlencoded({ extended: true })); // Parse form submissions
app.use(bodyParser.json());

app.set("view engine", "ejs"); // Set view engine to ejs

app.use(session({ // Set up session
	secret: "yr6wu47r6WLPwl88kuro8pp5gdhag$Flkehey",
	cookie: {
		sameSite: "strict",
		maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
	},
	resave: false,
	saveUninitialized: true
}));

app.get("/", (req, res) => { // Serve home page
	res.render("index", { pageTitle: "home", authorised: req.session.authorised, permissions: req.session.permissions });
});

app.get("/entry", (req, res) => { // Serve entry page
	if(req.session.authorised){
		const status = decodeURIComponent(req.query.status) || "";
		res.render("entry", { pageTitle: "duck entry", authorised: req.session.authorised, permissions: req.session.permissions, status });
	} else {
		res.redirect("users/login?status=" + encodeURIComponent("Please log in to enter a duck"));
	}
});

app.get("/scoreboard", async (req, res) => { // Serve scoreboard page
	let scoreboard = await getScoreboard();
	res.render("scoreboard", { pageTitle: "scoreboard", authorised: req.session.authorised, permissions: req.session.permissions, scoreboard });
});

app.get("/newduck", (req, res) => { // Serve new duck page
	if(req.session.permissions > 0){
		const status = decodeURIComponent(req.query.status) || "";
		res.render("newduck", { pageTitle: "new duck", authorised: req.session.authorised, permissions: req.session.permissions, status });
	} else {
		res.status(403).render("errors/403", { pageTitle: "403", authorised: req.session.authorised, permissions: req.session.permissions });
	}
});

app.post("/newduck", async (req, res) => { // Handle new duck form submission
	if(req.session.permissions > 0){
		const status = await insertDuck(req, req.body.code, req.body.location);
		res.redirect("newduck?status=" + encodeURIComponent(status));
	} else {
		res.status(403).render("errors/403", { pageTitle: "403", authorised: req.session.authorised, permissions: req.session.permissions });
	}
});

app.post("/entry", async (req, res) => { // Handle entry form submission
	const status = await entry(req, res, req.body.duckCode);
	res.redirect("/entry?status=" + encodeURIComponent(status));
});

app.use("/users", userRouter); // Use user router

app.use(express.static("public")); // Serve static files

app.listen(3000); // Listen on port 3000