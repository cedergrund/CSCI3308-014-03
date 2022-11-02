const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

// database configuration
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

app.set('view engine', 'ejs');
app.use(bodyParser.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use(
    express.static("resources")
);

app.get('/', (req, res) => {
    res.render('pages/home');
});

app.get("/login", (req, res) => {
    res.render("pages/login");
  });
  
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const query = "select * from students where users.username = $1";
    const values = [username];
  
db.one(query, values)
    .then((data) => {
    user.username = username;
    user.password = password;
  
    req.session.user = user;
    req.session.save();
  
    res.redirect("/");
    })
    .catch((err) => {
    console.log(err);
    res.redirect("/login");
    });
});

app.listen(3000);
console.log('Server is listening on port 3000');