const random = require('lodash')
var ParseServer = require('parse-server').ParseServer

var args = process.argv.slice(2)

let numRounds = args[0]

// below is client code
Parse.initialize("myAppId")
    //Parse.serverURL = 'http://localhost:1337/picolo'
Parse.serverURL = 'http://35.231.47.28:1337/picolo'

const Player = Parse.Object.extend("Player")
const HistPlayer = Parse.Object.extend("HistPlayer")

// create 10 players
let players = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10']
for (var i = players.length - 1; i >= 0; i--) {
    addPlayerToGame(players[i])
}

// listen for updates
let query = new Parse.Query('Player')
let subscription = query.subscribe()
subscription.on('update', (player) => {
    console.log("Player update received from picolo for", JSON.stringify(player))
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
            //console.log('New player created with name: ' + playerId)
        }, (error) => {
            console.error('Failed to create new player, with error code: ' + error.message)
        })

    // add player to server history if not exists
    let query = new Parse.Query(HistPlayer)
    query.equalTo("name", playerId)
    query.first().then(function(result) {
        //console.log('result is', results)
        if (result) {
            //console.log('player ' + playerId + ' exists in history')
        } else {
            let histPlayer = new HistPlayer()
            histPlayer.set("name", playerId)
            histPlayer.set("kills", 0)
            histPlayer.set("deaths", 0)

            histPlayer.save()
                .then((plr) => {
                    //console.log('New player created in history with name: ' + playerId)
                }, (error) => {
                    console.error('Failed to create new player in history with error code: ' + error.message)
                })

        }
    })
}

function simulateGame() {
    let state = {}
    let saves = 0
    for (let i = 0; i < numRounds; i++) {
        let randIdx = random.random(0, players.length - 1)
        let playerId = players[randIdx]
        let playerStateBefore = state[playerId]
            //console.log(playerStateBefore)
        if (playerStateBefore == undefined) {
            playerStateBefore = {
                kills: 0,
                deaths: 0
            }
            state[playerId] = playerStateBefore
        }
        //console.log(state)
        let playerStateAfter = {
            kills: 0,
            deaths: 0
        }
        let toss = random.random(0, 1)
        if (toss == 0) {
            playerStateAfter.kills = playerStateBefore.kills + 1
        } else {
            playerStateAfter.deaths = playerStateBefore.deaths + 1
        }
        state[playerId] = playerStateAfter
        console.log(playerStateAfter)
        console.log(state)

        let query = new Parse.Query(Player)
        query.equalTo("name", playerId)
        query.first().then(function(player) {
            player.set("kills", playerStateAfter.kills)
            player.set("deaths", playerStateAfter.deaths)
            player.save()
                .then((plr) => {
                    console.log('Player with playerId: ' + playerId + ' updated')
                    saves++
                    if (saves == numRounds / 2) {
                        console.log('changing parse url')
                        Parse.serverURL = 'http://localhost:1337/picolo'
                    }
                    //calculate hp
                    let params = {}
                    params.before = playerStateBefore
                    params.after = playerStateAfter
                    params.after.name = playerId
                    Parse.Cloud.run("calcHp", params)
                }, (error) => {
                    console.log('Failed to update player, with error code: ' + error.message)
                })
        })
    }
}