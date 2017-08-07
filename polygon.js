var center = {
  x: 100,
  y: 300,
  z: 50
};
var nodes = [

  new node(200, 200, 100, center),
  new node(0, 400, 100, center),
  new node(0, 200, 100, center),
  new node(200, 400, 100, center),

  new node(200, 200, -100, center),
  new node(0, 400, -100, center),
  new node(0, 200, -100, center),
  new node(200, 400, -100, center),

  new node(100, 500, 0, center),
  new node(300, 300, 0, center),
  new node(-100, 300, 0, center),
  new node(100, 100, 0, center),

  new node(100, 300.1, -200, center),
  new node(100.1, 300, 200, center),

];

nodes.forEach(function(node) { node.init(); });

function background() {
  var canvas = document.getElementById('poly');
  var ctx = canvas.getContext('2d');
  var grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgb(60, 76, 109)');
  grad.addColorStop(1, 'rgb(60, 109, 97)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
function node(_x, _y, _z, center){
  this.center = center;
  this.angle = 0;
  this.radius;
  this.x = _x;
  this.y = _y;
  this.z = _z;

  this.init = function() {
    this.radius = Math.sqrt(Math.pow(this.x - center.x, 2) + Math.pow(this.y - center.y, 2));
    this.angle = Math.atan((this.y - center.y)/(this.x - center.x));
    if (this.x - center.x < 0) {
      this.angle = Math.PI + this.angle;
    } else (this.y - center.y < 0 && this.x - center.x > 0)
      this.angle = (2*Math.PI) - this.angle;
  }
  this.rotate = function() {
    this.x = this.radius * Math.cos(this.angle) + center.x;
    this.y = this.radius * Math.sin(this.angle) + center.y;
  };
  this.draw = function(ctx) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(this.x, this.z + center.z, this.y.map(130, 500, 1, 4), 0, Math.PI*2);
    //ctx.arc(this.x, this.z + center.z, 10, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();
  };

  this.distanceTo = function(node) {
    if (arguments.length === 0)
    return Math.sqrt(Math.pow(this.x - center.x, 2) + Math.pow(this.y - center.y, 2));
    return Math.sqrt(Math.pow(this.x - node.x, 2) + Math.pow(this.y - node.y, 2));
  };

};

function animations() {
  var canvas = document.getElementById('poly');
  var ctx = canvas.getContext('2d');
  background();
  nodes.forEach(function(node) {
    node.rotate(node.angle);
    node.angle += .005;
    node.draw(ctx);
  });

  var center = {x: 100, y: 300, z: 50};
  var lines = [0, 13, 1, 13, 2, 13, 3, 13,
               4, 12, 5, 12, 6, 12, 7, 12,
               0, 11, 2, 11, 4, 11, 6, 11,
               1, 10, 2, 10, 6, 10, 5, 10,
               3, 8, 1, 8, 5, 8, 7, 8,
               0, 9, 3, 9, 7, 9, 4, 9,

  ];

  ctx.strokeStyle = 'white';
  //ctx.lineWidth = .2;

  for (var i=0; i < lines.length; i+=2) {

    ctx.lineWidth = nodes[lines[i]].y.map(90, 490, .1, .5);
    ctx.beginPath();
    ctx.moveTo(nodes[lines[i]].x, nodes[lines[i]].z+center.z);
    ctx.lineTo(nodes[lines[i+1]].x, nodes[lines[i+1]].z+center.z);
    ctx.closePath();
    ctx.stroke();
  }

};

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};
