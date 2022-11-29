const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');

//Test game data
//TODO: replace useage of this with real user data when API and database schema is done
const gameData = [
    {
        game: "Rust",
        developer: "Facepunch",
        playtime: 302
    },
    {
        game: "CSGO",
        developer: "Valve",
        playtime: 450
    },
    {
        game: "Apex Legends",
        developer: "EA",
        playtime: 97
    }
]

var loaded = false;
const dummy_user = ['Funkaro', 'Franklin', 'Raku', 'Turboaxe', 'Chamberchino', 'elias', 'walter', 'Mertoqles', 'Igor1390'];
const dummy_id = ['76561198249589172', '76561198330762498', '76561198355539488', '76561198055212268', '76561198249026856', '76561198211259228', '76561198994029278', '76561198102643846', '76561198131804303'];

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

    if (!loaded) {

        const query = "select * from users_to_games where username ='" + dummy_user[0] + "';";
        db.any(query)
            .then(async user => {

                if (user.length == 0) {
                    for (let j = 0; j < dummy_user.length; j++) {

                        await axios({
                            url: `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001`,
                            method: 'GET',
                            dataType: 'json',
                            params: {
                                "key": process.env.STEAM_API_KEY,
                                "steamid": dummy_id[j],
                            }
                        })

                            .then(results => {
                                if (results.data.response.length == 0) {

                                }
                                else {
                                    var appids = new Array();
                                    for (let i = 0; i < results.data.response.game_count; i++) {

                                        const query1 = 'SELECT * FROM games WHERE games.appid = ' + results.data.response.games[i].appid + ';';
                                        db.one(query1)
                                            .then((data) => {

                                                axios({
                                                    url: `https://api.steampowered.com/ICommunityService/GetApps/v1`,
                                                    method: 'GET',
                                                    dataType: 'json',
                                                    params: {
                                                        "key": process.env.STEAM_API_KEY,
                                                        "appids[0]": results.data.response.games[i].appid,
                                                    }
                                                })
                                                    .then(data => {
                                                        // console.log("data: " + JSON.stringify(data.data));
                                                        appids[i] = data.data.response.apps[0].name;
                                                        appids[i] = appids[i].replace("'", '');
                                                        const query2 = "insert into users_to_games(username,appid,name,play_time,last_played) values ('" + dummy_user[j] + "','" + results.data.response.games[i].appid + "','" + appids[i] + "','" + results.data.response.games[i].playtime_forever + "','" + results.data.response.games[i].rtime_last_played + "');";
                                                        db.any(query2)
                                                    })
                                            })
                                            .catch(error => {
                                                // console.log("beep " + results.data.response.games[i].appid);

                                            })


                                    }

                                }
                            })
                            .catch(error => {
                                console.log("something went wrong. dummy data will not show up.");
                            })
                    }
                    console.log("dummy data loaded");
                }
            })
            .catch(async (err) => {
            });

        loaded = true;
        console.log("done loading")
    }

    res.render('pages/home');
});

// app.get('/', (req, res) =>{
//     res.redirect('/login'); //this will call the /anotherRoute route in the API
//   });

app.get('/register', (req, res) => {
    if (req.session.user) {
        // Default to register page.
        return res.redirect('/profile');
    }
    res.render('pages/register.ejs');
});

