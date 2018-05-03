// This is a module which helps us interact with the scraper
// It exposes one public function, 'fetchUserInfoFromFCC' that takes a github username and a callback function
// 'fetchUserInfoFromFCC' will call the callback function and pass in a success/failure flag into the callback.
//     if successful, the results of the api call should also be included as second parameter into the callback
var request = require('request');

// const fccBaseUrl = process.env.SCRAPER_URL;
const fccBaseUrl = 'https://infinite-bayou-40530.herokuapp.com/?user=';

function fetchUserInfoFromFCC(githubName, callback) {
    request.get(fccBaseUrl + githubName, function (error, response, body){
          console.log("Received scraper response");

          if (error) {
               console.log("Error: " + error);
               callback(true, {error: error});
               return;
          }

          if (response.statusCode != 200) {
               console.log("Error: status code: " + response.statusCode);
               callback(true, {error: JSON.parse(body)});
               return;
          }

          var fccResults = JSON.parse(body);
          fccResults.daysInactive = computeDaysInactive(fccResults.completedChallenges);
          callback(false, fccResults);
     });
}

function findMostRecentCompletedChallenge(completedChallenges) {
    var mostRecentDate = new Date ("Jan 1, 1980");

    for (var challenge of completedChallenges) {
        var completedDate = new Date(challenge.completed_at);
        var updatedDate = new Date(challenge.updated_at);
        var lastActiveDate = completedDate;
        if (updatedDate > completedDate) {
          lastActiveDate = updatedDate;
        }
        if (lastActiveDate > mostRecentDate) {
            mostRecentDate = lastActiveDate;
        }
    }

    return mostRecentDate;
}

function computeDaysInactive(completedChallenges) {
    if (completedChallenges.length == 0) {
        return "N/A";
    }

    var mostRecentDate = findMostRecentCompletedChallenge(completedChallenges);
    var currentDate = new Date();
    var daysInactive = (currentDate - mostRecentDate) / (1000 * 60 * 60 * 24);
    console.log('days inactive: ', daysInactive);
    daysInactive = Math.floor(daysInactive);
    return daysInactive;
}

exports.fetchUserInfoFromFCC = fetchUserInfoFromFCC;
