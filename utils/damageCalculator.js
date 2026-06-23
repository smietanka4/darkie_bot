/**
 * Oblicza obrażenia w grze Dark and Darker na podstawie zaawansowanego wzoru.
 * @param {Object} params Parametry wejściowe
 * @returns {Object} Wyniki obliczeń i szczegółowe kroki
 */
function calculateDamage(params) {
    // 1. Bazowe wartości
    const baseDamage = params.baseDamage || 0;
    const buffWeaponDamage = params.buffWeaponDamage || 0;
    const comboMultiplier = params.comboMultiplier ?? 1.0;
    const impactZoneMultiplier = params.impactZoneMultiplier ?? 1.0;
    
    const gearWeaponDamage = params.gearWeaponDamage || 0;
    const divineStrikeDamage = params.divineStrikeDamage || 0;
    
    // 2. Mnożniki (oczekiwane w ułamkach np. 0.15 dla 15%)
    const powerBonus = params.powerBonus || 0;
    const additionalDamage = params.additionalDamage || 0;
    const hitLocationBonus = params.hitLocationBonus || 0;
    const raceDamageBonus = params.raceDamageBonus || 0;
    const raceDamageReduction = params.raceDamageReduction || 0;
    
    const damageReduction = params.damageReduction || 0;
    const damageReductionMod = params.damageReductionMod || 0;
    const penetration = params.penetration || 0;
    const elementalDamageReduction = params.elementalDamageReduction || 0;
    
    const projectileReduction = params.projectileReduction || 0;
    const projectileFalloff = params.projectileFalloff ?? 1.0; // 1.0 to brak falloffu
    
    const trueDamage = params.trueDamage || 0;
    const absoluteReduction = params.absoluteReduction || 0;

    // --- Krok 1: Wartości bazowe ---
    // (Base Damage + Buff Weapon Damage) * Combo Multiplier * Impact Zone Multiplier
    const weaponBasePart = (baseDamage + buffWeaponDamage) * comboMultiplier * impactZoneMultiplier;
    
    // + Gear Weapon Damage|Magical Damage + Divine Strike Damage
    const addedDamagePart = gearWeaponDamage + divineStrikeDamage;
    const totalBase = weaponBasePart + addedDamagePart;
    
    // --- Krok 2: Power i Dodatkowe Obrażenia ---
    // * (1 + Power Bonus) + Additional Damage
    const poweredDamage = totalBase * (1 + powerBonus) + additionalDamage;
    
    // --- Krok 3: Mnożniki trafienia i rasy ---
    // * (1 + Hit Location Bonus)
    const locationMult = (1 + hitLocationBonus);
    
    // * (1 + Race Damage Bonus) * (1 - Race Damage Reduction)
    const raceMult = (1 + raceDamageBonus) * (1 - raceDamageReduction);
    
    // --- Krok 4: Redukcja obrażeń (PDR/MDR) i penetracja ---
    // % Damage Reduced = Target's Damage Reduction (after Mod) * (1 - Attacker's Pen)
    let modifiedDR = damageReduction * (1 + damageReductionMod);
    let finalDR = modifiedDR * (1 - Math.min(penetration, 1.0));
    
    // Penetracja nie może zbić DR poniżej 0, a jeśli DR było <= 0 to penetracja nic nie robi
    if (modifiedDR <= 0) {
        finalDR = modifiedDR; 
    }
    
    // * ((1 - Damage Reduction...) + Elemental Damage Reduction)
    // Zgodnie z opisem z wiki "Like regular Damage Reduction... functionally increasing damage it receives"
    // Czasem EDR redukuje też DMG, zostawiamy odejmowanie (jakby to było negatywne dla atakującego)
    const reductionMult = (1 - finalDR) - elementalDamageReduction;
    
    // --- Krok 5: Projektile ---
    // * (1 - Projectile Reduction) * Projectile Falloff
    const projMult = (1 - projectileReduction) * projectileFalloff;

    // --- SKŁADANIE WZORU ---
    let finalDamage = poweredDamage * locationMult * raceMult * reductionMult * projMult + trueDamage;

    // --- Absolute Reduction ---
    finalDamage -= absoluteReduction;
    
    if (baseDamage > 0 && finalDamage < 1 && finalDamage > 0) {
        // Gra w wielu przypadkach redukuje minimalnie do 1 obrażenia na instancję
        finalDamage = 1;
    }
    if (finalDamage < 0) finalDamage = 0;

    return {
        totalDamage: finalDamage,
        steps: {
            weaponBasePart,
            totalBase,
            poweredDamage,
            locationMult,
            raceMult,
            finalDR,
            reductionMult,
            projMult,
        }
    };
}

module.exports = { calculateDamage };
