Parse.Cloud.define("calcHp", function(req) {
    const data = req.params.after
    const before = req.params.before
    const playerId = data.name

    if (data.kills == before.kills && data.deaths == before.deaths) {
        console.log('before after same')
        return
    }

    let histKills = 0
    let histDeaths = 0
    let query = new Parse.Query('HistPlayer')
    query.equalTo("name", playerId)

    query.first().then(function(history) {
        //console.log('history is ' + JSON.stringify(history))
        if (history === undefined) {
            return
        }
        histKills = history.get("kills")
        histDeaths = history.get("deaths")

        // calculate HP
        let hp = 100
        let totalDeaths = histDeaths + data.deaths
        let totalKills = histKills + data.kills
        if (totalDeaths != 0 && totalKills > totalDeaths) {
            let ratio = totalKills / totalDeaths
            hp = hp * ratio
        }

        console.log('calculated hp is: ' + hp)

        // update game
        let query1 = new Parse.Query('Player')
        query1.equalTo("name", playerId)
        query1.first().then(function(player) {
            player.set("hp", hp)
            player.save()
                .then((plr) => {
                    console.log('Updated hp for player: ' + playerId)
                }, (error) => {
                    console.log("Error updating hp for player: " + playerId, error)
                })
        })

        // update history
        let query2 = new Parse.Query('HistPlayer')
        query2.equalTo("name", playerId)
        query2.first().then(function(player) {
            player.set("kills", totalKills)
            player.set("deaths", totalDeaths)
            player.save()
                .then((plr) => {
                    console.log('Updated history for player: ' + playerId)
                }, (error) => {
                    console.log("Error updating history for player: " + playerId, error)
                })
        })
    }).catch(function(error) {
        console.log("Error getting history", error)
    })
    return 0
})