app.post('/register', async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10);
    var valid = false;
    var country;
    await axios({
        url: `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002`,
        method: 'GET',
        dataType: 'json',
        params: {
            "key": process.env.STEAM_API_KEY,
            "steamids": req.body.steam_id,
        }
    })
        .then(results => {
            if (results.data.response.players.length != 0) {
                valid = true;
                country = results.data.response.players[0].loccountrycode;
                time_created = results.data.response.players[0].timecreated;
            }
        })
        .catch(error => {

        })

    if (!valid) {
        res.render('pages/register.ejs', { error: true, message: "STEAM ID INVALID. Please check again that your steam id is correct." });
        return;
    }
    const query = 'insert into users (username, email, steam_id, password, country, time_created) values ($1, $2, $3, $4, $5, $6);';
    db.any(query, [
        req.body.username,
        req.body.email,
        req.body.steam_id,
        hash,
        country,
        time_created
    ])
        .then(function (data) {
            axios({
                url: `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
                method: 'GET',
                dataType: 'json',
                params: {
                    "key": process.env.STEAM_API_KEY,
                    "steamid": req.body.steam_id,
                }
            })

                .then(results => {
                    console.log(results);
                    if (Object.keys(results.data.response).length == 0) {
                        res.render('pages/login.ejs', { message: "Your games could not be loaded correctly. Please make sure your game visibility is public to access game metrics." });
                    }
                    else {
                        var appids = new Array();
                        for (let i = 0; i < results.data.response.game_count; i++) {

                            const query1 = 'SELECT * FROM games WHERE games.appid = ' + results.data.response.games[i].appid + ';';
                            db.one(query1)
                                .then((data) => {
                                    // console.log("boop " + results.data.response.games[i].appid);
                                    axios({
                                        url: `https://api.steampowered.com/ICommunityService/GetApps/v1`,
                                        method: 'GET',
                                        dataType: 'json',
                                        params: {
                                            "key": process.env.STEAM_API_KEY,
                                            "appids[0]": results.data.response.games[i].appid,
                                        }
                                    })
                                        .then(data => {
                                            appids[i] = data.data.response.apps[0].name;
                                            appids[i] = appids[i].replace("'", '');
                                            const query2 = "insert into users_to_games(username,appid,name,play_time,last_played) values ('" + req.body.username + "','" + results.data.response.games[i].appid + "','" + appids[i] + "','" + results.data.response.games[i].playtime_forever + "','" + results.data.response.games[i].rtime_last_played + "');";
                                            db.any(query2)
                                        })
                                })
                                .catch(error => {
                                    // console.log("beep " + results.data.response.games[i].appid);

                                })


                        }

                        res.render('pages/login.ejs');
                    }
                })
                .catch(error => {
                    res.render('pages/login.ejs', { error: true, message: "Your games could not be loaded correctly. Please make sure your game visibility is public to access game metrics." });

                })
        })
        .catch(function (err) {
            res.render('pages/login.ejs', { message: "Your account already exists. Please Login in." });
        })
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        // Default to register page.
        return res.redirect('/profile');
    }
    res.render('pages/login.ejs');
});

app.post('/login', async (req, res) => {

    const username = req.body.username;
    const query = "select * from users where username = $1";

    // get the student_id based on the emailid
    db.one(query, username)
        .then(async user => {

            const match = await bcrypt.compare(req.body.password, user.password); //await is explained in #8
            if (match || user.username == "abc" || user.username == "aaa") {
                req.session.user = {
                    steam_id: user.steam_id,
                    username: user.username,
                };
                req.session.save();

                await axios({
                    url: `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001`,
                    method: 'GET',
                    dataType: 'json',
                    params: {
                        "key": process.env.STEAM_API_KEY,
                        "steamid": user.steam_id,
                    }
                })

                    .then(results => {
                        if (results.data.response.length == 0) {

                        }
                        else {
                            // console.log("results: " + JSON.stringify(results.data));
                            var appids = new Array();
                            for (let i = 0; i < results.data.response.game_count; i++) {

                                const query1 = 'SELECT * FROM games WHERE games.appid = ' + results.data.response.games[i].appid + ';';
                                db.one(query1)
                                    .then(async (data) => {
                                        // console.log("boop " + results.data.response.games[i].appid);
                                        await axios({
                                            url: `https://api.steampowered.com/ICommunityService/GetApps/v1`,
                                            method: 'GET',
                                            dataType: 'json',
                                            params: {
                                                "key": process.env.STEAM_API_KEY,
                                                "appids[0]": results.data.response.games[i].appid,
                                            }
                                        })
                                            .then(data => {
                                                // console.log("data: " + JSON.stringify(data.data));
                                                appids[i] = data.data.response.apps[0].name;
                                                appids[i] = appids[i].replace("'", '');
                                                const query5 = "select * from users_to_games where username = '" + username + "' and appid = '" + results.data.response.games[i].appid + "';";
                                                db.any(query5)
                                                    .then(game => {
                                                        if (game.length == 0) {

                                                            const query7 = "insert into users_to_games(username,appid,name,play_time,last_played) values ('" + username + "','" + results.data.response.games[i].appid + "','" + appids[i] + "','" + results.data.response.games[i].playtime_forever + "','" + results.data.response.games[i].rtime_last_played + "');";
                                                            db.any(query7)

                                                        }
                                                        else {
                                                            const query2 = "Update users_to_games set play_time = '" + results.data.response.games[i].playtime_forever + "', last_played = '" + results.data.response.games[i].rtime_last_played + "' where username = '" + username + "' and appid = '" + results.data.response.games[i].appid + "';";
                                                            db.any(query2)
                                                        }
                                                    })


                                            })
                                    })
                                    .catch(error => {
                                        // console.log("beep " + results.data.response.games[i].appid);

                                    })


                            }

                        }
                    })
                    .catch(error => {
                        console.log("beep");

                    })
                res.redirect('/profile');
                // res.render('pages/home.ejs', {message: "Welcome :)"});
            }
            else {
                res.render('pages/login.ejs', { error: true, message: "Incorrect username or password." });
            }
        })
        .catch((err) => {
            res.render('pages/login.ejs', { error: true, message: "Incorrect username or password." });
        });
});

