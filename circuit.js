var drawCircuit = (function() {
  let interval;
  let points = [];
  let first = [];
  let dir = [];
  let speed = 1;
  let count = 0;
  let max = 1000;
  let dirs = [{x: 1, y:0}, {x: 0, y:-1}, {x: -1, y:0}, {x: 0, y:1}];
  let wait = [];
  let joints = [];

  var init = function() {
    clearInterval(interval);
    points = [];
    first = [];
    dir = [];
    speed = 1;
    count = 0;
    max = 1000;
    wait = [];
    joints = [];
    for (let i=0; i<50; ++i) {
      let f = {x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight};
      points.push(f);
      first.push({x: f.x, y: f.y});
      joints.push(f);
      dir.push(dirs[Math.round(Math.random()*3)]);
      wait[i] = 0;
    }
  }

  var step = function(canvas, ctx) {
    count++;
    ctx.fillStyle = "#70A9A1";
    for (let i in points) {

      points[i].x += (speed - (count / max)) * dir[i].x;
      points[i].y += (speed - (count / max)) * dir[i].y;

      ctx.fillRect(points[i].x, points[i].y, 10, 10);

      if (Math.random() < .01 && wait[i] == 0) {
        let change = dirs[Math.round(Math.random()*3)];
        while (dir[i].x == change.x && dir[i].y == change.y && (dir[i].x == change.x && dir[i].y != change.y) && (dir[i].y == change.y && dir[i].x != change.x))
          change = dirs[Math.round(Math.random()*3)];
        joints.push(points[i]);
        dir[i] = change;
        wait[i] = 100;
      } else if (wait[i] > 0) {
        wait[i]--;
      }
    }

    if (count >= max) {
      clearInterval(interval);
      /*
      let r = 10;
      for (let p in points) {
        ctx.beginPath();
        ctx.arc(points[p].x + r/2, points[p].y + r/2, r, 0, 2*Math.PI, false);
        ctx.fillStyle = "#70A9A1";
        ctx.fill();
      }
      for (let f in first) {
        ctx.beginPath();
        ctx.arc(first[f].x + r/2, first[f].y + r/2, r, 0, 2*Math.PI, false);
        ctx.fillStyle = "#70A9A1";
        ctx.fill();
      }*/
    }
  }

  var search = function(i) {
    let head = points[i];
    for (let j in joints) {
      for (let k in j) {
        if (Math.abs(head.x - 0) < 10) {
          return false;
        }
      }
    }
    return true;
  }

  var start = function(canvas, ctx, d) {
    init();
    interval = setInterval(function() {step(canvas, ctx)}, d);
  }

  return {
    start: start,
    step: step
  };
})();
