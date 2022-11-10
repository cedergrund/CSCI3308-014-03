const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');


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
    const query = 'insert into users (username, email, steam_id, password) values ($1, $2, $3, $4);';
    db.any(query, [
        req.body.username,
        req.body.email,
        req.body.steam_id,
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
                    // steam_id: 
                };
                req.session.save();
                res.redirect('/profile');
                // res.render('pages/home.ejs', {message: "Welcome :)"});
            }
            else {
                res.render('pages/login.ejs', { message: "Incorrect username or password." });
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

app.post('/gamesearch', async (req, res) => {
    const searchTerm = '%' + req.body.searchTerm + '%';
    const query = "select * from games where name like $1 or publisher like $1;";
    db.any(query, [searchTerm])
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

app.get('/leaderboard', (req, res) => {
    const query = "SELECT name, developer, average_playtime, owners from games ORDER BY average_playtime DESC LIMIT 20";
    db.any(query)
        .then((games) => {
            res.render("pages/leaderboard.ejs", {
                games
            });
        })
        .catch((err) => {
            res.render("pages/leaderboard.ejs", {
                games: [],
                errors: true,
                message: err.message,
            });
        });
});

app.get('/profile', (req, res) => {
    // var steam_id = "SELECT * FROM users WHERE username =  ORDER BY avg_rating DESC LIMIT 3;";
    // db.any(steam_id)
    //   .then(function (rows) {
    //     res.send(rows)
    //   })
    //   .catch(function (err) {
    //     res.send(err)
    //     console.log("didn't work");
    //     res.render('pages/home.ejs', {results: [], error: true});
    //   });

    axios({
        url: `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002`,
        method: 'GET',
        dataType: 'json',
        params: {
            "key": req.session.user.api_key,
            "steamids": req.session.user.steam_id,
        }
    })
        .then(results => {
            console.log(results.data); // the results will be displayed on the terminal if the docker containers are running
            if (results.data.page.totalElements == 0) {
                res.render('pages/home.ejs', { results: [], error: true });
            }
            else {
                res.render('pages/home.ejs', { results, error: false });
            }
        })
        .catch(error => {
            console.log("didn't work");
            res.render('pages/home.ejs', { results: [], error: true });
        })
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("pages/login.ejs", { message: "Logged out Successfully" });
});
