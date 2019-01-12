const random = require('lodash')

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

var database = firebase.database()

const gamePath = 'game'
const historyPath = 'history'

var args = process.argv.slice(2)

let numRounds = args[0]

// create 10 players
let players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']
for (var i = players.length - 1; i >= 0; i--) {
    addPlayerToGame(players[i])
}

// listen for hp updates
database.collection(gamePath)
    .onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
            console.log("Change occured ", change.doc.data())
        })
    })

function addPlayerToGame(playerId) {
    database().ref(gamePath + '/' + playerId).set({
        kills: 0,
        deaths: 0,
        hp: 100
    }, {
        merge: true
    })

    // add player to server history if not exists
    let histRef = db.collection(historyPath).doc(playerId)
    histRef.get().then((doc) => {
        if (doc.exists) {
            console.log('player exists in history')
        } else {
            database().ref(historyPath + '/' + playerId).set({
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
        let playerState = state.playerId

        if (playerState == undefined) {
            playerState = {
                kills: 0,
                deaths: 0
            }
            state.playerId = playerState
        }
        let toss = random.random(0, 1)
        if (toss == 0) {
            playerState.kills = playerState.kills + 1
        } else {
            playerState.deaths = playerState.deaths + 1
        }

        database().ref(gamePath + '/' + playerId).set({
            kills: playerState.kills,
            deaths: playerState.deaths
        }, {
            merge: true
        })
    }

}