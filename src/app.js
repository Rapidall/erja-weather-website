const express = require('express')
const chalk = require('chalk')
const path = require('path')
const hbs = require('hbs')
const geocode = require('./utils/geocode')
const forecast = require('./utils/forecast')
const friendlist = require('./utils/friendlist')
const idconverter = require('./utils/idconverter')
const recentlyplayed = require('./utils/recentlyplayed')
const ownedgames = require('./utils/ownedgames')


const app = express();
const port = process.env.PORT || 3000

// var myparam = process.argv[2];

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// Setup handlebars engine and views location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))

app.get('', (req, res) => {
    res.render('index', {
        title: 'My Projects',
        body: 'This is a hub for some of my projects. Pick one to try it out!',
        name: 'Eric Jansson'
    })
})


app.get('/weatherapp', (req, res) => {
    res.render('weatherapp', {
        title: 'Weather App',
        body: 'Use this site to get your weather!',
        name: 'Eric Jansson'
    })
})

app.get('/weatherapp/about', (req, res) => {
    res.render('about', {
        title: 'About',
        body: 'Information is gathered here.',
        name: 'Eric Jansson'
    })
})

app.get('/weatherapp/help', (req, res) => {
    res.render('help', {
        title: 'Help',
        body: 'Help is coming!',
        name: 'Eric Jansson'
    })
})

app.get('/weather', (req, res) => {
    if (!req.query.address) {
        return res.send({
            error: "You must provide an address!"
        })
    }
    geocode(req.query.address, (error, { latitude, longitude, location } = {}) => {
        if (error) {
            return res.send({
                error: "Unable to find location. Try another search."
            })
        }
        forecast(latitude, longitude, (error, forecastData) => {
            if (error) {
                return res.send({
                    error: "An error has occurred with forecast."
                })
            }
            res.send({
                location,
                forecast: forecastData,
                address: req.query.address
            })
        })
    })
})



app.get('/steam/ownedgames', (req, res) => {
    if (!req.query.steamid) {
        return res.send({
            error: "You must provide a SteamID."
        })
    }
    ownedgames(req.query.steamid, (error, { owned_games } = {}) => {
        if (error) {
            return res.send({
                error: error
                // "SteamID invalid. Try again."
            })
        }
        res.send({
            owned_games
        })
    })
})


app.get('/steam/getuser', (req, res) => {
    if (!req.query.steamid) {
        return res.send({
            error: "You must provide a SteamID."
        })
    }
    idconverter(req.query.steamid, (error, userdata) => {
        if (error) {
            // console.log("error")
            return res.send({
                error: error
            })
        }
        // console.log("Success")
        res.send({
            userdata
        })
    })
})


app.get('/steam/recentlyplayed', (req, res) => {
    if (!req.query.steamid) {
        return res.send({
            error: "You must provide a SteamID."
        })
    }
    recentlyplayed(req.query.steamid, (error, { games } = {}) => {
        if (error) {
            return res.send({
                error: error
                // "SteamID invalid. Try again."
            })
        }
        res.send({
            games
        })
    })
})




