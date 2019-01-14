const random = require('lodash')

var express = require('express')
var ParseServer = require('parse-server').ParseServer
var path = require('path')

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI

var args = process.argv.slice(2)

let numRounds = args[0]

var api = new ParseServer({
    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud.js',
    appId: process.env.APP_ID || 'myAppId',
    masterKey: process.env.MASTER_KEY || 'masterkey',
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/picolo',
    liveQuery: {
        classNames: ["Player"]
    },
    logLevel: "error"
})

var app = express()

var mountPath = process.env.PARSE_MOUNT || '/picolo'
app.use(mountPath, api)

app.get('/hp', function(req, res) {
    res.send(100)
})

var port = process.env.PORT || 1337
var httpServer = require('http').createServer(app)
httpServer.listen(port, function() {
    //console.log('picolo running on port ' + port)
})

ParseServer.createLiveQueryServer(httpServer)

// below is client code
Parse.initialize("myAppId")
Parse.serverURL = 'http://localhost:1337/picolo'

const Player = Parse.Object.extend("Player")
const HistPlayer = Parse.Object.extend("HistPlayer")

// create 10 players
let players = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10']
//let players = ['vnhCyA58hn', 'Dccu1Cu4K3', 'vAor7yXnIg', 'GnakfhHHy7', 'YCjy9IhKMB', 'NCKtU3Vfqz', 'IA0nMowxHK', 'ZIiGoqG3C5', '6sGTtgtmDf', 'XAIJDJtXgX']
for (var i = players.length - 1; i >= 0; i--) {
    //addPlayerToGame(players[i])
}

// listen for updates
let query = new Parse.Query('Player')
let subscription = query.subscribe()
subscription.on('update', (player) => {
    console.log("Player update received from picolo", JSON.stringify(player))
})

// call simulate
simulateGame()

function addPlayerToGame(playerId) {
    let player = new Player()
    player.set("name", playerId)
    player.set("kills", 0)
    player.set("deaths", 0)
    player.set("hp", 100)

    player.save()
        .then((plr) => {
            console.log('New player created with name: ' + playerId)
        }, (error) => {
            console.error('Failed to create new player, with error code: ' + error.message)
        })

    // add player to server history if not exists
    let query = new Parse.Query(HistPlayer)
    query.equalTo("name", playerId)
    query.first().then(function(result) {
        //console.log('result is', results)
        if (result) {
            console.log('player ' + playerId + ' exists in history')
        } else {
            let histPlayer = new HistPlayer()
            histPlayer.set("name", playerId)
            histPlayer.set("kills", 0)
            histPlayer.set("deaths", 0)

            histPlayer.save()
                .then((plr) => {
                    console.log('New player created in history with name: ' + playerId)
                }, (error) => {
                    console.error('Failed to create new player in history with error code: ' + error.message)
                })

        }
    })
}

function simulateGame() {
    let state = {}

    for (let i = 0; i < numRounds; i++) {
        let randIdx = random.random(0, players.length - 1)
        let playerId = players[randIdx]
        let playerState = state[playerId]
        //console.log(playerState)
        if (playerState == undefined) {
            playerState = {
                kills: 0,
                deaths: 0
            }
            state[playerId] = playerState
        }
        //console.log(state)
        let toss = random.random(0, 1)
        if (toss == 0) {
            playerState.kills = playerState.kills + 1
        } else {
            playerState.deaths = playerState.deaths + 1
        }
        console.log(playerState)
        console.log(state)

        let query = new Parse.Query(Player)
        query.equalTo("name", playerId)
        query.first().then(function(player) {
            player.set("kills", playerState.kills)
            player.set("deaths", playerState.deaths)
            player.save()
                .then((plr) => {
                    console.log('Player with playerId: ' + playerId + ' updated')
                }, (error) => {
                    console.log('Failed to update player, with error code: ' + error.message)
                })
        })
    }
}