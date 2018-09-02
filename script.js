var canvastimer;

$(document).ready(function() {
  console.log("ready");
  styling();
  listeners();
  var typetimer = setInterval(addLetters, 250);
  function addLetters() {
    if (!type()) clearInterval(typetimer);
  }

  var type = (function(title) {
    var letters = ['S', 'K', 'Y', 'L', 'E', 'R', '_', 'R', 'A', 'N', 'K', 'I', 'N'];
    var position = 0;
    return function() {
      if (position < letters.length) {
          title.append(letters[position]);
        position++;
        return true;
      } else {
        return false;
      }
    };
  })($("#name"));

});

function styling() {
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  $("#title_wrapper").css("height", window.innerHeight);
  ctx.fillStyle = "#40798C";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  $("#title").css("top", window.innerHeight/2);
  $("#subtitle").css("top", window.innerHeight / 2 + 100);
  setTimeout(function() {$("#resume").fadeTo(3000, 1);}, 2000);
  setTimeout(function() {$("#github").fadeTo(3000, 1);}, 3000);
  setTimeout(function() {$("#email").fadeTo(3000, 1);}, 4000);

  let w = window.innerWidth;
  console.log()
  $('.grid').masonry({ itemSelector: '.grid-item', columnWidth: ".grid-sizer", percentPosition: true, gutter: 10});

  drawCircuit.start(canvas, ctx, 10);
};

function listeners() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  $(window).resize(function() {
  });

  $("#resume").on("click", function() {
    console.log("resume onclick");
     window.open('resume2.pdf');
  });

}

function loadTiles() {
  
}
/*

#1B2A41
#0C1821
#CCC9DC
-
#0B2027
#40798C
#70A9A1
#CFD7C7
#F6F1D1

*/
