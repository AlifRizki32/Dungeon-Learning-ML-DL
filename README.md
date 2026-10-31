# Dungeon Belajar ML & DL

A retro 16-bit pixel-art dungeon crawler web game that turns a 28-topic Machine Learning & Deep Learning study roadmap (5 phases + Floor 6 *Menara Master*) into an interactive adventure in Indonesian.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Run unit tests for game formulas:**
   ```bash
   npx --yes tsx --test src/game/formulas.test.ts
   ```

## How to Edit the Roadmap (`src/data/roadmap.js`)

All curriculum content, monsters, bosses, relics, badges, and *Menara Master* quests live in a single source-of-truth file: **`src/data/roadmap.js`**.

- **Topics (`FLOORS[i].topics`):** Each topic has:
  - `id`: Unique string ID (e.g. `'topic-1'`)
  - `number`: Topic number (`1`–`28`)
  - `floorId`: Floor number (`1`–`5`)
  - `name`: Topic title in Indonesian
  - `scope`: Core concepts covered
  - `weeks`: `{ min, max }` estimated duration in weeks (used by the XP formula `round(((min + max) / 2) * 50)`)
  - `understandingSign`: The *"Tanda sudah paham"* self-assessment criterion
  - `parallel`: Set to `true` for rooms unlocked from the start of their floor (e.g., Topic 6 Python on Floor 1, and Topics 21–28 Guild Quests on Floor 5)
- **Bosses (`FLOORS[i].boss`):** Configure `name`, `title`, `challenge`, `badge`, and `relic`.
- **Menara Master (`TOWER_FLOOR.quests`):** Edit the 7 endgame *Road to Master* quests and their book/course/paper references.

## Persistence

All game state is persisted in `localStorage` under the key `"dungeon-ml-dl:v1"` via Zustand's `persist` middleware (`src/store/useGameStore.ts`) with a versioned migration stub and `try/catch` storage safety.
