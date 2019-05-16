let data = {
    "background_tile_width": 250,
    "background_tile_height": 31,
    "sprite_width": 41,
    "sprite_height": 40,
    "deer_offset": 10,
}

let frame_id = null;

/* Split an image into sprites */
function split_sheet(sheet, width, height) {
    var tiles = [];

    var _canvas = document.createElement('canvas');
    _canvas.width = sheet.width;
    _canvas.height = sheet.height;
    var _ctx = _canvas.getContext('2d');
    _ctx.drawImage(sheet, 0, 0);

    var temp_canvas = document.createElement('canvas');
    temp_canvas.width=width;
    temp_canvas.height=height;
    var temp_ctx = temp_canvas.getContext('2d');

    for (var j=0; j<sheet.height/height; ++j)
        for (var i=0; i<sheet.width/width; ++i) {
        var data = _ctx.getImageData(i*width, j*height, height, width);
        temp_ctx.putImageData(data, 0, 0);
        var image = new Image();
        image.src = temp_canvas.toDataURL();
        tiles.push(image);
      }

    return tiles;
}

/* Update an animation */
function update_frames(frames, delay) {
    if (!frames) return null;
    //update to the next frame if wait is over
    if (frames.elapsed_frames >= delay) {
        frames.elapsed_frames = 0;
        frames.current_frame++;
        if (frames.current_frame >= frames.frames.length) {
            if (frames.loop) frames.current_frame = 0;
            else {
                frames.current_frame = frames.frames.length-1;
                frames.complete = true;
            }
        }
    } else {
        frames.elapsed_frames++;
    }
    return frames;
}

var get_frames = (() => {
    let frames = [];
    var image = new Image();
    image.onload = () => {
        let sprites = split_sheet(image, data.sprite_width, data.sprite_height);
        frames = [
            {
                "loop": true,
                "frames": sprites.slice(0, 12),
                "current_frame": 0,
                "elapsed_frames": 0,
                "complete": false,
            },
            {
                "loop": false,
                "frames": sprites.slice(12, 18),
                "current_frame": 0,
                "elapsed_frames": 0,
                "complete": false,
            },
            {
                "loop": true,
                "frames": sprites.slice(18, 30),
                "current_frame": 0,
                "elapsed_frames": 0,
                "complete": false,
            },
            {
                "loop": false,
                "frames": sprites.slice(30, 36),
                "current_frame": 0,
                "elapsed_frames": 0,
                "complete": false,
            }
        ];
    };
    image.crossOrigin = 'anonymous';
    image.src = "res/sheet.png";
    return function(i) {
        frames[i].complete = 0;
        frames[i].current_frame = 0;
        frames[i].elapsed_frames = 0;
        return frames[i];
    }
})();

/* Animation Loop */
var animation = (() => {
    var canvas = document.getElementById("foreground_canvas")
    var ctx = canvas.getContext("2d");
    let state = null;
    let prev_state = -1;
    let pos = canvas.width / 2;
    let dest = canvas.width - 50
    var prev = null;
    var frames = null;

    return function(time) {
        var d = time - (prev ? prev : time);
        if (d > 50) d = 16
        prev = time;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (state == null) {
            state = (prev_state + 1) % 4;
            frames = get_frames(state);
            frames.complete = false;
        }
        frames = update_frames(frames, 6);
        if (frames) {
            if (state%2==0) pos += 0.1*d*(state == 0 ? 1 : -1)
            ctx.drawImage(frames.frames[frames.current_frame], 
                pos,
                canvas.height - data.background_tile_height*data.scale + data.deer_offset - data.sprite_height*data.scale, 
                data.sprite_width*data.scale, 
                data.sprite_height*data.scale);
            if (state%2==0) {
                if (state==0 && pos >= dest) {
                    prev_state = state
                    state = null
                    dest = canvas.width*0.3*Math.random()
                } else if (state==2 && pos <= dest) {
                    prev_state = state
                    state = null
                    dest = canvas.width - canvas.width*0.3*Math.random() - data.scale*data.sprite_width
                }
            } else if (frames.complete) {
                prev_state = state
                state = null
            }
        }
        frame_id = window.requestAnimationFrame(animation)
    }
})();

function init() {

    //get reference to canvases
    var background_canvas = document.getElementById("background_canvas")
    var foreground_canvas = document.getElementById("foreground_canvas")

    var background_ctx = background_canvas.getContext("2d")
    var foreground_ctx = foreground_canvas.getContext("2d")

    //adjust virtual size of canvas according to screen resolution
    let dpi = window.devicePixelRatio;
    let vw = parseInt(getComputedStyle(background_canvas).getPropertyValue("width").slice(0, -2));
    let vh = parseInt(getComputedStyle(background_canvas).getPropertyValue("height").slice(0, -2));
    background_canvas.setAttribute("width", vw*dpi)
    background_canvas.setAttribute("height", vh*dpi)
    foreground_canvas.setAttribute("width", vw*dpi)
    foreground_canvas.setAttribute("height", vh*dpi)

    data.scale = vw*dpi / 248;

    background_ctx.fillStyle = "#aedfca"
    background_ctx.fillRect(0, 0, background_canvas.width, background_canvas.height)

    var title = document.getElementById("home_title")
    title.innerHTML = "SKYLER<br>RANKIN"
    var fontsize = 1
    title.style.fontSize = fontsize+"%"

    while (title.getBoundingClientRect().height*2 < background_canvas.getBoundingClientRect().height) {
        title.style.fontSize = (fontsize+=5)+"%";
    }
    title.style.display = "block"
    
    title.parentElement.style.top = (background_canvas.getBoundingClientRect().height*0.2)+"px";

    //prevent image smoothing for crisp pixels
    background_ctx.webkitImageSmoothingEnabled = false;
    background_ctx.moxImageSmoothingEnabled = false;
    background_ctx.imageSmoothingEnabled = false;
    foreground_ctx.webkitImageSmoothingEnabled = false;
    foreground_ctx.moxImageSmoothingEnabled = false;
    foreground_ctx.imageSmoothingEnabled = false;

    const tile_width = 250;
    const tile_height = 31;
    const scale = data.scale;
    const tiles = (background_canvas.width / (tile_width*scale)).toFixed() + 1;
    var image = new Image();
    image.onload = () => {
        for (var i = 0; i < tiles; ++i) {
            background_ctx.drawImage(image, i*tile_width*scale, background_canvas.height-tile_height*scale, tile_width*scale, tile_height*scale)
        }
        frame_id = window.requestAnimationFrame(animation)
    };
    image.src = "res/landscape.png"
} 

function resize() {
    cancelAnimationFrame(frame_id)
    init()
}