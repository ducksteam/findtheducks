import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import logger from "morgan";
import cookieParser from "cookie-parser";

import indexRouter from "./routes/index.js";
import userRouter from "./routes/users.js";

const app = express(); // Create express app

app.use(logger("dev"));
app.use(cookieParser());
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

app.use("/", indexRouter);
app.use("/users", userRouter); // Use user router

app.use(express.static("public")); // Serve static files

export default app; // Export app for testing