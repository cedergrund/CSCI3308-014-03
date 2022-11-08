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

app.listen(3000);
console.log('Server is listening on port 3000');



app.get('/', (req, res) => {
    res.render('pages/home');
});

// app.get('/', (req, res) =>{
//     res.redirect('/login'); //this will call the /anotherRoute route in the API
//   });

app.get('/register', (req, res) => {
    res.render('pages/register.ejs');
});

app.post('/register', async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10);
    const query = 'insert into users (username, email, password) values ($1, $2, $3);';
    db.any(query, [
        req.body.username,
        req.body.email,
        hash
    ])
        .then(function (data) {
            res.redirect('/login');
        })
        .catch(function (err) {
            res.render('pages/register.ejs', { message: "Account already exists." });
        });
});

app.get('/login', (req, res) => {
    res.render('pages/login.ejs');
});

app.post('/login', async (req, res) => {
    const username = req.body.username;
    const query = "select * from users where username = $1";

    // get the student_id based on the emailid
    db.one(query, username)
        .then(async user => {
            const match = await bcrypt.compare(req.body.password, user.password); //await is explained in #8
            if (match) {
                req.session.user = {
                    api_key: process.env.API_KEY,
                };
                req.session.save();
                res.redirect('/');
            }
            else {
                res.redirect('/register');
                console.log("Incorrect username or password.");
            }
        })
        .catch((err) => {
            res.render('pages/login.ejs');
        });
});

app.get('/gamesearch', (req, res) => {
    const query = "select * from games";
    db.any(query)
        .then((games) => {
            res.render("pages/gamesearch.ejs", {
                games
            });
        })
        .catch((err) => {
            res.render("pages/gamesearch.ejs", {
                games: [],
                errors: true,
                message: err.message,
            });
        });
});