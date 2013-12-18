'use strict';

var Renderer = function() {

  this.flow = {
    connections: [],
    processes: {},
    exports: []
  };

};

Renderer.prototype.addNode = function(c, metadata) {

  this.flow.processes[c.process] = {
    component: c.component
  };

  if(metadata) {

    this.flow.processes[c.process].metadata = {
      routes: metadata
    };

  }

};

Renderer.prototype.addExport = function(e) {

  this.flow.exports.push({
    'private': [
      e.process,
      e.port
    ].join('.').toLowerCase(),
    'public': e.name.toLowerCase()
  });

};

Renderer.prototype.addLink = function(link) {

  var connection = {};
  connection.tgt = {
    process: link.target,
    port: link.in.toLowerCase()
  };

  if(link.source) {
    connection.src = {
      process: link.source,
      port: link.out.toLowerCase()
    };
  }

  if(typeof link.data !== 'undefined') {
    connection.data = link.data;
  }

  this.flow.connections.push(connection);

};

Renderer.prototype.toJSON = function () {
  return JSON.stringify(this.flow, null, 2);
};

module.exports = Renderer;
