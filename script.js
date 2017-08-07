var canvastimer;
var typetimer;

$(document).ready(function() {
  styling();
  listeners();

  canvastimer = setInterval(animations, 10);
  typetimer = setInterval(addLetters, 250);

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

  setBorders();
  $('.grid-main').masonry('layout');
  $('.grid-top').masonry('layout');

});

function styling() {

  var canvas = document.getElementById("poly");
  var ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;

  canvas.height = $("#title-wrapper").height();

  var grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgb(60, 76, 109)');
  grad.addColorStop(1, 'rgb(60, 109, 97)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);


  $('.grid').masonry({
    itemSelector: '.grid-item',
    columnWidth: 440,
    gutter: '.gutter' });

  setWidths();
  matchHeights();
}
function listeners() {
  var canvas = document.getElementById('poly');
  var ctx = canvas.getContext('2d');
  $(".scroll-link").on('click', function() {
    event.preventDefault();
    $("html, body").animate({scrollTop: $(this.hash).offset().top}, 500, function() {console.log('auto scroll')});
  });

  $(window).resize(function() {
    setBorders();
    canvas.width = window.innerWidth;
    canvas.height = $("#title-wrapper").height();
    $('.grid-main').masonry('layout');
    $('.grid-top').masonry('layout');
  });
}

function setBorders() {
  var canvas = document.getElementById('poly');
  var ctx = canvas.getContext('2d');

  function getColor(x) {
    var raw = ctx.getImageData(x, 0, 1, 1).data;
    var temp = { r: raw[0], g: raw[1], b: raw[2], x }
    return 'rgb('+temp.r+', '+temp.g+', '+temp.b+')';
  }
  $('.grid-item').each(function() {
    var _start = $(this).offset().left;
    var _end = _start + $(this).width();
    var start = getColor(_start); var end = getColor(_end);
    $(this).css({'border': '6px solid transparent', 'border-image': 'linear-gradient(to right, '+start+' 0%, '+end+' 100%)', 'border-image-slice': '1'});
  });

}
function matchHeights() {
  // TODO: account for margins automatically
  var max = 0;
  $('.grid-item-top').each(function(){
    if ($(this).outerHeight() > max) max = $(this).outerHeight();
  });
  $('.grid-item-top').outerHeight(max-12);
}

function setWidths() {
  var width = $('.section').outerWidth();
  var gap = 6;

  var col3 = (width - (gap*4)) / 3 - 6;
  var col4 = (width - (gap*4)) * 2 / 5 - 6;
  var col2 = (width - (gap*4)) * 2 / 10 - 6;

  //for groups of three
  $('.grid-item--width3').css('width', col3);
  $('.grid-item--width4').css('width', col4);
  $('.grid-item--width2').css('width', col2);
  $('.grid-item-full').css({'width': width-12, 'text-align': 'center'});

  $('.grid-main').masonry({ itemSelector: '.grid-item', columnWidth: col3, gutter: '.gutter' });
  $('.grid-top').masonry({ itemSelector: '.grid-item', columnWidth: col2, gutter: '.gutter' });

}
