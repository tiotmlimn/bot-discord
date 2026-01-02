require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================== DATABASE ==================
const players = new Map();
const fights = new Map();
const DATA_FILE = './players.json';

// LOAD DATA
if (fs.existsSync(DATA_FILE)) {
  const raw = fs.readFileSync(DATA_FILE);
  const data = JSON.parse(raw);
  for (const id in data) {
    players.set(id, data[id]);
  }
  console.log('💾 Player data loaded');
}

// SAVE DATA
function savePlayers() {
  const obj = Object.fromEntries(players);
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
}

// ================== PLAYER ==================
function createPlayer() {
  return {
    level: 1,
    exp: 0,
    hp: 100,
    maxHp: 100,
    coins: 50,
    potions: 3,
    weapon: 0,
    armor: 0
  };
}

function createMonster(level) {
  return {
    name: 'Goblin',
    hp: 40 + level * 10,
    damage: 5 + level * 2,
    exp: 20 + level * 5,
    coins: 15 + level * 5
  };
}

// ================== BOT READY ==================
client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
});

// ================== COMMAND HANDLER ==================
client.on(Events.InteractionCreate, async (interaction) => {
    // ================== GIVE COINS ==================
if (interaction.commandName === 'givecoins') {
  const targetUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');
  const senderId = interaction.user.id;
  const targetId = targetUser.id;

  // Tidak boleh ke diri sendiri
  if (senderId === targetId) {
    return interaction.reply('❌ Kamu tidak bisa memberi coins ke diri sendiri');
  }

  // Pastikan target punya data
  if (!players.has(targetId)) {
    players.set(targetId, createPlayer());
  }

  const sender = players.get(senderId);
  const receiver = players.get(targetId);

  // Cek coins cukup
  if (sender.coins < amount) {
    return interaction.reply('❌ Coins kamu tidak cukup');
  }

  // Transfer
  sender.coins -= amount;
  receiver.coins += amount;

  savePlayers();

  return interaction.reply(
    `💸 <@${senderId}> memberikan **${amount} coins** ke <@${targetId}>`
  );
}

  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  if (!players.has(userId)) {
    players.set(userId, createPlayer());
    savePlayers();
  }

  const player = players.get(userId);

  // ================== INFO ==================
  if (interaction.commandName === 'info') {
    return interaction.reply(
`📜 **RPG BOT GUIDE**

/profile → Lihat status
/fight → Lawan monster
/heal → Pakai potion
/shop → Lihat toko
/buy → Beli item

🏪 **SHOP**
Potion → 20 coins
HP +20 → 50 coins
Weapon +5 → 100 coins
Armor +3 → 80 coins

💡 HP tidak reset otomatis!
Gunakan potion atau beli HP.`
    );
  }

  // ================== PROFILE ==================
  if (interaction.commandName === 'profile') {
    return interaction.reply(
`🧙 **PROFILE**
Level: ${player.level}
EXP: ${player.exp}
HP: ${player.hp}/${player.maxHp}
Coins: ${player.coins}
Potion: ${player.potions}
Weapon: +${player.weapon}
Armor: +${player.armor}`
    );
  }

  // ================== SHOP ==================
  if (interaction.commandName === 'shop') {
    return interaction.reply(
`🏪 **SHOP**
🧪 Potion → 20
❤️ HP +20 → 50
⚔️ Weapon +5 → 100
🛡️ Armor +3 → 80`
    );
  }

  // ================== BUY ==================
  if (interaction.commandName === 'buy') {
    const item = interaction.options.getString('item');

    if (item === 'potion' && player.coins >= 20) {
      player.coins -= 20;
      player.potions++;
    } else if (item === 'hp' && player.coins >= 50) {
      player.coins -= 50;
      player.maxHp += 20;
      player.hp = player.maxHp;
    } else if (item === 'weapon' && player.coins >= 100) {
      player.coins -= 100;
      player.weapon += 5;
    } else if (item === 'armor' && player.coins >= 80) {
      player.coins -= 80;
      player.armor += 3;
    } else {
      return interaction.reply('❌ Coins tidak cukup');
    }

    savePlayers();
    return interaction.reply(`✅ Berhasil membeli **${item}**`);
  }

  // ================== HEAL ==================
  if (interaction.commandName === 'heal') {
    if (player.potions <= 0)
      return interaction.reply('❌ Kamu tidak punya potion');

    player.potions--;
    player.hp = Math.min(player.hp + 40, player.maxHp);
    savePlayers();

    return interaction.reply(`❤️ Kamu sembuh! HP: ${player.hp}/${player.maxHp}`);
  }

  // ================== FIGHT ==================
  if (interaction.commandName === 'fight') {
    if (player.hp <= 0)
      return interaction.reply('💀 Kamu pingsan! Gunakan /heal');

    let monster = fights.get(userId);
    if (!monster) {
      monster = createMonster(player.level);
      fights.set(userId, monster);
    }

    const playerDamage = Math.floor(Math.random() * 10) + 10 + player.weapon;
    monster.hp -= playerDamage;

    let reply = `⚔️ Kamu menyerang **${monster.name}**\n💥 Damage: ${playerDamage}`;

    if (monster.hp <= 0) {
      player.exp += monster.exp;
      player.coins += monster.coins;
      fights.delete(userId);

      if (player.exp >= player.level * 50) {
        player.level++;
        player.exp = 0;
        player.maxHp += 20;
        reply += `\n⬆️ Level UP! Sekarang level ${player.level}`;
      }

      savePlayers();
      return interaction.reply(
`${reply}

🎉 Monster dikalahkan!
💰 +${monster.coins} coins`
      );
    }

    const monsterDamage = Math.max(
      0,
      Math.floor(Math.random() * monster.damage) + monster.damage - player.armor
    );

    player.hp -= monsterDamage;

    if (player.hp <= 0) {
      player.hp = 0;
      fights.delete(userId);
      savePlayers();
      return interaction.reply(
`${reply}

💀 Monster menyerang!
HP kamu habis. Gunakan /heal`
      );
    }

    savePlayers();
    return interaction.reply(
`${reply}

👹 Monster menyerang!
❤️ HP kamu: ${player.hp}/${player.maxHp}
👾 HP monster: ${monster.hp}`
    );
  }

  // ================== ADMIN CHEAT ==================
  if (interaction.commandName === 'admin') {
    if (interaction.user.id !== process.env.OWNER_ID)
      return interaction.reply({ content: '❌ Bukan admin', ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user').id;

    if (!players.has(target)) players.set(target, createPlayer());
    const tp = players.get(target);

    if (sub === 'addcoins') {
      const amount = interaction.options.getInteger('amount');
      tp.coins += amount;
    }

    if (sub === 'sethp') {
      tp.hp = interaction.options.getInteger('hp');
    }

    if (sub === 'giveitem') {
      const item = interaction.options.getString('item');
      if (item === 'potion') tp.potions++;
      if (item === 'weapon') tp.weapon += 5;
      if (item === 'armor') tp.armor += 3;
    }

    if (sub === 'resetplayer') {
      players.set(target, createPlayer());
    }

    savePlayers();
    return interaction.reply('✅ Admin command berhasil');
  }
});

// AUTO SAVE SAAT MATI
process.on('SIGINT', () => {
  console.log('💾 Saving data...');
  savePlayers();
  process.exit();
});

client.login(process.env.DISCORD_TOKEN);
