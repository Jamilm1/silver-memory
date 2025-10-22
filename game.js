// Simple map: 3x3 grid
const map = [
  [
    { desc: "a dark forest", item: "Magic Leaf" },
    { desc: "a sunny clearing", event: "You spot a wild rabbit." },
    { desc: "an old stone bridge", item: "Stone Key" }
  ],
  [
    { desc: "a bubbling brook", event: "You find a shiny coin in the water." },
    { desc: "the village square", event: "Villagers greet you warmly." },
    { desc: "the blacksmith's forge", item: "Iron Sword" }
  ],
  [
    { desc: "a misty mountain path", event: "A chilly wind blows." },
    { desc: "an abandoned hut", item: "Healing Potion" },
    { desc: "a mysterious cave", event: "It's dark. You feel uneasy." }
  ]
];

let player = {
  x: 1,
  y: 1,
  inventory: []
};

function showLocation() {
  const location = map[player.y][player.x];
  document.getElementById("map").textContent =
    `You are at ${location.desc}.`;
}

function showInventory() {
  const itemsList = document.getElementById("items");
  itemsList.innerHTML = "";
  player.inventory.forEach(item => {
    let li = document.createElement("li");
    li.textContent = item;
    itemsList.appendChild(li);
  });
}

function showMessage(msg) {
  document.getElementById("message").textContent = msg;
}

function move(dir) {
  let newX = player.x;
  let newY = player.y;
  switch(dir) {
    case "north": newY -= 1; break;
    case "south": newY += 1; break;
    case "east":  newX += 1; break;
    case "west":  newX -= 1; break;
  }
  if (newX < 0 || newY < 0 || newX > 2 || newY > 2) {
    showMessage("You can't go that way.");
    return;
  }
  player.x = newX;
  player.y = newY;
  showLocation();
  triggerEvent();
}

function triggerEvent() {
  const loc = map[player.y][player.x];
  let msg = "";
  if (loc.item) {
    msg += `You found a ${loc.item}! `;
    if (!player.inventory.includes(loc.item)) {
      player.inventory.push(loc.item);
      loc.item = null; // item collected
      showInventory();
    } else {
      msg += "But you already picked it up.";
    }
  }
  if (loc.event) {
    msg += loc.event;
  }
  if (!msg) msg = "Nothing interesting here.";
  showMessage(msg);
}

window.onload = function() {
  showLocation();
  showInventory();
  triggerEvent();
};
