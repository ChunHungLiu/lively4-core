import Morph from './Morph.js';
import {pt} from "src/client/graphics.js"

import Selecting from "src/client/morphic/selecting.js"

import GrabItem from "templates/lively-halo-grab-item.js"

import Preferences from 'src/client/preferences.js';

/*
 * Classic old Morphic-like drag and drop of graphical elements
 */

export default class LivelyHand extends Morph {
  
  initialize() {
    
    this.setAttribute("data-lively4-donotpersist","all");
    lively.removeEventListener("Hand", this.outerWorldContext())
    lively.addEventListener("Hand", this.outerWorldContext(), "pointerdown", 
      e => this.onPointerDown(e))
  }

  get info() {
    return this.get("#info")
  }


  outerWorldContext() {
    var world = this.worldContext()
    return world.isWorld ? 
     world :
     document.body.parentElement
  }


  worldContext() {
    return this.parentNode || document.body
  }
  
  grab(element) {
    this.drop() 
    var pos = lively.getGlobalPosition(element)
    this.appendChild(element)
    lively.setGlobalPosition(element, pos)
  } 

  drop() {
    this.childNodes.forEach(element => {
      var pos = lively.getGlobalPosition(element)
      var droptarget = this.dropTarget || this.worldContext()
      droptarget.appendChild(element)
      lively.setGlobalPosition(element, pos)
    })
  } 

  elementUnderHand(evt) {
    
    var path = evt.path.slice(evt.path.indexOf(evt.srcElement))
        .filter(ea => ! Selecting.isIgnoredOnMagnify(ea) 
           && GrabItem.canDropInto(this, ea)
          )
    return path[0]
  }

  startGrabbing(target, evt) {
    this.style.display = "block"

    if (evt) {
      lively.setGlobalPosition(this, pt(evt.clientX, evt.clientY));
    
    }
    lively.addEventListener("Hand", document.body.parentElement, "pointermove", 
        e => this.onPointerMove(e))
    lively.addEventListener("Hand", document.body.parentElement, "pointerup", 
        e => this.onPointerUp(e))
    this.grab(target)
  }

  onPointerDown(evt) {
    // document.body.parentElement.setPointerCapture(evt.pointerId)
    if (evt.altKey && !Preferences.get("DisableAltGrab")) {
    window.LastEvent2 = evt

      var target = this.elementUnderHand(evt)
      if (!target) return;
      // lively.notify("grab this" + target)
      evt.preventDefault()
      this.startGrabbing(target, evt)
    }
    // this.offset = lively.globalPosition(this)
  }
  
  onPointerMove(evt) {

    if (this.dropIndicator) this.dropIndicator.remove()
    this.dropTarget = this.elementUnderHand(evt)
    if (this.dropTarget) {
      this.dropIndicator = lively.showElement(this.dropTarget)
      this.dropIndicator.style.border = "3px dashed rgba(0,100,0,0.5)"
      this.dropIndicator.innerHTML = ""
    }
    lively.setGlobalPosition(this, pt(evt.clientX, evt.clientY))
  }
 
  onPointerUp(evt) {
    if (this.dropIndicator) this.dropIndicator.remove()

    // document.body.parentElement.releasePointerCapture(evt.pointerId)
    lively.removeEventListener("Hand", document.body.parentElement, "pointermove")
    lively.removeEventListener("Hand", document.body.parentElement, "pointerup")
    this.drop()
    this.style.display = "none"
  }

  static migrate() {
    var hand = document.body.querySelector(":scope > lively-hand")
    if (hand) {
      hand.remove()
      lively.hand // lazy... reinitialize
    }
  }
  
}

LivelyHand.migrate()


