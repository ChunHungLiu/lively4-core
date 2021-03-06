
import Morph from './Morph.js';

import * as nodes from 'src/client/morphic/node-helpers.js';
import * as events from 'src/client/morphic/event-helpers.js';
import {pt, rect} from 'src/client/graphics.js';

export default class Selection extends Morph {
  
  get isMetaNode() { return true}
  get isSelection() { return true}
 
  static async load() {
    if (!window.lively) {
      return setTimeout(() => {Selection.load()}, 100) // defere
    }
    if (!this.current){
      this.current = document.createElement("lively-selection")
      lively.components.openInBody(this.current)
      this.current.remove()
    }
    
    lively.removeEventListener("Selection", document.body.parentElement)
    lively.addEventListener("Selection", document.body.parentElement, "mousedown", 
      e => Selection.current.onPointerDown(e))  // select in bubling phase ...
  }
 
  initialize() {
    // super.initialize()
    this.nodes = [];
    this.startPositions = new Map();
    this.originalExtents = new Map();
    this.originalOffset = new Map();
  }

  onPointerDown(evt) {
    if (evt.ctrlKey || evt.altKey) return;
    if (lively.hand && lively.hand.childNodes.length > 0) return; // in drag
    if (this.disabled) return
    
    this.selectionOffset = pt(evt.clientX, evt.clientY)

    lively.addEventListener("Selection", document.body.parentElement, "pointermove", 
      e => this.onPointerMove(e))
    lively.addEventListener("Selection", document.body.parentElement, "pointerup", 
      e => this.onPointerUp(e))

    this.context = document.body;
    // if (window.that && that !== this 
    //     && HaloService.areHalosActive()
    //     && !that.isMeta) {
    //   this.context = that;
    // }
    this.nodes = [];
    evt.preventDefault()
  }

  onPointerMove(evt) {
    var evtPos =  pt(evt.clientX, evt.clientY);

    if (!this.parentElement) {  
      document.body.appendChild(this)
      lively.setGlobalPosition(this, this.selectionOffset);
    }

    // if (evtPos.eqPt(pt(0,0))) {
    //   return; // last drag... is wiered. Is it a bug?
    // } 
    
    var topLeft = this.selectionOffset.minPt(evtPos);
    var bottomRight = this.selectionOffset.maxPt(evtPos);
  
    // lively.showPoint(topLeft)
    // lively.showPoint(bottomRight)
  
    this.selectionBounds = rect(topLeft, bottomRight);



    lively.setGlobalPosition(this,  topLeft);
    lively.setExtent(this, bottomRight.subPt(topLeft));
  
    this.nodes = Array.from(this.context.childNodes)
      .filter( ea => {
        return !ea.isMetaNode
      })
      .filter( ea => {
      if (!ea.getBoundingClientRect || ea.isMetaNode) return false;
      var r = ea.getBoundingClientRect();
      var eaRect = rect(r.left, r.top,  r.width, r.height);
      // if (this.selectionBounds.containsRect(eaRect))
      //   console.log("ea: " + this.selectionBounds + " "  + eaRect)
      return this.selectionBounds.containsRect(eaRect);
    });

    // lively.notify("drag " + this.context +" "+ this.nodes.length);
    

  }

  onPointerUp(evt) {
    lively.removeEventListener("Selection", document.body.parentElement, "pointermove")
    lively.removeEventListener("Selection", document.body.parentElement, "pointerup")

    
    if (this.nodes.length > 0) {
      var minP=this.selectionBounds.bottomRight(); 
      var maxP=this.selectionBounds.topLeft();
        
      this.nodes.forEach( ea => {
        var r = ea.getBoundingClientRect();
        var eaRect = rect(r.left, r.top,  r.width, r.height);
        minP = eaRect.topLeft().minPt(minP);
        maxP = eaRect.bottomRight().maxPt(maxP);
      });
      lively.setGlobalPosition(this, minP);
      lively.setExtent(this, maxP.subPt(minP));
    
      window.that=this;
      setTimeout(()=> {
        HaloService.showHalos(this);
      },0 )
    } else {
      this.remove();
    }
    // console.log("drag end")

  }


