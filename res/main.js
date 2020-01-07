/* global anime*/
// Note: ALL console.log WILL BE REMOVED WHEN PROJECT IS FINISHED
// TODO: reveals when explode, color code hints, UI scaling

// prompt. Ew. Change later
var grid; // Grid are [y][x] due to structure of the table
var flag = 0;
var ui = document.getElementById("grid");
var p = []; // position (neighbor)
var explode;
var start;
var size;
const hintColor = JSON.parse(
  '{"0":"#00f","1":"#00cf00","2":"#087800","3":"#000078","4":"#780000","5":"#007872","6":"#000","7":"#333"}'
);

function render() {
  // Handles all CSS class changes
  grid.forEach(a => {
    a.forEach(b => {
      if (!b.gi.hidden) {
        b.classList.add("revealed");
      }

      if (b.gi.flag) {
        b.classList.add("flag");
      } else if (!b.gi.flag) {
        b.classList.remove("flag");
      }

      if (parseInt(b.innerHTML) >= 1 && !b.gi.hidden) {
        b.style.background = hintColor[b.innerHTML - 1];
      }
    });
  });
}

function reveal(gi) {
  // Boundary fill (check edge of grid and border but reveal hints)

  let r = 0;
  let pos = new Uint16Array(2);
  pos = [Math.trunc(gi.id / grid.length), gi.id % grid.length];

  if (parseInt(grid[pos[0]][pos[1]].innerHTML) > 0) {
    // stop for if hint
    return;
  } else {
    // horizontal (left, right)
    for (let i = pos[1] - 1; i < pos[1] + 2; i++) {
      if (i == pos[1] || i < 0 || i >= grid.length) {
        // check if same or out of range
        continue;
      }

      if (!grid[pos[0]][i].gi.mine && grid[pos[0]][i].gi.hidden) {
        grid[pos[0]][i].gi.hidden = false;
        grid[pos[0]][i].gi.flag = false;
        r++;
        p.push(grid[pos[0]][i]);
      }
    }

    // vertical (top, bottom)
    for (let i = pos[0] - 1; i < pos[0] + 2; i++) {
      if (i == pos[0] || i < 0 || i >= grid.length) {
        continue;
      }

      if (!grid[i][pos[1]].gi.mine && grid[i][pos[1]].gi.hidden) {
        grid[i][pos[1]].gi.hidden = false;
        grid[i][pos[1]].gi.flag = false;
        r++;
        p.push(grid[i][pos[1]]);
      }
    }

    if (r > 0) {
      p.forEach(i => {
        if (!i.chk) {
          i.chk = true;
          reveal(i.gi);
        }
      });
      p = [];
    }
  }
}

// gi - Grid Item
class gi {
  constructor(i) {
    // pos based on array pos
    (this.id = i),
      (this.hidden = true),
      (this.mine = false),
      (this.flag = false),
      (this.update = () => {
        if (this.hidden) {
          if (this.flag) {
            // Prevents click on flag. Do not remove.
            return;
          } else if (this.mine) {
            // Prevents click on grid while animating
            document.querySelectorAll("td").forEach(i => {
              i.style.pointerEvents = "none";
            });

            // Add to explosion timeline
            explode.add({
              targets: "td",
              scale: [
                { value: 0.1, easing: "easeOutCubic", duration: 10 },
                { value: 1, easing: "easeInSine", duration: 150 }
              ],
              backgroundColor: [
                { value: "#ff0", easing: "easeOutCubic", duration: 100 },
                "#f00",
                "#000"
              ],
              color: [
                { value: "#ff0", easing: "easeOutCubic", duration: 100 },
                "#f00",
                "#000"
              ],
              delay: anime.stagger(250, {
                grid: [grid.length, grid.length],
                from: this.id
              }),
              complete: function() {
                // END GAME

                GameStart("MINE EXPLODED");
              }
            });

            explode.play();
            return;
          } else {
            reveal(this);
          }
          this.hidden = false;
        }
        render();
      });
  }
}

