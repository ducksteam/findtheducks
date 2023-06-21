import express from "express";
import session from "express-session";
import userRouter from "./routes/users.js";
import bodyParser from "body-parser";

const app = express(); // Create express app

app.use(bodyParser.urlencoded({ extended: true })); // Parse form submissions
app.use(bodyParser.json());

app.set("view engine", "ejs"); // Set view engine to ejs

app.use(session({ // Set up session
	secret: "yr6wu47r6WLPwl88kuro8pp5gdhag$Flkehey",
	cookie: {
		sameSite: "strict"
	},
	resave: false,
	saveUninitialized: true
}));

app.get("/", (req, res) => { // Serve home page
	res.render("index", { pageTitle: "home", authorised: req.session.authorised });
});

app.get("/entry", (req, res) => { // Serve entry page
	res.render("entry", { pageTitle: "duck entry", authorised: req.session.authorised });
});

app.get("/scoreboard", (req, res) => { // Serve scoreboard page
	res.render("scoreboard", { pageTitle: "scoreboard", authorised: req.session.authorised });
});

app.use("/users", userRouter); // Use user router

app.use(express.static("public")); // Serve static files

app.listen(3000); // Listen on port 3000