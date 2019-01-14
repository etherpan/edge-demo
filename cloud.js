Parse.Cloud.beforeSave("Player", (request) => {
    //console.log(JSON.stringify(request))
    let query = new Parse.Query('Player')
    let objStr = JSON.stringify(request.object)
    const data = JSON.parse(objStr)
    query.equalTo("name", data.name)

    query.first().then((player) => {
        //console.log('player is ' + JSON.stringify(player))
        if (player === undefined) {
            return
        }
        request.context = {
            before: {
                kills: player.get("kills"),
                deaths: player.get("deaths"),
                hp: player.get("hp")
            }
        }
    }, (error) => {
        console.log('Error retrieving object for player', request.object.name)
    })
})

Parse.Cloud.afterSave("Player", (request) => {
    //console.log(JSON.stringify(request))
    let objStr = JSON.stringify(request.object)
    const data = JSON.parse(objStr)
    const before = request.context.before
    let hp = 100

    const playerId = data.name

    //ignore if only change is hp
    if (before) {
        console.log('--------------------------------before--------------------------------------')
        console.log(data.kills, before.kills, data.deaths, before.deaths)
    }
    if (before && (data.kills == before.kills && data.deaths == before.deaths)) {
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
        if (hp != 100) {
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
        }

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
})