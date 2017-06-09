import Morph from "./Morph.js"

import { Graph } from 'src/client/triples/triples.js';
import lively from 'src/client/lively.js';

export default class AddKnot extends Morph {

  async initialize() {
    this.windowTitle = "Add Knot";

    let title = this.get("#title");
    title.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.save();
      }
    });
    
    let button = this.get('#save');
    button.addEventListener('click', event => this.save());
  }
  
  async save() {
    let graph = Graph.getInstance();
    
    let directory = this.get('#directory').value;
    let title = this.get('#title').value;
    let fileEnding = this.get('#file-ending').value;

    graph.createKnot(directory, title, fileEnding);
    
    return;

    // open the created knot in knot view
    let knotView = await lively.openComponentInWindow("knot-view");
    knotView.loadKnotForURL(knot.url);
  }
}