//Format project info into html

format = (function() {
    var data = [
        {
            "Title": "JPEG Decoding",
            "Subtitle": "A walkthough of the JFIF format",
            "link": "https://github.com/SkylerRankin/JPEG-Decoder",
            "tags": ["Python 3", "Jupyter Notebook"],
            "image": "jpeg.png",
            "text": "This Jupyter Notebook steps through the process of decoding a JPEG image file. After learning to understand these files byte by byte, its clear that a very high level of engineering and foresight was needed to achieve the stability and efficiency that allows for millions of pixels created by a variety of cameras and applications to be packed into small, uniform files. However, much of the available official documentation for this process is either extremely brief or lacking real world examples; when it comes to procedures like ZRL encoding or Huffman table parsing, it takes more than a few sentences to get all of the details necessary to implement them. As such, I’ve created this repository using simple to understand functions written in Python with custom diagrams for all of the tricky sections. Hopefully this will be useful to anyone looking for an example of how the bytes are parsed in JPEG decoders."
        },
        {
            "Title": "2D Raycasting",
            "Subtitle": "Transforming 2D Maps into 3D Environments with Ray Casting",
            "link": "https://github.com/SkylerRankin/Raycast3D",
            "tags": ["Java"],
            "image": "raycast.png",
            "text": "3D graphics algorithms have reached a point where they can be implemented in pretty much every platform efficiently, but there was once a time where vertex buffers and pixel shaders just weren’t in the memory budget of the average computer. In these times, developers created some very clever methods of simulating 3D scenes and objects without actually calculating the distances normally necessary for such a visual. This small Java file implements one such method, 2D ray casting, to simulate a FPS view walking in a 3D maze. The entire file is around 160 lines with no 3D model, and I think gives an awesome effect for so little cost."
        }
    ]
    return function() {
        console.log("Formatting "+data.length+" projects...")
        root = document.createElement("div")
        menu = document.createElement("div")
        for (let i = 0; i < data.length; ++i) {
            let section = document.createElement("div")

            let title = document.createElement("h1")
            title.innerHTML = data[i].Title
            title.className = "title"
            title.id = "project_"+i

            let li = document.createElement("li")
            let a = document.createElement("a")
            a.innerHTML = data[i].Title
            a.href = "#project_"+i
            li.appendChild(a)
            menu.appendChild(li)

            let subtitle = document.createElement("div")
            subtitle.innerHTML = data[i].Subtitle
            subtitle.className = "subtitle"

            section.appendChild(title)
            section.appendChild(subtitle)

            let tags = document.createElement("div")
            let link = document.createElement("a")
            link.href = data[i].link
            link.target = "_blank"
            let git = document.createElement("span")
            git.innerHTML = "Github"
            git.className = "tag is-link"
            link.appendChild(git)
            tags.appendChild(link)

            for (tag in data[i].tags) {
                let s = document.createElement("span")
                s.innerHTML = data[i].tags[tag]
                s.className = "tag is-success"
                tags.append(s)
            }
            tags.appendChild(document.createElement("br"))
            section.append(tags)

            let info = document.createElement("div")
            info.appendChild(document.createElement("br"))

            let fig = document.createElement("figure")
            fig.className = "image"
            fig.style = "width: 100%;"

            let img = document.createElement("img")
            img.src = "res/" + data[i].image
            img.style = "width: 60%; float: right; margin-left: 15px; margin-right: 15px; margin-bottom: 15px;"

            fig.appendChild(img)
            info.append(fig)

            let p = document.createElement("p")
            p.innerHTML = data[i].text
            info.appendChild(p)

            section.append(info)

            let br = document.createElement("br")
            br.style = "clear: both;"
            section.append(br)

            section.append(document.createElement("hr"))

            root.appendChild(section)
        }
        console.log("Menu")
        console.log(menu.innerHTML)
        console.log("Content Section")
        console.log(root.innerHTML)
    }
})()