# Dungeon Belajar ML & DL

A retro 16-bit pixel-art dungeon crawler web game that turns a 28-topic Machine Learning & Deep Learning study roadmap (5 phases + Floor 6 *Menara Master*) into an interactive adventure in Indonesian.

## Tech Stack & Actual Versions

- **React:** `19.3.1` (`^19.0.1` in `package.json`)
- **Vite:** `8.3.5` (`^8.3.0` in `package.json`, `@vitejs/plugin-react` `^6.1.1`)
- **Tailwind CSS:** `4.3.3` (`tailwindcss` `^4.3.3` & `@tailwindcss/vite` `^4.3.3`)
- **Framer Motion:** `14.9.0` (`framer-motion` `^14.9.0`)
- **State Management:** Zustand `5.0.16` (`^5.0.16`)
- **3D Visualization (lazy-loaded):** Three.js `0.187.0` (`three` `^0.187.0`)
- **Server & AI Chatbot Dependency:** Express `4.22.3` (`express` `^4.21.2` in `server.ts`) + Google Gen AI SDK `2.32.0` (`@google/genai` `^2.32.0`) powering the `/api/ai-mentor` backend route for the lazy-loaded **AI Dungeon Mentor** chatbot.

## Content Review Status (`needs-human-review`)

All curriculum content, spellbook quizzes, boss scenarios, and lesson files (`src/data/floor1.content.json` – `src/data/floor6.content.json` and `src/data/lessons/floor1.lessons.json` – `src/data/lessons/floor6.lessons.json`) are marked with `"reviewStatus": "needs-human-review"`. Questions, worked examples, and explanations should undergo human subject-matter review.

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

4. **Validate lesson chunks and run unit tests:**
   ```bash
   npm run check:lessons
   npx --yes tsx --test src/game/formulas.test.ts src/game/spellbookEngine.test.ts src/game/campTracker.test.ts src/game/lessonEngine.test.ts src/audio/musicSystem.test.ts src/components/AIChatbot/chatService.test.ts
   ```

5. **Run dependency security audit:**
   ```bash
   npm audit
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

All game state is persisted in `localStorage` under the key `"dungeon-ml-dl:v1"` via Zustand's `persist` middleware (`src/store/useGameStore.ts`) with a versioned migration (`v3`) and `try/catch` storage safety.

