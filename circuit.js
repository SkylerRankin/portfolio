var drawCircuit = (function() {
  let interval;
  let points = [];
  let dir = [];
  let speed = 1;
  let count = 0;
  let max = 1000;
  let dirs = [{x: 1, y:0}, {x: 0, y:-1}, {x: -1, y:0}, {x: 0, y:1}];
  let wait = [];
  let joints = [];

  for (let i=0; i<50; ++i) {
    let f = {x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight};
    points.push(f);
    joints.push(f);
    dir.push(dirs[Math.round(Math.random()*3)]);
    wait[i] = 0;
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
        while (dir[i].x == change.x && dir[i].y == change.y)
          change = dirs[Math.round(Math.random()*3)];
        joints.push(points[i]);
        dir[i] = change;
        wait[i] = 100;
      } else if (wait[i] > 0) {
        wait[i]--;
      }
    }

    if (count >= max)
      clearInterval(interval);
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
    interval = setInterval(function() {step(canvas, ctx)}, d);
  }
  return {
    start: start,
    step: step
  };
})();