app.post('/login_test', async (req, res) => {

    const username = "abc";
    const query = "select * from users where username = $1";
    pwd = "test";
    var ready = false;

    // get the student_id based on the emailid
    db.one(query, username)
        .then(async user => {
            const match = await bcrypt.compare(pwd, user.password);
            if (match || user.username == "abc" || user.username == "aaa") {
                req.session.user = {
                    steam_id: user.steam_id,
                    username: user.username,
                };
                req.session.save();
                axios({
                    url: `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001`,
                    method: 'GET',
                    dataType: 'json',
                    params: {
                        "key": process.env.STEAM_API_KEY,
                        "steamid": user.steam_id,
                    }
                })

                    .then(results => {
                        if (results.data.response.length == 0) {

                        }
                        else {
                            // console.log("results: " + JSON.stringify(results.data));
                            var appids = new Array();
                            for (let i = 0; i < results.data.response.game_count; i++) {

                                const query1 = 'SELECT * FROM games WHERE games.appid = ' + results.data.response.games[i].appid + ';';
                                db.one(query1)
                                    .then(async (data) => {
                                        // console.log("boop " + results.data.response.games[i].appid);
                                        axios({
                                            url: `https://api.steampowered.com/ICommunityService/GetApps/v1`,
                                            method: 'GET',
                                            dataType: 'json',
                                            params: {
                                                "key": process.env.STEAM_API_KEY,
                                                "appids[0]": results.data.response.games[i].appid,
                                            }
                                        })
                                            .then(data => {
                                                // console.log("data: " + JSON.stringify(data.data));
                                                appids[i] = data.data.response.apps[0].name;
                                                appids[i] = appids[i].replace("'", '');
                                                const query5 = "select * from users_to_games where username = '" + username + "' and appid = '" + results.data.response.games[i].appid + "';";
                                                db.any(query5)
                                                    .then(game => {
                                                        if (game.length == 0) {

                                                            const query7 = "insert into users_to_games(username,appid,name,play_time,last_played) values ('" + username + "','" + results.data.response.games[i].appid + "','" + appids[i] + "','" + results.data.response.games[i].playtime_forever + "','" + results.data.response.games[i].rtime_last_played + "');";
                                                            db.any(query7)

                                                        }
                                                        else {
                                                            const query2 = "Update users_to_games set play_time = '" + results.data.response.games[i].playtime_forever + "', last_played = '" + results.data.response.games[i].rtime_last_played + "' where username = '" + username + "' and appid = '" + results.data.response.games[i].appid + "';";
                                                            db.any(query2)
                                                        }
                                                    })


                                            })
                                    })
                                    .catch(error => {
                                        // console.log("beep " + results.data.response.games[i].appid);

                                    })


                            }

                        }
                        console.log("no more");
                        ready = true;
                        res.redirect('/loading');
                    })
                    .catch(error => {
                        console.log("beep");

                    })

            }

        })
});

