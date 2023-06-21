import express from "express";
import session from "express-session";
import userRouter from "./routes/users.js";
import bodyParser from "body-parser";
import { entry } from "./functions.js";

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
	res.render("index", { pageTitle: "home", authorised: req.session.authorised });
});

app.get("/entry", (req, res) => { // Serve entry page
	if(req.session.authorised){
		const status = decodeURIComponent(req.query.status) || "";
		res.render("entry", { pageTitle: "duck entry", authorised: req.session.authorised, status });
	} else {
		res.redirect("/users/login?status=" + encodeURIComponent("Please log in to enter a duck"));
	}
});

app.get("/scoreboard", (req, res) => { // Serve scoreboard page
	res.render("scoreboard", { pageTitle: "scoreboard", authorised: req.session.authorised });
});

app.post("/entry", (req, res) => { // Handle entry form submission
	const status = entry(req, res, req.body.duckCode);
	res.redirect("/entry?status=" + encodeURIComponent(status));
});

app.use("/users", userRouter); // Use user router

app.use(express.static("public")); // Serve static files

app.listen(3000); // Listen on port 3000