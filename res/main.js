/* global anime */

// Note: Mine on first hit is EXPECTED behavior.

var grid; // Grid are [y][x] due to structure of the table
var flag = 0;
var ui = document.getElementById("grid");
var p = []; // position (neighbor)
var explode;
var start;
const hintColor = JSON.parse(
  '{"0":"#00f","1":"#00cf00","2":"#087800","3":"#000078","4":"#780000","5":"#007872","6":"#000","7":"#333"}'
);

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
            // When mine is hit
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
                blink("#box", "rgba(160, 59, 67, 1)", "rgba(23, 110, 147, 1)");
              }
            });

            explode.play();
            return;
          } else {
            // if normal
            reveal(this);
          }
          // no matter the update, the gi is not hidden anymore
          this.hidden = false;
        }
        render();
      });
  }
}

// Blink Animation, takes in color and blinks to other color
const blink = (element, color1, color2) =>
  anime({
    targets: element,
    backgroundColor: [
      {
        value: color1,
        duration: 0
      },
      {
        value: color2,
        easing: "easeOutCubic",
        duration: 500
      }
    ]
  });

// Refreshes grid
function render(end) {
  // Handles all CSS class changes
  grid.forEach(a => {
    a.forEach(b => {
      // matching classes to see if they apply
      if (end && !b.gi.mine) {
        b.classList.add("revealed");
      }

      if (!b.gi.hidden) {
        b.classList.add("revealed");
      }

      if (b.gi.flag) {
        b.classList.add("flag");
      } else if (!b.gi.flag) {
        b.classList.remove("flag");
      }

      // adding hint colors
      if (parseInt(b.innerHTML) >= 1 && !b.gi.hidden) {
        b.style.background = hintColor[b.innerHTML - 1];
      }
    });
  });
}

// Clicks and performs Boundary fill
function reveal(gi) {
  // Boundary fill (check edge of grid and border but reveal hints)

  let r = 0;
  let pos = [Math.trunc(gi.id / grid.length), gi.id % grid.length]; // y, x

  // Anti cheat. I'm not focusing on this, but it prevents the most stupid one
  if (grid[pos[0]][pos[1]].gi.mine) {
    console.error("Cheating detected");
    GameStart("reveal() is a good boy, leave him alone");
    blink("#box", "rgba(160, 59, 67, 1)", "rgba(23, 110, 147, 1)");
  }

  if (parseInt(grid[pos[0]][pos[1]].innerHTML) > 0) {
    // stop for if hint
    return;
  } else {

    // The horizontal and vertical approach can't do diagnals. 
    // Nested for loops are unavoidable with 2 dimensional data structures.
    for (let y = pos[0] - 1; y < pos[0] + 2; y++) {
      for (let x = pos[1] - 1; x < pos[1] + 2; x++) {
        if ((x == pos[1] && y == pos [0]) || x < 0 || x >= grid.length || y < 0 || y >= grid.length) {
          // check if same or out of range
          continue
        }

        if (!grid[y][x].gi.mine && grid[y][x].gi.hidden) {
          // reveal
          grid[y][x].gi.hidden = false;
          grid[y][x].gi.flag = false;
          r++;
          p.push(grid[y][x]);
        }
      }
    }

    // prevents infinite loops
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

// Grid init
// The grid. A digital frontier. I tried to... wait, wrong game
const init = () => {
  let set = document.getElementById("set");

  let s = parseInt(set.value);

  // Disable overlay, sets up side panel
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
    document.getElementById("overlay").style.display = "block";
    console.error("Grid Size out of range, aborting...");
    document.getElementById("intro").innerHTML =
      "Size invalid, please try again";

    blink("#box", "rgba(160, 59, 67, 1)", "rgba(23, 110, 147, 1)");
    return;
  } else {
    // Mine Spawn Probability
    let m = Math.ceil(Math.sqrt(s) + 8) / 100;

    while (flag == 0) {
      for (let a = 0; a < s; a++) {
        // Yes, we are working with table grids again. Dang it.

        // Grid Array fill setup
        let r = ui.insertRow(-1);
        grid[a] = new Array(s).fill();

        // for each cell
        for (let b = 0; b < s; b++) {
          // add cell
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

              if (c.gi.flag) {
                document.getElementById("flags").innerText =
                  parseInt(document.getElementById("flags").innerText) - 1;
              } else {
                document.getElementById("flags").innerText =
                  parseInt(document.getElementById("flags").innerText) + 1;
              }
              render();

              blink("p mark", "rgba(160, 59, 67, 1)", "rgba(192, 207, 219, 1)");
            }
            if (flag === 0) {
              GameStart("You won!");
              render(true);
              blink("#box", "rgba(255, 255, 0, 1)", "rgba(23, 110, 147, 1)");
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
    }

    document.getElementById("flags").innerText = flag;

    // Hint Generation
    ml.forEach(a => {
      // add 1 to 3x3 area with mine in centre
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

    // clear hints that are 0
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

// Executed on new game, prompt for size
function GameStart(customMessage) {
  document.getElementById("overlay").style.display = "block";

  if (customMessage) {
    document.getElementById("intro").innerHTML = customMessage;
  } else {
    document.getElementById("intro").innerHTML = "Grid Size?";
  }

  document.getElementsByTagName("button")[0].addEventListener("click", () => {
    init();
  });
}

// Init
GameStart();