  haloRemove() {
    this.nodes.forEach(ea => {
      console.log("selection.remove " + ea);
      ea.remove();
    });
    this.remove();
  }

  haloCopyObject(haloItem) {
    this.nodes = this.nodes.map(ea => {
      var copy = ea.cloneNode();
      ea.parentNode.appendChild(copy); 
      return copy;
    }).filter( ea => ea);
    return this;
  }
 
 
  haloDragStart(fromPos) {
    this.startPositions = new Map();
    this.nodes.concat([this]).forEach(ea => {
      this.startPositions.set(ea, nodes.getPosition(ea));
    })
 }
 
  haloDragTo(toPos, fromPos) {
    var delta = toPos.subPt(fromPos);
    this.nodes.concat([this]).forEach(ea => {
      nodes.setPosition(ea, this.startPositions.get(ea).addPt(delta));
    });
    window.that = this
    HaloService.showHalos(this);
  }
 
  haloGrabStart(evt, haloItem) {
    if (haloItem.isCopyItem) {
      console.log("copy items...");
      this.haloCopyObject(haloItem);
    }
    
    this.startPositions.set(this, nodes.globalPosition(this));
    this.nodes.forEach( ea => {
      ea.classList.add("lively4-grabbed")
      var pos = nodes.globalPosition(ea);
      this.startPositions.set(ea, pos);
      document.body.appendChild(ea);
      ea.style.position = 'absolute';
      nodes.setPosition(ea, pos);
    });
  }
  
  haloGrabMove(evt, grabHaloItem) {
    this.haloDragTo(events.globalPosition(evt), this.startPositions.get(this));
  }
  
  haloGrabStop(evt, grabHaloItem) {
   var positions = new Map();
    // first add temorarily to selection ... so that we do not drop into each other
    this.nodes.forEach( ea => {
      ea.classList.remove("lively4-grabbed")
      positions.set(ea, nodes.globalPosition(ea));
      this.appendChild(ea);
    });

    var dropTarget = grabHaloItem.droptargetAtEvent(this, evt);

    // then drop into the real target
    dropTarget = dropTarget || document.body; // we have to drop somewhere
    var i=0;
    var offset = nodes.globalPosition(dropTarget);
    this.nodes.forEach( ea => {
      dropTarget.appendChild(ea);
      ea.style.position = "absolute";
      
      var pos = positions.get(ea);
      if (dropTarget.localizePosition) {
        pos = dropTarget.localizePosition(pos);
      } else {
        pos = pos.subPt(offset);
      }
      nodes.setPosition(ea, pos);
    });
    HaloService.showHalos(this);
  }
  
  haloResizeStart(evt, haloItem) {
    this.eventOffset = events.globalPosition(evt);
    this.nodes.concat([this]).forEach( ea => {
       this.startPositions.set(ea, nodes.globalPosition(ea));
       this.originalExtents.set(ea, nodes.getExtent(ea));
       this.originalOffset.set(ea, nodes.globalPosition(this).subPt(
        nodes.globalPosition(ea.parentNode)));
    });
  }
  
  haloResizeMove(evt, haloItem) {
    var delta = events.globalPosition(evt).subPt(this.eventOffset)
    var newExtent = this.originalExtents.get(this).addPt(delta)
  
    var oldExtent = this.originalExtents.get(this)
    var scale = newExtent.scaleBy(1/ oldExtent.x, 1/oldExtent.y)
    
    //nodes.setExtent(ea, this.originalExtents.get(ea).scaleByPt(scale))
    nodes.setExtent(this, newExtent)
    
    this.nodes.forEach( ea => {
      var oldRelativePos = this.startPositions.get(ea).subPt(this.startPositions.get(this)) 
      
      lively.showPoint(this.originalOffset.get(ea))  
      
      nodes.setPosition(ea, this.originalOffset.get(ea).addPt(oldRelativePos.scaleByPt(scale)))
      nodes.setExtent(ea, this.originalExtents.get(ea).scaleByPt(scale))               
    });
  }
  
  haloResizeStop(evt, haloItem) {
    
  }
  
  
}  

Selection.load()

