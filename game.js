// Improved visuals, pickup animation, tooltips and visited map tracking
const map = [
  [
    { desc: "a dark forest", item: "Magic Leaf", itemImage: "assets/items/item_magic_leaf.svg", tile: "assets/tiles/tile_forest.svg", npc: null, enemy: null, visited:false },
    { desc: "a sunny clearing", event: "You spot a wild rabbit.", item: null, tile: "assets/tiles/tile_clearing.svg", npc: {name:'Old Traveler',dialogue:["Greetings, stranger.","The cave hides a secret."]}, enemy: null, visited:false },
    { desc: "an old stone bridge", item: "Stone Key", itemImage: "assets/items/item_stone_key.svg", tile: "assets/tiles/tile_bridge.svg", npc: null, enemy: null, visited:false }
  ],
  [
    { desc: "a bubbling brook", event: "You find a shiny coin in the water.", item:null, tile: "assets/tiles/tile_brook.svg", npc:null, enemy:null, visited:false },
    { desc: "the village square", event: "Villagers greet you warmly.", item:null, tile: "assets/tiles/tile_village.svg", npc:{name:'Merchant', dialogue:["Buy my wares?","I need a favor: fetch my hammer."]}, enemy:null, shop:true, visited:false },
    { desc: "the blacksmith's forge", item: "Iron Sword", itemImage: "assets/items/item_iron_sword.svg", tile: "assets/tiles/tile_forge.svg", npc:{name:'Blacksmith', dialogue:["A fine sword for a brave soul.","Bring me ore and I'll upgrade it."]}, enemy:null, visited:false }
  ],
  [
    { desc: "a misty mountain path", event: "A chilly wind blows.", item:null, tile: "assets/tiles/tile_mountain.svg", npc:null, enemy:{name:'Wolf',hp:20,atk:6}, visited:false },
    { desc: "an abandoned hut", item: "Healing Potion", itemImage: "assets/items/item_potion.svg", tile: "assets/tiles/tile_hut.svg", npc:null, enemy:null, locked:true, lockDesc:"The door is boarded up.", visited:false },
    { desc: "a mysterious cave", event: "It's dark. You feel uneasy.", item:null, tile: "assets/tiles/tile_cave.svg", npc:null, enemy:{name:'Goblin',hp:18,atk:5}, visited:false }
  ]
];

let player = {
  x: 1,
  y: 1,
  hp: 100,
  inventory: ["Map"],
  attack: 8
};

let inCombat = false;
let currentEnemy = null;

function setLocationText() {
  const loc = map[player.y][player.x];
  loc.visited = true;
  document.getElementById('location').textContent = loc.desc;
  document.getElementById('map').textContent = `You are at ${loc.desc}.`;
  updateVisuals();
  renderMinimap();
}

function updateHP() {
  document.getElementById('hp').textContent = player.hp;
}

function log(msg) {
  const e = document.createElement('div');
  e.textContent = msg;
  document.getElementById('log-entries').prepend(e);
}

function refreshInventory() {
  const sel = document.getElementById('items');
  const list = document.getElementById('inv-list');
  sel.innerHTML = '';
  list.innerHTML = '';
  player.inventory.forEach((it, i) => {
    const opt = document.createElement('option'); opt.value = it; opt.textContent = it;
    sel.appendChild(opt);
    const d = document.createElement('div'); d.className = 'inv-item'; d.textContent = `${it}`;
    // tooltips for inventory items
    if (it === 'Healing Potion') d.title = 'Restores 30 HP when used.';
    if (it === 'Stone Key') d.title = 'Opens boarded doors nearby.';
    if (it === 'Iron Sword') d.title = 'Increases your attack when equipped.';
    if (it === 'Magic Leaf') d.title = 'A mysterious leaf with a faint glow.';
    list.appendChild(d);
  });
}

function showMessage(msg) {
  document.getElementById('message').textContent = msg;
  log(msg);
}

function clearChoices() {
  document.getElementById('choices').innerHTML = '';
}

