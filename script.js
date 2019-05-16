function update_tab(tab, pane) {
     var tabs = document.querySelectorAll(".navbar-item, .paged")
     tabs.forEach((t) => {
         if (t.id == tab) {
            t.classList.add("is-active");
            t.childNodes[1].childNodes[1].style.color = "#aedfca"
         } else if (t.classList.contains("is-active")) { 
            t.classList.remove("is-active");
            t.childNodes[1].childNodes[1].style.color = "#000"
        }
     })

     tabs = document.querySelectorAll(".tab-pane")
     tabs.forEach((t) => {
         if (t.id == pane) t.style.display = "block"
         else t.style.display = "none"
     })
 }

  window.onload = () => {
    //make navbar collapsable
    var burger = document.getElementById("burger")
    var menu = document.getElementById(burger.dataset.target)
    burger.addEventListener("click", () => {
        burger.classList.toggle("is-active")
        menu.classList.toggle("is-active")
    });

    //register click callbacks
    document.querySelectorAll(".navbar-item").forEach((tab) => {
        tab.onclick = function() {
          if (tab.classList.contains("paged")) {
            update_tab(this.id, this.dataset.target)
          }
          burger.classList.toggle("is-active")
          menu.classList.toggle("is-active")
        }
    })

    //hide all but first pane initially
    var tabs = document.querySelectorAll(".tab-pane");
    tabs.forEach(function(tab) {
      if (tab.id == "pane-1") {
        tab.style.display = "block";
      } else {
        tab.style.display = "none";
      }
    })

    //open pdf in new tab
    document.getElementById("resume").addEventListener("click", () => {
      window.open("res/SkylerRankinResume.pdf")
    })

    document.getElementById("time_of_day").innerHTML = (function(d) {
        if (d > 17) return "Good Evening,"
        else if (d >= 12) return "Good Afternoon,"
        else return "Good Morning,"
    })(parseInt(new Date().getHours()))

    init()
  }

  window.onresize = () => {
    resize()
  }