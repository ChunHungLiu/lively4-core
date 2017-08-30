import generateUUID from './../src/client/uuid.js';
import boundEval from './../src/client/bound-eval.js';
import Morph from "./Morph.js"

let loadPromise = undefined;

export default class LivelyCodeMirror extends HTMLElement {

  static get codeMirrorPath() {
     return  "src/external/code-mirror/"
  }
  
  static async loadModule(path) {
    return lively.loadJavaScriptThroughDOM("codemirror_"+path.replace(/[^A-Za-z]/g,""), 
      this.codeMirrorPath + path) // 
  }
  
  static async loadCSS(path) {
    return lively.loadCSSThroughDOM("codemirror_" + path.replace(/[^A-Za-z]/g,""), 
       this.codeMirrorPath + path)
  }
  
  static async loadModules() {
    if (loadPromise) return loadPromise
    
    loadPromise = (async () => {
      await this.loadModule("lib/codemirror.js")

      await this.loadModule("mode/javascript/javascript.js")
      await this.loadModule("mode/markdown/markdown.js")
      await this.loadModule("mode/htmlmixed/htmlmixed.js")

      await this.loadModule("addon/mode/overlay.js")
      await this.loadModule("mode/gfm/gfm.js")

      await this.loadModule("addon/hint/show-hint.js")
      await this.loadModule("addon/hint/javascript-hint.js")
      await this.loadModule("addon/search/searchcursor.js")
      await this.loadModule("addon/search/search.js")
      await this.loadModule("addon/comment/comment.js")
      await this.loadModule("addon/search/jump-to-line.js")
      await this.loadModule("addon/dialog/dialog.js")
      await this.loadModule("keymap/sublime.js")
      await System.import(lively4url + '/templates/lively-code-mirror-hint.js')
  
      this.loadCSS("addon/hint/show-hint.css")
      this.loadCSS("../../../templates/lively-code-mirror.css")
    })()
    return loadPromise
  }

  initialize() {
  	this._attrObserver = new MutationObserver((mutations) => {
	  mutations.forEach((mutation) => {  
        if(mutation.type == "attributes") {
          // console.log("observation", mutation.attributeName,mutation.target.getAttribute(mutation.attributeName));
          this.attributeChangedCallback(
            mutation.attributeName,
            mutation.oldValue,
            mutation.target.getAttribute(mutation.attributeName))
        }
      });
    });
    this._attrObserver.observe(this, { attributes: true });
  }
  
  applyAttribute(attr) {
    var value =this.getAttribute(attr)
    if (value !== undefined) {
      this.setAttribute(attr, value)
    }
  }
  
  async attachedCallback() {
    if (this.isLoading || this.editor ) return;
    this.isLoading = true
    this.root = this.shadowRoot // used in code mirror to find current element
    
    var text = this.childNodes[0];
    var container = this.container;
    var element = this;
      
    await LivelyCodeMirror.loadModules()

    var value
    if (this.textContent) {
      value = this.decodeHTML(this.textContent);
    } else {
      value = this.value || "";
    }

    this.editor = CodeMirror(this.shadowRoot.querySelector("#code-mirror-container"), {
      value: value,
      lineNumbers: true,
      gutters: ["leftgutter", "CodeMirror-linenumbers", "rightgutter"]
    });  
    // mode: {name: "javascript", globalVars: true},
    
    if (this.mode) {
      this.editor.setOption("mode", this.mode);
    }
    
    this.editor.setOption("keyMap",  "sublime")
	this.editor.setOption("extraKeys", {
      "Alt-F": "findPersistent",
      // "Ctrl-F": "search",
      "Ctrl-F": (cm) => {
		// something immediately grabs the "focus" and we close the search dialog..
        // #Hack... 
        setTimeout(() => {
            this.editor.execCommand("findPersistent") 
            this.shadowRoot.querySelector(".CodeMirror-search-field").focus()
        }, 10)
        // this.editor.execCommand("find")
      },
      "Ctrl-/": "toggleCommentIndented",
      "Ctrl-Space": "autocomplete",
      "Ctrl-P": (cm) => {
          let text = this.getSelectionOrLine()
          this.tryBoundEval(text, true);
      },
      "Ctrl-D": (cm) => {
          let text = this.getSelectionOrLine()
          this.tryBoundEval(text, false);
      },
      "Ctrl-S": (cm) => {          
        this.doSave(this.editor.getValue());
      },
    });
    this.editor.setOption("hintOptions", {
      container: this.shadowRoot.querySelector("#code-mirror-hints")
    });
    
    
    this.editor.on("change", evt => this.dispatchEvent(new CustomEvent("change", {detail: evt})))
    this.isLoading = false
    this.dispatchEvent(new CustomEvent("editor-loaded"))
    
	// apply attributes 
    _.map(this.attributes, ea => ea.name).forEach(ea => this.applyAttribute(ea)) 
  };

   // Fires when an attribute was added, removed, or updated
  attributeChangedCallback(attr, oldVal, newVal) {
    if(!this.editor){
        return false;
    }
    switch(attr){
      // case "theme":
      //     this.editor.setTheme( newVal );
      //     break;
      // case "mode":
      //     this.changeMode( newVal );
      //     break;
      // case "fontsize":
      //     this.editor.setFontSize( newVal );
      //     break;
      // case "softtabs":
      //     this.editor.getSession().setUseSoftTabs( newVal );
      //     break;
      case "tabsize":
		this.setOption("tabSize", newVal)
        break;
      // case "readonly":
      //     this.editor.setReadOnly( newVal );
      //     break;
      case "wrapmode":
        this.setOption("lineWrapping", newVal)
      	break;
    }
  }
  
