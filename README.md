<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head>
<title>Lively 4 Our First Page</title>
<style type="text/css" media="screen">
    #baseurl { 
        width: 800px;
    }
    #editor { 
        height: 400px;
        width: 800px;
    }
    #console { 
        width: 800px;
        height: 300px;
        max-height: 200px;
        overflow: auto;
        background-color: #eeeeee;
        word-break: normal !important;
        word-wrap: normal !important;
        white-space: pre !important;   
    }
    #commandline { 
        width: 800px;
    }
</style>

<script src="https://code.jquery.com/jquery-2.1.4.js" type="text/javascript" charset="utf-8"></script>


<!-- BEGIN SYSTEM.JS: should go away, until then we use a "static" global source --> 
<script src="https://livelykernel.github.io/lively4-core/src/external/system.src.js" type="text/javascript" charset="utf-8"></script>
<script>
  System.paths['babel'] ='https://livelykernel.github.io/lively4-core/src/external/babel-browser.js'
  System.config({
    transpiler: 'babel',
    babelOptions: { },
    map: {
        babel: 'https://livelykernel.github.io/lively4-core/src/external/babel-browser.js'
    }
  });
</script>
<!-- END SYSTEM.JS-->
</head>
<body>
<h1>Lively 4 -- Bootstrapping Test Page<script data-name="doGreen" type="lively4script">function (that){this.style.color = 'green'}</script><script data-name="goBackToBlack" type="lively4script">function goBackToBlack(that){this.style.color = "black"}</script><script data-name="goGreen" type="lively4script">function goGreen(that){this.style.color = "green"}</script></h1>

<p><input type="text" id="baseurl" value="https://github.lively4/repo/livelykernel/lively4-core/gh-pages/" /></p>

<button onclick="fileEditor.loadFile()">load</button>
<button onclick="fileEditor.saveFile()">save</button>
<input type="text" id="filename" value="README.md" />

<!-- <button onclick="">reload service worker </button> -->

<button onclick="githubAuth.challengeForAuth(Date.now(), function(token){
    console.log('We are authenticated with the Token: ' + token)
})">login</button>

<button onclick="githubAuth.logout(); console.log('logged out of github')">logout</button>

<div id="editor" class=" ace_editor ace-tm" draggable="false"></div>

<pre id="console"></pre>
<input type="text" id="commandline" value="" />

<!-- BEGIN ACE -->
<!-- We also have to load ace "locally", because loading it remotely ends in a race condition -->
<script src="../src/external/ace.js" type="text/javascript" charset="utf-8"></script>
<script>ace.edit("editor");</script>
<!-- END ACE -->


<script>
    var lively4url =  "../" // or any abosolute path to lively4 ? Any idea for computeRoot() ? #JensLincke #OpenQuestion

    //// #TODO The ace editor tries to be very clever, so it cannot be loaded through "import" at the moment 
    //// (e.g. AMD promise error)
    // System.import(lively4url + "src/external/ace.js").then(function(){
    //         ace.edit("editor")
    // })
        
    System.import(lively4url + "/src/client/load.js").then(function(){
        System.import("commandline.js")
        System.import(lively4url + "src/client/debug-serviceworker.js")    
    }).catch(function(err) { alert("load Lively4 failed")})
</script>

</body></html>