function addChoice(text, cb) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.className = 'btn choice-btn';
  btn.onclick = cb;
  document.getElementById('choices').appendChild(btn);
}

function move(dir) {
  if (inCombat) { showMessage('You cannot move while in combat!'); return; }
  let nx = player.x, ny = player.y;
  if (dir === 'north') ny -=1;
  if (dir === 'south') ny +=1;
  if (dir === 'east') nx +=1;
  if (dir === 'west') nx -=1;
  if (nx<0||ny<0||nx>2||ny>2) { showMessage("You can't go that way."); return; }
  player.x = nx; player.y = ny; setLocationText(); triggerEvent();
}

function updateVisuals() {
  const loc = map[player.y][player.x];
  const tileImg = document.getElementById('tile-img');
  const itemImg = document.getElementById('item-img');

  if (loc.tile) {
    tileImg.src = loc.tile;
    tileImg.style.display = '';
  } else {
    tileImg.style.display = 'none';
  }

  if (loc.item && loc.itemImage) {
    itemImg.src = loc.itemImage;
    itemImg.style.display = '';
    itemImg.alt = loc.item;
    // tooltip for item
    itemImg.title = loc.item + (loc.item === 'Healing Potion' ? ': Restores 30 HP.' : '');
  } else {
    itemImg.style.display = 'none';
  }
}

function triggerEvent() {
  clearChoices();
  const loc = map[player.y][player.x];
  let msg = '';
  if (loc.locked) msg += loc.lockDesc + ' ';
  if (loc.item) { msg += `You see a ${loc.item} here. `; }
  if (loc.event) msg += loc.event + ' ';
  if (loc.npc) msg += `You notice ${loc.npc.name} nearby. `;
  if (loc.enemy && !inCombat) {
    startCombat(Object.assign({}, loc.enemy));
    return;
  }
  if (loc.item) {
    // don't auto-pick: show a Pick up choice
    addChoice(`Pick up ${loc.item}`, () => pickUpItem());
    addChoice('Leave it', () => { showMessage('You leave the item where it is.'); clearChoices(); });
  }
  if (!msg) msg = 'Nothing interesting here.';
  showMessage(msg);
}

function animatePickup(el, cb) {
  if (!el) { if (cb) cb(); return; }
  el.classList.remove('picked');
  // force reflow
  void el.offsetWidth;
  el.classList.add('picked');
  function done() { el.classList.remove('picked'); el.removeEventListener('animationend', done); if (cb) cb(); }
  el.addEventListener('animationend', done);
}

function pickUpItem() {
  const loc = map[player.y][player.x];
  if (!loc.item) { showMessage('There is nothing to pick up here.'); return; }
  const it = loc.item;
  const itemImg = document.getElementById('item-img');
  // animate then add to inventory
  animatePickup(itemImg, () => {
    player.inventory.push(it);
    loc.item = null;
    loc.itemImage = null;
    refreshInventory();
    updateVisuals();
    showMessage(`You picked up: ${it}`);
    clearChoices();
    renderMinimap();
  });
}

function talk() {
  const loc = map[player.y][player.x];
  if (loc.npc) {
    const npc = loc.npc;
    showMessage(`${npc.name} says: "${npc.dialogue[0]}"`);
    clearChoices();
    addChoice('Ask about place', ()=>{
      showMessage(`${npc.name} says: "${npc.dialogue[1] || 'I have nothing more.'}"`);
      clearChoices();
    });
    addChoice('Say goodbye', ()=>{ showMessage('You end the conversation.'); clearChoices(); });
  } else {
    showMessage('There is no one to talk to here.');
  }
}

function searchArea() {
  const loc = map[player.y][player.x];
  if (loc.item) {
    addChoice(`Pick up ${loc.item}`, () => pickUpItem());
    showMessage('You find something interesting.');
    return;
  }
  if (loc.locked) {
    showMessage('The entrance is locked or blocked. Maybe an item can help.');
    return;
  }
  showMessage('You search the area but find nothing of value.');
}

