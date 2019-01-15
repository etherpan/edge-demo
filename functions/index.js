const admin = require('firebase-admin')
const functions = require('firebase-functions')
const gamePath = 'game'
const historyPath = 'history'

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
const settings = {
    timestampsInSnapshots: true
}
db.settings(settings)

exports.calculateHp = functions.https.onRequest((req, res) => {
	console.log('request is', req)
	console.log('body is', req.body)
    const data = req.body.after
    const before = req.body.before

    const player = data.name

    //ignore if only change is hp
    if (data.kills == before.kills && data.deaths == before.deaths) {
        return
    }

    const histRef = db.collection(historyPath).doc(player)
    let histKills = 0
    let histDeaths = 0

    histRef.get().then(function(doc) {
        if (doc.exists) {
            histKills = doc.data().kills
            histDeaths = doc.data().deaths

            // calculate HP
            let hp = 100
            let totalDeaths = histDeaths + data.deaths
            let totalKills = histKills + data.kills
            if (totalDeaths != 0 && totalKills > totalDeaths) {
                let ratio = totalKills / totalDeaths
                hp = hp * ratio
            }

            console.log('calculated hp for player ' + player + ' is: ' + hp)

            // update game
            db.collection(gamePath).doc(player).set({
                hp: hp
            }, {
                merge: true
            }).then(function(doc) {
                console.log('Updated hp for player: ' + player)
            }).catch(function(error) {
                console.log("Error updating hp for player: " + player, error)
            })

            // update history
            db.collection(historyPath).doc(player).set({
                kills: totalKills,
                deaths: totalDeaths
            }, {
                merge: true
            }).then(function(doc) {
                console.log('Updated history for player: ' + player)
            }).catch(function(error) {
                console.log("Error updating history for player: " + player, error)
            })

        } else {
            //console.log("No such document!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error)
    })
})