import express from "express";
import session from "express-session";
import userRouter from "./routes/users.js";
import bodyParser from "body-parser";

const app = express(); // Create express app

app.use(bodyParser.urlencoded({ extended: true })); // Parse form submissions
app.use(bodyParser.json());

app.set("view engine", "ejs"); // Set view engine to ejs

app.get("/", (req, res) => { // Serve home page
	res.render("index", { pageTitle: "home" });
});

app.get("/entry", (req, res) => { // Serve entry page
	res.render("entry", { pageTitle: "duck entry" });
});

app.get("/scoreboard", (req, res) => { // Serve scoreboard page
	res.render("scoreboard", { pageTitle: "scoreboard" });
});

app.use(session({ // Set up session
	secret: "yr6wu47r6WLPwl88kuro8pp5gdhag$Flkehey",
	resave: false,
	saveUninitialized: true
}));

app.use("/users", userRouter); // Use user router

app.use(express.static("public")); // Serve static files

app.listen(3000); // Listen on port 3000