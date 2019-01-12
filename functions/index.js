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

exports.calcHp = functions.firestore.document(gamePath + '/{player}').onUpdate((change, context) => {
    const data = change.after.data()

    const player = context.params.player
    const histRef = db.collection(historyPath).doc(player)
    let histKills = 0
    let histDeaths = 0

    histRef.get().then(function(doc) {
        if (doc.exists) {
            console.log("Document data:", doc.data())
            histKills = doc.data().kills
            histDeaths = doc.data().deaths
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error)
    })

    // calculate HP
    let hp = 1
    if (histDeaths != 0 && histKills > histDeaths) {
    	let ratio = histKills / histDeaths
    	hp = hp * ratio
    }

    // update game
    db.collection(gamePath).doc(player).set({
        hp: hp
    }, {
        merge: true
    })

	// update history
    db.collection(historyPath).doc(player).set({
        kills: histKills + data.kills,
        deaths: histDeaths + data.deaths
    }, {
        merge: true
    })
})