app.get('/steam/friendlist', (req, res) => {
    if (!req.query.steamid) {
        return res.send({
            error: "You must provide a SteamID."
        })
    }
    // use steam_ID to find array of steam_IDs from friends.
    friendlist(req.query.steamid, (error, { friendids } = {}) => {
        var usernameVariable = "";
        // if user is hidden, GET name 
        if (error === " is hidden. Friendlist unavailable.") {
            idconverter(req.query.steamid, (error, hiddenusername) => {
                if (error) {
                    return res.send({
                        error: "An error has occurred while converting ID to name."
                    })
                }
                usernameVariable = hiddenusername.playerName;
            })
        } else if (error) {
            return res.send({
                error: error
                // "SteamID invalid. Try again."
            })
        } else {
            // Store steam User personastate (On/Offline)
            var playerStatus = ""
            // Store friend NAMES here
            var friendarray = []
            // Store friend IDS here (so ids and names will be in sync)
            var friendidarray = []
            // Store friend avatar links here
            var friendAvatars = []
            // this is friendids (and where we add the users name)
            var temporaryFriendids = friendids
            // users name will be stored here
            var steamuser = ""
            // add users name FIRST in friendid array
            temporaryFriendids.unshift(req.query.steamid)
            for (let i = 0; i < temporaryFriendids.length; i++) {
                idconverter(temporaryFriendids[i], (error, friendnames) => {
                    if (error) {
                        return res.send({
                            error: "An error has occurred while converting IDs to names."
                        })
                    }
                    // save users name in different variable
                    if (i === 0) {
                        steamuser = friendnames
                        usercreated = friendnames.playerCreated
                        playerStatus = friendnames.playerStatus
                        // save all names in ids/name arrays
                    } else {
                        friendidarray.push(temporaryFriendids[i])
                        friendarray.push(friendnames.playerName)
                        friendAvatars.push(friendnames.playerAvatar)
                    }
                })
            }
        }
        // recurrsion, check if all names are present. When they are, run => res.send 
        sendResults = () => {
            // console.log(chalk.red("retrying..."))
            // check if all names are present
            if (error) {
                // if steamuser is hidden
                if (usernameVariable.length > 0) {
                    // console.log("Done")
                    res.send({
                        error: error,
                        username: usernameVariable,
                        hidden: "true"
                        // "SteamID invalid. Try again."
                    })
                } else {
                    return setTimeout(sendResults, 250)
                }
            }
            // if the search worked post the data
            else if (friendids.length === friendidarray.length + 1 && steamuser != "") {
                // console.log(chalk.green("Search complete"))
                res.send({
                    steamusername: steamuser.playerName,
                    steamuseravatar: steamuser.playerAvatar,
                    usercreated: usercreated,
                    steamuserid: req.query.steamid,
                    playerStatus: playerStatus,
                    friendids: friendidarray,
                    friendnames: friendarray,
                    friendAvatars: friendAvatars
                })
            } else {
                // retry
                setTimeout(sendResults, 250)
            }
        }
        // run function once
        sendResults();
    })
})


app.get('/learn_for_fun', (req, res) => {
    res.render('learn_for_fun', {
        title: 'Learning website',
        body: '',
        name: 'Eric Jansson'
    })
})

app.get('/learn_for_fun/api', (req, res) => {
    res.send({
        all_questions: [
            {
                question: "I am very glad to meet you.",
                answer: "Oaidekite ureshii desu",
                alt_answer: "おあいできて　うれしいです。"
            }, {
                question: "Do you speak English?",
                answer: "Eigo o hanasemasu ka",
                alt_answer: "えいごをはなせますか。"
            }, {
                question: "How are you?",
                answer: "O-genki desu ka",
                alt_answer: "おげんきですか。"
            }, {
                question: "I don't understand.",
                answer: "Wakarimasen",
                alt_answer: "わかりません。"
            }, {
                question: "I only speak a little Japanese.",
                answer: "Watashi wa nihongo ga sukoshi shika hanasemasen.",
                alt_answer: "わたしは　にほんごがすこししか　はなせません。"
            }, {
                question: "My name is Kaorii.",
                answer: "Watashi no namae wa Kaori desu.",
                alt_answer: "わたしのなまえは　かおりです。"
            }, {
                question: "Long time, no see!",
                answer: "Hisashiburi",
                alt_answer: "久しぶり。"
            }, {
                question: "See you later/Goodbye",
                answer: "Ja Mata",
                alt_answer: "じゃまた。"
            }
        ],
        title: 'Japanese vocabulary',
        description: 'Beginner japanese vocabulary. With or without romaji.',
        creator_name: 'Eric Jansson'
    })
})

app.get('/steam', (req, res) => {
    res.render('steam', {
        title: 'Steam User Info',
        body: 'Powered by: ',
        link: 'Steamworks',
        name: 'Eric Jansson',
        errormessage: 'Article not found.'
    })
})

app.get('/products', (req, res) => {
    if (!req.query.search) {
        return res.send({
            error: "You must prove a search term."
        })
    }
    res.send({
        products: [req.query.search]
    })
})

app.get('/help/*', (req, res) => {
    res.render('404', {
        title: 'Help',
        errormessage: 'Article not found.'
    })
})


app.get('*', (req, res) => {
    res.render('404', {
        title: '404',
        errormessage: 'Page not found.',
        name: 'Eric Jansson'
    })
})





app.listen(port, () => {
    console.log(chalk.blue.bold('Server is up on port ' + port + '.'))
});





