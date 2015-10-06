l4.importScripts('src/sw/core.js');
l4.importScripts('src/sw/fetch.js');

l4.importScripts('src/sw/messaging-tasks/github/github.js');

l4.importScripts('src/external/focalStorage.js');

//l4.importScripts('src/sw/messaging-tasks/github/credentials.js');


(function() {

    var expression = /^(https:\/\/github.lively4\/)/;

    l4.fetchTask('fetch github', l4.urlMatch(expression), function(event) {
        var request = event.request

        console.log('GitHub fetch: ', request.url);

        return focalStorage.getItem("githubToken").then(function(githubToken) {
            if (! githubToken) {
                console.log("githubToken not found")
                return new Response("No GitHub access token available.", { "status" : 404 , "statusText" : "Not found." })
            }

            return new Promise(function(resolve, reject) {
                console.log('got githubCredentials');

                var githubCredentials = {
                    token: githubToken,
                    auth: 'oauth' 
                }
                var s = request.url.replace(expression, '');
                var exp = new RegExp("([^/]*)/([^/]*)/([^/]*)/([^/]*)/(.*)")
                var match = exp.exec(s)



                // Example: https://github.lively4/repo/livelykernel/lively4-core/gh-pages/README.md
                                
                var username = match[2],
                    reponame = match[3],
                    branch = match[4],
                    path = match[5]
                
                var message = {
                    topLevelAPI: match[1],
                    topLevelArguments: [username, reponame],
                    method: 'read',
                    args: [branch, path]
                }

                var topLevelAPIMapping = {
                    issues: 'getIssues',
                    repo: 'getRepo',
                    user: 'getUser',
                    gist: 'getGist'
                };

                var callback = function(err, data) {
                    console.log(err, data);

                    if(err) {
                        l4.broadCastMessage(err);
                        resolve(new Response("Error" + err))
                    }  else {
                        resolve(new Response(data))
                    }
                };

                var credentials = githubCredentials,
                    github = new Github(credentials),
                    topLevelAPIName = topLevelAPIMapping[message.topLevelAPI],
                    topLevelAPIFunction = github[topLevelAPIName],
                    apiObject = topLevelAPIFunction.apply(github, message.topLevelArguments),
                    methodName = message.method,
                    methodFunction = apiObject[methodName],
                    args = message.args.concat(callback);

                methodFunction.apply(apiObject, args);
            });
        }).catch(function(err) {
                console.log("focalStorage Error: " + err)
                return // Error ??
        })

    });
})();