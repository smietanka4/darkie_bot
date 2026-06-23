const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { calculateDamage } = require('../../utils/damageCalculator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('damage')
    .setDescription('Kalkulator obrażeń (Dark and Darker)')
    .addNumberOption(option =>
      option.setName('base_damage')
        .setDescription('Główne obrażenia (np. uderzenie miecza lub bazowy DMG z czaru) [WYMAGANE]')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('gear_damage')
        .setDescription('Dodatkowe obrażenia z ekwipunku (np. Spellbook, +X Weapon DMG)')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('power_bonus')
        .setDescription('Power Bonus (np. wpisz 15 dla 15% z siły/woli)')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('damage_reduction')
        .setDescription('Redukcja pancerza / magii przeciwnika (np. 30 dla 30% PDR/MDR)')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('penetration')
        .setDescription('Penetracja pancerza / magii (w %, np. 10)')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('additional_damage')
        .setDescription('Additional Damage (płaska wartość)')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('true_damage')
        .setDescription('True Damage (omija redukcje i strefy)')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('buff_weapon_damage')
        .setDescription('Buff Weapon/Magical Damage (np. z perków)')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('combo_multiplier')
        .setDescription('Combo Multiplier (domyślnie 1.0)')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('impact_zone')
        .setDescription('Impact Zone Multiplier (domyślnie 1.0 dla sweet spotu)')
        .setRequired(false)),
  
  async execute(interaction) {
    const baseDamage = interaction.options.getNumber('base_damage');
    const gearDamage = interaction.options.getNumber('gear_damage') || 0;
    const powerBonus = (interaction.options.getNumber('power_bonus') || 0) / 100;
    const damageReduction = (interaction.options.getNumber('damage_reduction') || 0) / 100;
    const penetration = (interaction.options.getNumber('penetration') || 0) / 100;
    const additionalDamage = interaction.options.getNumber('additional_damage') || 0;
    const trueDamage = interaction.options.getNumber('true_damage') || 0;
    const buffWeaponDamage = interaction.options.getNumber('buff_weapon_damage') || 0;
    const comboMultiplier = interaction.options.getNumber('combo_multiplier') ?? 1.0;
    const impactZone = interaction.options.getNumber('impact_zone') ?? 1.0;

    // Wspólne parametry (niezależne od strefy ciała)
    const baseParams = {
      baseDamage,
      powerBonus,
      damageReduction,
      penetration,
      additionalDamage,
      trueDamage,
      buffWeaponDamage,
      gearWeaponDamage: gearDamage, // przemapowanie nowej nazwy na starą z kalkulatora
      comboMultiplier,
      impactZoneMultiplier: impactZone
    };

    // Definiowanie stref z ich mnożnikami
    const hitZones = [
      { name: '🗣️ Głowa', mult: 1.5, bonus: 0.5 },
      { name: '🩻 Ciało', mult: 1.0, bonus: 0.0 },
      { name: '🦾 Ręce', mult: 0.8, bonus: -0.2 },
      { name: '✋ Dłonie', mult: 0.7, bonus: -0.3 },
      { name: '🦵 Nogi', mult: 0.6, bonus: -0.4 },
      { name: '🦶 Stopy', mult: 0.5, bonus: -0.5 },
    ];

    let resultsText = '';
    let finalDR = 0; 
    let baseAfterPower = 0;
    
    // Obliczanie dla każdej strefy oddzielnie
    for (const zone of hitZones) {
      const result = calculateDamage({ ...baseParams, hitLocationBonus: zone.bonus });
      finalDR = result.steps.finalDR; 
      baseAfterPower = result.steps.poweredDamage; // to też jest to samo dla każdej strefy
      
      resultsText += `${zone.name} (${zone.mult.toFixed(1)}x): **${result.totalDamage.toFixed(2)}** DMG\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Wyniki')
      .setColor(0x8B0000)
      .setDescription(`Pierdolnięcie dla bazowych obrażeń: **${baseDamage}**\n*(Dodatkowe obrażenia z Gear'u: +${gearDamage})*`)
      .addFields(
        { name: '📊', value: `Obrażenia: **${baseAfterPower.toFixed(2)}**\nPower Bonus: **${(powerBonus * 100).toFixed(0)}%**`, inline: true },
        { name: '🛡️ ', value: `PDR/MDR enemy: **${(finalDR * 100).toFixed(1)}%**`, inline: true },
        { name: ' ', value: ' ' },
        { name: '🎯 Obrażenia w poszczególne strefy', value: resultsText, inline: false }
      )
      .setFooter({ text: 'Ale urwał', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
