let explode = anime.timeline({
  duration: 1000,
  autoplay: false,
  easing: "easeInOutQuint"
});

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
                blink("#box", "rgba(160, 59, 67, 1)", "rgba(23, 110, 147, 1)");
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