// Grid init
// The grid. A digital frontier. I tried to... wait, wrong game
const init = s => {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("grid").innerHTML = "";
  document.getElementById("size").innerHTML = s;

  // anime js timelines
  explode = anime.timeline({
    duration: 1000,
    autoplay: false,
    easing: "easeInOutQuint"
  });

  start = anime.timeline({
    duration: 500,
    easing: "easeInOutCubic"
  });

  // clear variables
  let ml = [];
  p = [];
  grid = [];
  flag = 0;

  if ((s > 30) | (s < 5) || !s) {
    // I don't want to deal with 1mil x 1mil grids
    console.error("Grid Size out of range, aborting...");
    window.alert("Internal Error (Grid out of range)");
    location.reload();
    return;
  } else {
    let m = Math.ceil(Math.sqrt(s) + 8) / 100;

    for (let a = 0; a < s; a++) {
      // Yes, we are working with table grids again. Dang it.
      let r = ui.insertRow(-1);
      grid[a] = new Array(s).fill();

      for (let b = 0; b < s; b++) {
        let c = r.insertCell(-1);
        grid[a][b] = c;

        // Right Click handling
        c.oncontextmenu = () => {
          if (c.gi.hidden) {
            if (c.gi.mine) {
              if (flag > 0 && !c.gi.flag) {
                flag -= 1;
              } else {
                flag += 1;
              }
            }
            c.gi.flag = !c.gi.flag;
            if (
              parseInt(document.getElementById("flags").innerText) <= 0 &&
              c.gi.flag
            ) {
              c.gi.flag = !c.gi.flag;
              return false;
            }
            anime({
              targets: "p mark",
              backgroundColor: [
                {
                  value: "rgba(160, 59, 67, 1)",
                  duration: 0
                },
                {
                  value: "rgba(192, 207, 219, 1)",
                  easing: "easeOutCubic",
                  duration: 500
                }
              ]
            });
            if (c.gi.flag) {
              document.getElementById("flags").innerText =
                parseInt(document.getElementById("flags").innerText) - 1;
            } else {
              document.getElementById("flags").innerText =
                parseInt(document.getElementById("flags").innerText) + 1;
            }
            render();
          }
          if (flag === 0) {
            // eww
            window.alert("WIN!");
          }
          return false;
        };

        // dynamic sizing
        c.style.height =
          document.getElementById("grid").offsetWidth / s - 5 + "px";
        c.gi = new gi(b + s * a);
        c.innerHTML = "0";

        // mine generation
        if (Math.random() < m) {
          c.gi.mine = true;
          ml.push([a, b]);
          flag += 1;
        }

        c.addEventListener("click", c.gi.update);
      }
    }

    document.getElementById("flags").innerText = flag;

    // Hint Generation
    ml.forEach(a => {
      for (let b = a[1] - 1; b < a[1] + 2; b++) {
        if (b + 1 !== s + 1 && b >= 0) {
          if (a[0] - 1 >= 0) {
            grid[a[0] - 1][b].innerHTML =
              parseInt(grid[a[0] - 1][b].innerHTML) + 1;
          }
          grid[a[0]][b].innerHTML = parseInt(grid[a[0]][b].innerHTML) + 1;
          if (a[0] + 1 !== s) {
            grid[a[0] + 1][b].innerHTML =
              parseInt(grid[a[0] + 1][b].innerHTML) + 1;
          }
        }
      }
    });

    // clear hints that are 0, add colours
    grid.forEach(a => {
      a.forEach(b => {
        if (b.innerHTML == "0" || b.gi.mine === true) {
          b.innerHTML = "";
        }
      });
    });

    // Start animation
    start
      .add({
        targets: "table",
        translateY: ["-500", "0"]
      })
      .add(
        {
          targets: "td",
          translateY: ["-100", "0"],
          delay: anime.stagger(30, {
            grid: [s, s],
            from: "center"
          })
        },
        "-=500"
      );

    start.play();
  }
};

function GameStart(customMessage) {
  document.getElementById("overlay").style.display = "block";
  if (customMessage) {
    document.getElementById("intro").innerHTML = customMessage;
  } else {
    document.getElementById("intro").innerHTML = "Grid Size?";
  }

  document.getElementsByTagName("button")[0].addEventListener("click", () => {
    size = parseInt(document.getElementById("set").value);
    init(size);
  });
}

GameStart();
