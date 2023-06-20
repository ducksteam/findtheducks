import express from "express";
import session from "express-session";
import userRouter from "./routes/users.js";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");

app.get("/", (req, res) => {
	res.render("index", { pageTitle: "home" });
});

app.get("/entry", (req, res) => {
	res.render("entry", { pageTitle: "duck entry" });
});

app.get("/scoreboard", (req, res) => {
	res.render("scoreboard", { pageTitle: "scoreboard" });
});

app.use(session({
	secret: "yr6wu47r6WLPwl88kuro8pp5gdhag$Flkehey",
	resave: false,
	saveUninitialized: true
}));

app.use("/users", userRouter);

app.use(express.static("public"));

app.listen(3000);