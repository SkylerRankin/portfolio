$(document).ready(function() {
  console.log('document loaded');

  var canvas = document.getElementById("poly");
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = $("#title-wrapper").height();
  $(window).resize(function() {
    canvas.width = window.innerWidth;
    canvas.height = $("#title-wrapper").height();
  });

  var canvastimer = setInterval(animations, 10);
  var typetimer = setInterval(addLetters, 250);

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
