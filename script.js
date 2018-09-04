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
  loadTiles();
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
  //$('.grid').masonry({ itemSelector: '.grid-item', columnWidth: ".grid-sizer", percentPosition: true, gutter: 10});

  drawCircuit.start(canvas, ctx, 10);
};

function listeners() {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  $(window).resize(function() {
    let w = ($("#tiles").width() - 20) / 3;
    $(".grid-sizer").css("width", w);
    $(".grid-item").css("width", w);
    $('.grid').masonry({ itemSelector: '.grid-item', columnWidth: ".grid-sizer", percentPosition: true, gutter: 10});

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = "#40798C";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    drawCircuit.start(canvas, ctx, 10);
  });

  $("#resume").on("click", function() {
    console.log("resume onclick");
     window.open('resume2.pdf');
  });

}

function loadTiles() {
  $.getJSON("https://raw.githubusercontent.com/SkylerRankin/portfolio/gh-pages/project_data.json", function(data) {
    let wrapper = document.getElementById("tiles");
    console.log("loading project tiles");
    data.forEach(function(tile) {

      let root = document.createElement("div");
      root.className = "grid-item";

      let title = document.createElement("h3");
      title.innerHTML = tile["title"];
      title.className = "project-title";

      let date = document.createElement("span");
      date.innerHTML = tile["date"];
      date.className = "project-date";
      title.appendChild(date);

      let description = document.createElement("p");
      description.innerHTML = tile["description"];
      description.className = "project-description"

      var image = document.createElement("img");
      image.src = tile["image"];
      image.className = "project-image";

      var link = document.createElement("a");
      link.className = "project-link";
      link.innerHTML = tile["link"];
      link.href = tile["link"];
      link.target = "_blank";

      root.appendChild(title);
      root.appendChild(description);
      root.appendChild(image);
      root.appendChild(link);
      wrapper.appendChild(root);
    });



    $("#tiles").imagesLoaded(function() {
      let w = ($("#tiles").width() - 20) / 3;
      $(".grid-sizer").css("width", w);
      $(".grid-item").css("width", w);
      $('.grid').masonry({ itemSelector: '.grid-item', columnWidth: ".grid-sizer", percentPosition: true, gutter: 10});
    });
  });
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
