const random = require('lodash')
const request = require('request')

// Initialize Firebase
var firebase = require("firebase")
var config = {
    apiKey: "AIzaSyCYt2fvFea6MKJNu1n2Q_09bSMRjDSfz80",
    authDomain: "edge-9bfdc.firebaseapp.com",
    databaseURL: "https://edge-9bfdc.firebaseio.com",
    projectId: "edge-9bfdc",
    storageBucket: "edge-9bfdc.appspot.com",
    messagingSenderId: "355324997674"
};
firebase.initializeApp(config)

var database = firebase.firestore()
database.settings({
    timestampsInSnapshots: true
})

const gamePath = 'game'
const historyPath = 'history'

var args = process.argv.slice(2)

let numRounds = args[0]

// create 10 players
let players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']
for (var i = players.length - 1; i >= 0; i--) {
    addPlayerToGame(players[i])
}

// listen for updates
database.collection(gamePath)
    .onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
            if (change.type === "modified") {
                console.log("Player update received from firebase for player " + change.doc.id + " with update", change.doc.data())
            }
        })
    })

// call simulate
simulateGame()

function addPlayerToGame(playerId) {
    database.collection(gamePath).doc(playerId).set({
        kills: 0,
        deaths: 0,
        hp: 100
    }, {
        merge: true
    })

    // add player to server history if not exists
    let histRef = database.collection(historyPath).doc(playerId)
    histRef.get().then((doc) => {
        if (doc.exists) {
            //console.log('player exists in history')
        } else {
            database.collection(historyPath).doc(playerId).set({
                kills: 0,
                deaths: 0
            }, {
                merge: true
            })
        }
    })
}

function simulateGame() {
    let state = {}

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
        playerStateAfter.name = playerId
        state[playerId] = playerStateAfter
        console.log(playerStateAfter)
        console.log(state)
        database.collection(gamePath).doc(playerId).set({
            kills: playerStateAfter.kills,
            deaths: playerStateAfter.deaths
        }, {
            merge: true
        }).then(function(data) {
            //calculate hp
            var postData = {
                before: playerStateBefore,
                after: playerStateAfter
            }
            var url = 'https://us-central1-edge-9bfdc.cloudfunctions.net/calculateHp'
            var options = {
                method: 'post',
                body: postData,
                json: true,
                url: url
            }
            request(options, function(err, res, body) {
                if (err) {
                    console.error('error calling cloud function: ', err)
                    throw err
                }
            })
        })
    }
}