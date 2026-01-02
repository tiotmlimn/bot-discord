require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [];
commands.push(
  new SlashCommandBuilder()
    .setName('givecoins')
    .setDescription('Berikan coins ke player lain')
    .addUserOption(o =>
      o.setName('user')
        .setDescription('Player yang menerima coins')
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName('amount')
        .setDescription('Jumlah coins')
        .setRequired(true)
        .setMinValue(1)
    )
);

// PROFILE
commands.push(
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Lihat status RPG')
);

// INFO
commands.push(
  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Panduan bermain RPG')
);

// FIGHT
commands.push(
  new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Lawan monster')
    .addStringOption(opt =>
      opt.setName('skill')
        .setDescription('Gunakan skill')
        .setRequired(false)
        .addChoices(
          { name: 'Normal', value: 'normal' },
          { name: 'Fireball', value: 'fireball' },
          { name: 'HealSpell', value: 'healSpell' },
          { name: 'Shield', value: 'shield' }
        )
    )
);

// HEAL
commands.push(
  new SlashCommandBuilder()
    .setName('heal')
    .setDescription('Gunakan potion')
);

// SHOP
commands.push(
  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Lihat shop')
);

// BUY
commands.push(
  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Beli item')
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('Item yang dibeli')
        .setRequired(true)
        .addChoices(
          { name: 'Potion', value: 'potion' },
          { name: 'HP', value: 'hp' },
          { name: 'Weapon', value: 'weapon' },
          { name: 'Armor', value: 'armor' }
        )
    )
);

// DAILY
commands.push(
  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Ambil hadiah harian')
);

// LEADERBOARD
commands.push(
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top player')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Tipe leaderboard')
        .setRequired(true)
        .addChoices(
          { name: 'Level', value: 'level' },
          { name: 'Coins', value: 'coins' },
          { name: 'Global', value: 'global' }
        )
    )
);

// ADMIN / CHEAT
commands.push(
  new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin command (OWNER ONLY)')
    .addSubcommand(sub =>
      sub.setName('addcoins')
        .setDescription('Tambah coins player')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target player')
            .setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('amount')
            .setDescription('Jumlah coins')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('sethp')
        .setDescription('Set HP player')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target player')
            .setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('hp')
            .setDescription('Jumlah HP')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('giveitem')
        .setDescription('Beri item ke player')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target player')
            .setRequired(true)
        )
        .addStringOption(o =>
          o.setName('item')
            .setDescription('Item yang diberikan')
            .setRequired(true)
            .addChoices(
              { name: 'Potion', value: 'potion' },
              { name: 'Weapon', value: 'weapon' },
              { name: 'Armor', value: 'armor' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('resetplayer')
        .setDescription('Reset data player')
        .addUserOption(o =>
          o.setName('user')
            .setDescription('Target player')
            .setRequired(true)
        )
    )
);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ Deploying commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands.map(c => c.toJSON()) }
    );
    console.log('✅ Deploy sukses!');
  } catch (err) {
    console.error('❌ DEPLOY ERROR:', err);
  }
})();
