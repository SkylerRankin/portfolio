$(document).ready(function() {
  console.log('document loaded');

  var canvas = document.getElementById("name-anim");
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = $("#title-wrapper").height();
  animations(canvas, ctx);
  $(window).resize(function() {
    canvas.width = window.innerWidth;
  });

  //var canvastimer = setInterval(update, 1000);
  var typetimer = setInterval(addLetters, 250);

  function update() {
    ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 10, 10);
  };

  function addLetters() {
    if (!type()) clearInterval(typetimer);
  }

  var type = (function(title) {
    var letters = ['S', 'K', 'Y', 'L', 'A', '!', 'E', 'R', ' ', 'R', 'A', 'N', 'K', 'I', 'N'];
    var position = 0;
    return function() {
      if (position < letters.length) {
        if (letters[position] === "!")
          title.text("SKYL");
        else
          title.append(letters[position]);
        position++;
        return true;
      } else {
        return false;
      }
    };
  })($("#name"));

  $(".scroll-link").on('click', function() {
    event.preventDefault();
    $("html, body").animate({scrollTop: $(this.hash).offset().top}, 500, function() {console.log('auto scroll')});

  });

});

function animations(canvas, ctx) {
  var grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgb(60, 76, 109)');
  grad.addColorStop(1, 'rgb(60, 109, 97)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