  setOption(name, value) {
	if (!this.editor) return; // we loose...
    this.editor.setOption(name, value)
  } 
  
  doSave(text) {
    this.tryBoundEval(text) // just a default implementation...
  }

  getSelectionOrLine() {
    var text = this.editor.getSelection()
    if (text.length > 0)
      return text
    else
      return this.editor.getLine(this.editor.getCursor("end").line)
  }
  
  getDoitContext() {
    return this.doitContext
  }

  setDoitContext(context) {
    return this.doitContext = context;
  }

  getTargetModule() {
    return this.targetModule;
  }

  setTargetModule(module) {
    return this.targetModule = module;
  }

  async boundEval(str, context) {
    // Ensure target module loaded (for .js files only)
    // TODO: duplicate with var recorder plugin
    const MODULE_MATCHER = /.js$/;
    if(MODULE_MATCHER.test(this.getTargetModule())) {
      await System.import(this.getTargetModule())
    }

    // src, topLevelVariables, thisReference, <- finalStatement
    return boundEval(str, this.getDoitContext(), this.getTargetModule());
  }

  printResult(result) {
    var editor = this.editor;
    var text = result
    this.editor.setCursor(this.editor.getCursor("end"))
    // don't replace existing selection
    this.editor.replaceSelection(result, "around")

  }

 async tryBoundEval(str, printResult) {
    var resp;
    resp = await this.boundEval(str, this.getDoitContext())
    if (resp.isError) {
      var e = resp.value
      console.error(e)
      if (printResult) {
        window.LastError = e
        this.printResult("" +e)
      } else {
        lively.handleError(e)
      }
      return e
    }
    var result = resp.value
    var obj2string = function(obj) {
      var s = "";
      try {
        s += obj // #HACK some objects cannot be printed any more
      } catch(e) {
        s += "UnprintableObject["+ Object.keys(e) + "]" // so we print something else
      }
      return s
    }
    
    if (printResult) {
      // alaways wait on promises.. when interactively working...
      if (result && result.then) { 
        // we will definitly return a promise on which we can wait here
        result
          .then( result => {
            this.printResult("RESOLVED: " + obj2string(result))
          })
          .catch( error => {
            console.error(error);
            // window.LastError = error;
            this.printResult("Error in Promise: \n" +error)
          })
      } else {
        this.printResult(" " + obj2string(result))
        if (result instanceof HTMLElement ) {
          lively.showElement(result)
        }
      }
    }
    return result
  }
  
  async inspectIt(str) {
    var result =  await this.boundEval(str, this.getDoitContext()) 
    if (!result.isError) {
      lively.openInspector(result.value, null, str)
    }
  }

  doSave(text) {
    this.tryBoundEval(text) // just a default implementation...
  }
  

  detachedCallback() {
    this._attached = false;
  };
  
  get value() {
    if (this.editor) {
      return this.editor.getValue()
    } else {
      return this._value
    }
  }

  set value(text) {
    if (this.editor) {
      this.editor.setValue(text)
    } else {
      this._value = text
    }
  }
  
  setCustomStyle(source) {
    this.shadowRoot.querySelector("#customStyle").textContent = source
  }
  
  getCustomStyle(source) {
    return this.shadowRoot.querySelector("#customStyle").textContent
  }
   
  encodeHTML(s) {
    return s.replace("&", "&amp;").replace("<", "&lt;") 
  }
  
  decodeHTML(s) {
    return s.replace("&lt;", "<").replace("&amp;", "&") 
  }
    
  resize() {
    // #ACE Component compatiblity
  }
    
  enableAutocompletion() {
    // #ACE Component compatiblity
  }
  
  changeModeForFile(filename) {
    
    // lively.notify("change mode for file:" + this.editor)
    // #ACE Component compatiblity
    
    if (!this.editor) return;
    
    var mode = "text"
    // #TODO there must be some kind of automatching?
    if (filename.match(/\.html$/)) {
      mode = "htmlmixed"
    } else if (filename.match(/\.md$/)) {
      mode = "gfm"
    } else if (filename.match(/\.js$/)) {
      mode = "javascript"
    }
    this.mode = mode
    this.editor.setOption("mode", mode)
  }

  livelyPrepareSave() {
    this.textContent = this.encodeHTML(this.editor.getValue())
  }

  livelyPreMigrate() {
    this.lastScrollInfo = this.editor.getScrollInfo(); // #Example #PreserveContext
  }
  
  async livelyMigrate(other) {
    this.addEventListener("editor-loaded", () => {
        this.value = other.value
      	this.editor.scrollTo(other.lastScrollInfo.left, other.lastScrollInfo.top)
    })
  }
  
  find(name) {
    // #TODO this is horrible... Why is there not a standard method for this?
	if (!this.editor) return;
    var found = false;
  	this.value.split("\n").forEach((ea, index) => {
      if (!found && (ea.indexOf(name) != -1)) {
	    this.editor.setCursor(index, 10000);// line end ;-)
        this.editor.focus()
        found = ea;
  	  }
    })
  }
}


// LivelyCodeMirror.loadModules()

