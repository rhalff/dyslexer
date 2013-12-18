var FBPBuilder = function() {
  this.currentLink = {};
  this.data = undefined;
};

FBPBuilder.prototype.parseProcess = function(proc) {

  var c = {}, metadata,
    ret = proc.match(/([\w_]+)\(?([A-z_:]*)\)?/);

  var processName = ret[1],
    component = ret[2];

  if(component && component !== '') {

    // check for meta data
    var m = component.split(':');

    if(m.length === 1) {
      c.component = component;
    } else {
      c.component = m.shift();
      metadata = m;
    }

    c.process = processName;

    // register node
    this.renderer.addNode(c, metadata);

    // maybe also notify if node is refered to.
  }

  return processName;

};

FBPBuilder.prototype.addRenderer = function(renderer) {
  this.renderer = renderer;
};

FBPBuilder.prototype.handleToken = function(tokens, line) {

  var processName;

  this.currentLink = {};
  var in_port;
  var out_port;
  var process;

  tokens.forEach(function(token) {

    switch(token.name) {
      case 'DATA':
        this.data = token.value.replace(/['"]/g, '');
        break;
      case 'IN_PORT':
        in_port = token.value;
        break;
      case 'OUT_PORT':
        out_port = token.value;
        break;
      case 'PROCESS':

        this.currentLink = {};
        if(in_port) {
          this.currentLink.in = in_port;

          if(process) {
            this.currentLink.source = process;
          }

          process = this.parseProcess(token.value);
          this.currentLink.target = process;

          if(out_port) {
            this.currentLink.out = out_port;
          }

          if(this.data !== undefined) {
            this.currentLink.data = this.data;
            this.data = undefined;
          }

          this.renderer.addLink(this.currentLink);
          console.log('NEW LINK', this.currentLink);
          this.currentLink = {};
        } else {
          // first, just register the process
          process = this.parseProcess(token.value);
        }

        break;

      case 'COMMENT':
        // ignore comments
        break;

      case 'EXPORT':

        var match = token.value.match(/^\s*EXPORT=(.*)/);

        var e  = match[1].split(':'),
          pp = e[0].split('.');

        this.renderer.addExport({
          name: e[1],
          process: pp[0],
          port: pp[1]
        });

        break;
      // case  'ARROW':
    }

  }.bind(this));

};

module.exports = FBPBuilder;