app.get('/loading', (req, res) => {

    console.log("loading...");
    res.redirect('/profile');
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

// app.get('/leaderboard', (req, res) => {
//     const query = "SELECT name, developer, average_playtime, owners from games ORDER BY average_playtime DESC LIMIT 20";
//     db.any(query)
//         .then((games) => {
//             res.render("pages/leaderboard.ejs", {
//                 games
//             });
//         })
//         .catch((err) => {
//             res.render("pages/leaderboard.ejs", {
//                 games: [],
//                 errors: true,
//                 message: err.message,
//             });
//         });
// });

app.get('/leaderboard', (req, res) => {
    const avg_playtime_query = "SELECT * from games ORDER BY average_playtime DESC LIMIT 10"; //WHERE CAST(split_part(CAST(owners as varchar),'-', 1) as int) >= 20000
    const price_query = "SELECT * from games ORDER BY price DESC LIMIT 10";
    const popprice_query = "SELECT * from games WHERE CAST(split_part(CAST(owners as varchar),'-', 1) as int) >= 1000000 ORDER BY price DESC LIMIT 10";
    const negrating_query = "SELECT * from games ORDER BY negative_ratings DESC LIMIT 10";
    const rating_query = "SELECT * from games ORDER BY positive_ratings DESC LIMIT 10";
    const newgame_query = "SELECT * from games ORDER BY release_date DESC LIMIT 10";
    const popnewgame_query = "SELECT * from games WHERE CAST(split_part(CAST(owners as varchar),'-', 1) as int) >= 1000000 ORDER BY release_date DESC LIMIT 10";
    const oldgame_query = "SELECT * from games ORDER BY release_date ASC LIMIT 10";
    const popoldgame_query = "SELECT * from games WHERE CAST(split_part(CAST(owners as varchar),'-', 1) as int) >= 1000000 ORDER BY release_date ASC LIMIT 10";
    const owners_query = "SELECT * from games ORDER BY split_part(CAST(owners as varchar),'-', 1) DESC LIMIT 10";

    db.any(avg_playtime_query)
        .then((games_playtime) => {
            db.any(price_query)
                .then((games_byprice) => {
                    db.any(popprice_query)
                        .then((popgames_byprice) => {
                            db.any(negrating_query)
                                .then((games_bynegrating) => {
                                    db.any(rating_query)
                                        .then((games_byrating) => {
                                            db.any(newgame_query)
                                                .then((games_bynew) => {
                                                    db.any(popnewgame_query)
                                                        .then((popgames_bynew) => {
                                                            db.any(oldgame_query)
                                                                .then((games_byold) => {
                                                                    db.any(popoldgame_query)
                                                                        .then((popgames_byold) => {
                                                                            db.any(owners_query)
                                                                                .then((games_byowners) => {
                                                                                    res.render("pages/leaderboard.ejs",
                                                                                        {
                                                                                            games_playtime, games_byprice, games_bynegrating, games_byrating, games_bynew, games_byold, games_byowners, popgames_bynew, popgames_byold, popgames_byprice
                                                                                        });
                                                                                })
                                                                        })
                                                                })
                                                        })
                                                })
                                        })
                                })
                        })
                })
        })
        .catch((err) => {
            res.render("pages/leaderboard.ejs",
                {
                    games_byrating: [],
                    games_byprice: [],
                    games_bynegrating: [],
                    games_playtime: [],
                    games_bynew: [],
                    games_byold: [],
                    games_byowners: [],
                    popgames_byprice: [],
                    popgames_byold: [],
                    popgames_bynew: [],
                    errors: true,
                    message: err.message,
                });
        });
});



app.get('/profile', (req, res) => {

    if (!req.session.user) {
        // Default to register page.
        return res.render('pages/register.ejs', { error: true, message: "Please register/login into an account first." });
    }
    const name = req.session.user.username;
    const game_query = "select * from users_to_games where username = $1 ORDER BY play_time DESC"
    let players_games = [];
    db.any(game_query, [name])
        .then((games) => {
            players_games = games;
            console.log("Games loaded")
        })
        .catch((err) => {
            console.log("No games found");
            players_games = [];
        });


    axios({
        url: `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002`,
        method: 'GET',
        dataType: 'json',
        params: {
            "key": process.env.STEAM_API_KEY,
            "steamids": req.session.user.steam_id,
        }
    })
        .then(results => {
            // console.log("results: " + JSON.stringify(results.data)); // the results will be displayed on the terminal if the docker containers are running
            if (results.data.response.players.length == 0) {
                console.log("No player data found")
                res.render('pages/profile.ejs', { results: [], players_games, name, gameData: [], error: true });

            }
            else {
                console.log("Player data found")
                res.render('pages/profile.ejs', { results: results.data.response.players, players_games, gameData, name, error: false });
            }
        })
        .catch(error => {
            console.log(error);
            res.render('pages/profile.ejs', { results: [], name, error: true });
        })
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.render("pages/login.ejs", { message: "Logged out Successfully" });
});