function inspect() {
  const loc = map[player.y][player.x];
  let details = `Inspecting: ${loc.desc}. `;
  if (loc.enemy) details += `You sense danger: ${loc.enemy.name}. `;
  if (loc.locked) details += `${loc.lockDesc} `;
  showMessage(details);
}

function openUseItem() {
  showMessage('Choose an item from the inventory and click Use Selected.');
}

function useSelectedItem() {
  const sel = document.getElementById('items');
  const it = sel.value;
  if (!it) { showMessage('No item selected.'); return; }
  if (it === 'Healing Potion') {
    player.hp = Math.min(100, player.hp + 30);
    player.inventory.splice(player.inventory.indexOf(it),1);
    showMessage('You drink the Healing Potion and recover 30 HP.'); updateHP(); refreshInventory(); return;
  }
  if (it === 'Stone Key') {
    // attempt to unlock nearby locked location (search adjacent tiles)
    let unlocked = false;
    for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++){
      const nx = player.x+dx, ny = player.y+dy;
      if (nx<0||ny<0||nx>2||ny>2) continue;
      const tile = map[ny][nx];
      if (tile.locked) { tile.locked = false; unlocked = true; }
    }
    if (unlocked) {
      player.inventory.splice(player.inventory.indexOf(it),1);
      showMessage('You used the Stone Key to unlock a nearby boarded door.'); refreshInventory();
    } else showMessage('No locked doors nearby.');
    return;
  }
  if (it === 'Iron Sword') {
    player.attack += 4; showMessage('You equip the Iron Sword. Attack increased.');
    return;
  }
  showMessage(`Using ${it} had no obvious effect.`);
}

function startCombat(enemy){
  inCombat = true; currentEnemy = enemy; showMessage(`A wild ${enemy.name} appears!`);
  clearChoices();
  addChoice('Attack', ()=>attack());
  addChoice('Flee', ()=>flee());
}

function attack(){
  if (!inCombat) { showMessage('No enemy to attack.'); return; }
  const dmg = Math.max(1, player.attack + Math.floor(Math.random()*6) - 2);
  currentEnemy.hp -= dmg;
  showMessage(`You strike ${currentEnemy.name} for ${dmg} damage.`);
  if (currentEnemy.hp <= 0) {
    showMessage(`You defeated the ${currentEnemy.name}!`);
    inCombat = false; currentEnemy = null; clearChoices(); return;
  }
  // enemy turn
  const edmg = Math.max(1, (currentEnemy.atk || 3) + Math.floor(Math.random()*4) -1);
  player.hp -= edmg; updateHP(); showMessage(`${currentEnemy.name} hits you for ${edmg} damage.`);
  if (player.hp <= 0) { showMessage('You have been defeated. Game over.'); inCombat=false; clearChoices(); return; }
}

function flee(){
  if (!inCombat) { showMessage('You are not in combat.'); return; }
  const success = Math.random() < 0.5;
  if (success) { showMessage('You successfully fled the battle.'); inCombat=false; currentEnemy=null; clearChoices(); return; }
  showMessage('You fail to flee! The enemy attacks.');
  const edmg = Math.max(1, (currentEnemy.atk||3) + Math.floor(Math.random()*4)-1);
  player.hp -= edmg; updateHP(); if (player.hp<=0){ showMessage('You have been defeated. Game over.'); inCombat=false; clearChoices(); }
}

function renderMinimap() {
  const mm = document.getElementById('minimap');
  mm.innerHTML = '';
  for (let y=0;y<map.length;y++){
    for (let x=0;x<map[y].length;x++){ 
      const t = document.createElement('div'); t.className = 'minimap-tile';
      if (map[y][x].visited) t.classList.add('minimap-visited');
      if (x===player.x && y===player.y) t.classList.add('minimap-current');
      // short label
      t.textContent = (x===player.x && y===player.y) ? '*' : (map[y][x].visited ? 'v' : '');
      mm.appendChild(t);
    }
  }
}

window.onload = function(){
  setLocationText(); updateHP(); refreshInventory(); triggerEvent();
};