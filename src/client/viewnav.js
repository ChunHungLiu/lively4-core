import {pt} from './graphics.js';
import Preferences from './preferences.js';
import Windows from "templates/lively-window.js"


/*
 * Implements World (html body) panning!
 */

export default class ViewNav {
  
  constructor(target) {
    this.target = target
  }
  
  static enable(container) {
    
    if (container.viewNav) {
       container.viewNav.disable()
    }
    container.viewNav = new ViewNav(container)
    container.viewNav.enable()
  }
  
  enable() {
    this.eventSource =  document.body.parentElement
    lively.addEventListener("ViewNav", this.eventSource, "pointerdown", e => this.onPointerDown(e))

    lively.addEventListener("ViewNav", window, "resize", e => this.onResize(e))
    lively.addEventListener("ViewNav", window, "mousewheel", e => this.onMouseWheel(e))
    lively.addEventListener("ViewNav", window, "scroll", () => ViewNav.updateDocumentGrid())

  }
  
  disable() {
    lively.removeEventListener("ViewNav", this.eventSource)
    lively.removeEventListener("ViewNav", window, "resize")
    lively.removeEventListener("ViewNav", window, "keydown")
    lively.removeEventListener("ViewNav", window, "keyup")
    lively.removeEventListener("ViewNav", window, "mousewheel")
  }
  
  eventPos(evt) {
    return pt(evt.clientX, evt.clientY)
  }

  onPointerMoveZoom(evt) {
    var pos = this.eventPos(evt)
    lively.showPoint(pos)
  }
  
  onPointerDown(evt) {
    if (!evt.ctrlKey || evt.button != 0)
      return;
      
    // if (!Preferences.isEnabled("ShowDocumentGrid", false))
    //   ViewNav.showDocumentGrid(); // 
    this.eventOffset = this.eventPos(evt)
    this.originalPos = lively.getPosition(this.target)
      
    lively.addEventListener("ViewNav", this.eventSource, "pointermove", e => this.onPointerMove(e))
    lively.addEventListener("ViewNav", this.eventSource, "pointerup", e => this.onPointerUp(e))
  }
  
  onPointerMove(evt) {
    var delta = this.eventOffset.subPt(this.eventPos(evt))
    lively.setPosition(this.target, this.originalPos.subPt(delta))
    // lively.notify("pos " + this.originalPos.subPt(delta) + " " + this.target)
    ViewNav.updateDocumentGrid() 
  }
  
  onPointerUp(evt) {
    // if (!Preferences.isEnabled("ShowDocumentGrid", false))
    //   ViewNav.hideDocumentGrid()
    lively.removeEventListener("ViewNav", this.eventSource, "pointermove")
    lively.removeEventListener("ViewNav", this.eventSource, "pointerup")
    this.fixScrollAfterNavigation()
  }
  
  onResize(evt) {
    if (!this.lastScaleTime || (Date.now() - this.lastScaleTime) > 1000) {
      return // there was no previous scale with mouse wheel
    }

    // this.lastPoint = pt(LastEvt.clientX, LastEvt.clientY)
    var scale = window.innerWidth / window.outerWidth
    // lively.notify("scale " + (scale / this.lastScale))

    var newPos = this.lastPoint.scaleBy(scale / this.lastScale)
    var offset = this.lastPoint.subPt(newPos)
    lively.setPosition(document.body, lively.getPosition(document.body).subPt(offset) )

    // lively.showPoint(newPos).style.backgroundColor = "green"

    ViewNav.updateDocumentGrid(true)
    
  }
  
  onMouseWheel(evt) {
    window.LastEvt = evt
    
    
    var bounds = document.body.getBoundingClientRect()
    // lively.notify("wheel bounds " + pt(bounds.left, bounds.top))

    this.lastPoint = pt(evt.clientX, evt.clientY)
    this.lastScale = window.innerWidth / window.outerWidth
    this.lastScaleTime = Date.now()
    
    // lively.showPoint(this.lastPoint).style.backgroundColor = "blue"
    // lively.showPoint(pt(LastEvt.pageX, LastEvt.pageY))
    
    if (evt.altKey) {
      // finder granular zoom? using non standard feature
      var zoom = Number(getComputedStyle(document.body).zoom) + (evt.wheelDelta / 1000 / 10)
      document.body.style.zoom= zoom


      // // zoom using CSS Transform
      // var scale = document.body._scale || 1
      // scale = scale + (evt.wheelDelta / 1000 / 5)
      // document.body._scale = scale
      // document.body.style.transform= "scale(" + scale + ")"
      
      lively.notify("zoom " + zoom)
      evt.preventDefault()
    }
    
  }

