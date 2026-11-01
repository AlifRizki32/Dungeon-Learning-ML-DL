import React from 'react';
import { ALL_BADGES, ALL_RELICS } from '../data/roadmap.js';
import { useGameStore } from '../store/useGameStore';
import { getTopicContent, TOWER_RELICS } from '../game/spellbookEngine';
import { BadgeSprite, PixelLockSprite, RelicSprite } from './PixelSprites';

export const Inventory: React.FC = () => {
  const relics = useGameStore((s) => s.relics);
  const badges = useGameStore((s) => s.badges);

  const bossRelics = ALL_RELICS.filter((r) => r.id.startsWith('relic-boss-'));
  const guildRelics = ALL_RELICS.filter((r) => r.id.startsWith('relic-gq-'));

  return (
    <div className="w-full max-w-6xl mx-auto px-3 pb-14 space-y-6">
      {/* Section 1: 5 Floor Boss Badges */}
      <section aria-label="Koleksi Lencana Bos Lantai" className="pixel-box p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#3a306e] pb-3 mb-4">
          <div>
            <h1 className="font-pixel text-sm sm:text-base text-[#f5b935]">
              LENCANA PENAKLUK BOS ({badges.length}/{ALL_BADGES.length})
            </h1>
            <p className="font-vt text-xl text-[#b3aad1]">
              Diraih dengan mengalahkan Bos di akhir Lantai 1 hingga Lantai 5.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ALL_BADGES.map((badge) => {
            const owned = badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3.5 flex flex-col justify-between ${
                  owned ? 'pixel-box-gold' : 'pixel-box opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-[#120d26] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                    {owned ? (
                      <BadgeSprite badgeId={badge.id} size={36} />
                    ) : (
                      <PixelLockSprite size={24} />
                    )}
                  </div>
                  <div>
                    <div className="font-pixel text-[10px] text-[#f4f1ea] leading-snug">
                      {badge.name}
                    </div>
                    <span
                      className={`font-pixel text-[8px] ${
                        owned ? 'text-[#38d864]' : 'text-[#b3aad1]'
                      }`}
                    >
                      {owned ? 'DIMILIKI' : 'TERKUNCI'}
                    </span>
                  </div>
                </div>
                <p className="font-vt text-lg text-[#b3aad1] leading-snug">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: 5 Boss Relics */}
      <section aria-label="Relik Agung Bos Lantai" className="pixel-box p-4 sm:p-6">
        <div className="border-b-2 border-[#3a306e] pb-3 mb-4">
          <h2 className="font-pixel text-sm sm:text-base text-[#38d864]">
            RELIK AGUNG BOS LANTAI (
            {bossRelics.filter((r) => relics.includes(r.id)).length}/{bossRelics.length})
          </h2>
          <p className="font-vt text-xl text-[#b3aad1]">
            Artefak utama yang dijatuhkan oleh kelima Bos Lantai.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {bossRelics.map((relic) => {
            const owned = relics.includes(relic.id);
            return (
              <div
                key={relic.id}
                className={`p-4 flex items-start gap-3.5 ${
                  owned ? 'pixel-box-green' : 'pixel-box opacity-65'
                }`}
              >
                <div className="w-14 h-14 bg-[#120d26] border-2 border-[#38d864] flex items-center justify-center shrink-0">
                  {owned ? (
                    <RelicSprite iconType={relic.iconType} size={42} />
                  ) : (
                    <PixelLockSprite size={26} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-pixel text-xs text-[#f4f1ea]">
                    {relic.id === 'relic-boss-2'
                      ? `Daun Emas (${relic.name})`
                      : relic.id === 'relic-boss-3'
                      ? `Inti Neuron (${relic.name})`
                      : relic.id === 'relic-boss-4'
                      ? `Chip Edge (${relic.name})`
                      : relic.id === 'relic-boss-5'
                      ? `Stopwatch Perak (${relic.name})`
                      : relic.name}
                  </div>
                  <div className="font-vt text-base text-[#f5b935] mt-0.5">
                    {relic.id === 'relic-boss-2'
                      ? 'Bos Lantai 2: Golem Pohon Purba'
                      : relic.id === 'relic-boss-3'
                      ? 'Bos Lantai 3: Hydra Berkepala Banyak'
                      : relic.id === 'relic-boss-4'
                      ? 'Bos Lantai 4: Mecha-Core'
                      : relic.id === 'relic-boss-5'
                      ? 'Bos Lantai 5: Raja Deadline'
                      : relic.source}
                  </div>
                  <p className="font-vt text-lg text-[#b3aad1] mt-1 leading-snug">
                    {owned
                      ? relic.description
                      : 'Kalahkan Bos terkait untuk membuka segel relik ini.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: 8 Guild Quest Relics (Floor 5) */}
      <section aria-label="Relik Guild Quest Lantai 5" className="pixel-box p-4 sm:p-6">
        <div className="border-b-2 border-[#3a306e] pb-3 mb-4">
          <h2 className="font-pixel text-sm sm:text-base text-[#3ac5eb]">
            RELIK GUILD QUEST LANTAI 5 (
            {guildRelics.filter((r) => relics.includes(r.id)).length}/{guildRelics.length})
          </h2>
          <p className="font-vt text-xl text-[#b3aad1]">
            Dijatuhkan oleh setiap ruang kompetensi dunia nyata (Topik 21-28) di Lantai 5: Aula Guild.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {guildRelics.map((relic) => {
            const owned = relics.includes(relic.id);
            const gqNum = Number(relic.id.replace('relic-gq-', ''));
            const contentRelicName = getTopicContent(`topic-${gqNum}`)?.relic;
            return (
              <div
                key={relic.id}
                className={`p-3.5 flex flex-col justify-between ${
                  owned ? 'pixel-box-gold' : 'pixel-box opacity-65'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-12 h-12 bg-[#120d26] border-2 border-[#fb923c] flex items-center justify-center shrink-0">
                    {owned ? (
                      <RelicSprite iconType={relic.iconType} size={36} />
                    ) : (
                      <PixelLockSprite size={24} />
                    )}
                  </div>
                  <div>
                    <div className="font-pixel text-[10px] text-[#f4f1ea] leading-snug">
                      {contentRelicName ? `${contentRelicName} (${relic.name})` : relic.name}
                    </div>
                    <div className="font-vt text-base text-[#fb923c]">{relic.source}</div>
                  </div>
                </div>
                <p className="font-vt text-lg text-[#b3aad1] leading-snug">
                  {owned
                    ? relic.description
                    : 'Selesaikan Guild Quest terkait di Lantai 5 untuk memperoleh relik ini.'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4: 7 Menara Master Relics (Floor 6) */}
      <section aria-label="Relik Menara Master Lantai 6" className="pixel-box p-4 sm:p-6">
        <div className="border-b-2 border-[#3a306e] pb-3 mb-4">
          <h2 className="font-pixel text-sm sm:text-base text-[#f5b935]">
            RELIK MENARA MASTER LANTAI 6 (
            {TOWER_RELICS.filter((r) => relics.includes(r.id)).length}/{TOWER_RELICS.length})
          </h2>
          <p className="font-vt text-xl text-[#b3aad1]">
            Dijatuhkan oleh 7 Quest Menara Master (Road to Master) di Lantai 6.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {TOWER_RELICS.map((relic) => {
            const owned = relics.includes(relic.id);
            return (
              <div
                key={relic.id}
                className={`p-3.5 flex flex-col justify-between ${
                  owned ? 'pixel-box-gold' : 'pixel-box opacity-65'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-12 h-12 bg-[#120d26] border-2 border-[#f5b935] flex items-center justify-center shrink-0">
                    {owned ? (
                      <RelicSprite iconType={relic.iconType} size={36} />
                    ) : (
                      <PixelLockSprite size={24} />
                    )}
                  </div>
                  <div>
                    <div className="font-pixel text-[10px] text-[#f4f1ea] leading-snug">
                      {relic.name}
                    </div>
                    <div className="font-vt text-base text-[#f5b935]">{relic.source}</div>
                  </div>
                </div>
                <p className="font-vt text-lg text-[#b3aad1] leading-snug">
                  {owned
                    ? relic.description
                    : 'Selesaikan Quest Menara Master terkait di Lantai 6 untuk memperoleh relik ini.'}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