  fixScrollAfterNavigation() {
   
    // #DoesNotWork
    // if ((document.body.scrollHeight > document.body.scrollTop + window.innerHeight) ||
    //   (document.body.scrollWidth > document.body.scrollLeft + window.innerWith))
    //   return; // don't fix when scrolled to bottom to let users pan into the void
    
    // console.log("fix scroll ")
    ViewNav.lastFixedScroll = Date.now()
    var pos = lively.getGlobalPosition(document.body).scaleBy(-1)
    var topLeft = pt(0,0).minPt(pos)
    Windows.allWindows().forEach(ea => {
      topLeft = topLeft.minPt(lively.getPosition(ea))
    })
    
    lively.setPosition(document.body, topLeft.scaleBy(-1))
    
    var delta = topLeft.scaleBy(-1).subPt(pos.scaleBy(-1))

    document.body.scrollLeft = delta.x 
    document.body.scrollTop = delta.y
  }


  static showDocumentGridItem(pos, color, border, w, h, parent) {
      var div = document.createElement("div")
      
  		lively.setPosition(div, pos)
  		div.style.backgroundColor = color
  		div.style.border = border
  		div.style.width = w  +"px"
  		div.style.height = h +"px"
  		div.livelyAcceptsDrop = function() {}
  		div.setAttribute("data-lively4-donotpersist", "all")
  		div.style.pointerEvents = "none"
  		div.classList.add("document-grid")
  		parent.appendChild(div)
  		return div
  }
  
  static updateDocumentGrid(zoomed) {
    if (this.lastFixedScroll && (Date.now() - this.lastFixedScroll) < 1000) return
    
    // console.log("update document grid "  + (Date.now() - this.lastFixedScroll) )

    if (!this.documentGrid) return;
    
    if (zoomed) {
      this.hideDocumentGrid()
      this.showDocumentGrid()
    }
    
    
    lively.setGlobalPosition(this.documentGrid, pt(0,0))
    // we make the grid a bit bigger than the actual visible browser window, so that we can scroll into the void...
    lively.setExtent(this.documentGrid, pt(window.innerWidth + 200, window.innerHeight  + 200))
    var pos = lively.getGlobalPosition(document.body)
    var grid = this.documentGrid.grid
    lively.setPosition(grid, pt( pos.x % grid.gridSize - 100, pos.y % grid.gridSize - 100) )
    lively.setGlobalPosition(this.documentGrid.documentSquare, pos)
  }
  
  static showDocumentGrid() {
    this.documentGrid = document.createElement("div")
  	this.documentGrid.style["z-index"] = -200

    this.documentGrid.isMetaNode = true
    this.documentGrid.id = "DocumentGrid"
    this.documentGrid.classList.add("document-grid")
  	this.documentGrid.setAttribute("data-lively4-donotpersist", "all")
  	this.documentGrid.style.overflow = "hidden"
  	this.documentGrid.style.pointerEvents = "none"
  	this.documentGrid.livelyAcceptsDrop = function() {}


    document.body.appendChild(this.documentGrid)

    let gridSize = 100,
      w = window.innerWidth + 1* gridSize,
      h =  window.innerHeight + 1 *gridSize
      
    let grid = document.createElement("div")
    grid.gridSize = gridSize
    grid.isMetaNode = true
    grid.style.pointerEvents = "none"
    grid.livelyAcceptsDrop = function() {}
    
    lively.setExtent(this.documentGrid, pt(window.innerWidth , window.innerHeight))

    this.documentGrid.documentSquare = this.showDocumentGridItem(pt(0, 0), 
          "white", "0.5px solid rgb(50,50,50)", 4000, 2000,  this.documentGrid )

    this.documentGrid.documentSquare.livelyAcceptsDrop = function() {}

    this.documentGrid.grid = grid
    this.documentGrid.appendChild(grid)
    lively.setPosition(grid, pt(0,0))
    
    for (var k=0; k < w; k += gridSize) {
      for (var l=0; l < h; l += gridSize) {
        this.showDocumentGridItem(pt(k, l), 
          undefined, "0.2px dashed rgb(190,190,190)", gridSize, gridSize, grid)
      }  
    }
    ViewNav.updateDocumentGrid()
  }
  
  static hideDocumentGrid() {
    document.body.querySelectorAll(".document-grid").forEach(ea => {
      ea.remove()
    })
  }
  
  static resetView() {
    lively.setPosition(document.body,pt(0,0)) 
  }
} 

if (window.lively) {
  ViewNav.enable(document.body)
  ViewNav.hideDocumentGrid()
  ViewNav.showDocumentGrid()
}


