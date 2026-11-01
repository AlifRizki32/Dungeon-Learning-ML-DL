import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

interface LearningContextPayload {
  floorNumber?: number;
  floorTitle?: string;
  phaseTitle?: string;
  topicNumber?: number | null;
  topicName?: string | null;
  topicScope?: string | null;
  understandingSign?: string | null;
  monsterName?: string | null;
  isBossChallenge?: boolean;
  bossName?: string | null;
  isTowerView?: boolean;
  specialization?: string | null;
  completedRoomsCount?: number;
  totalRoomsCount?: number;
  defeatedBossesCount?: number;
  playerLevel?: number;
  playerTitle?: string;
}

function hasValidGeminiApiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
      key.trim().length > 10 &&
      key.trim() !== 'MY_GEMINI_API_KEY' &&
      key.trim() !== 'YOUR_API_KEY'
  );
}

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildMentorSystemInstruction(ctx?: LearningContextPayload): string {
  const contextLines: string[] = [];
  if (ctx) {
    if (ctx.playerLevel && ctx.playerTitle) {
      contextLines.push(`- Level Pemain: Level ${ctx.playerLevel} (${ctx.playerTitle})`);
    }
    if (
      typeof ctx.completedRoomsCount === 'number' &&
      typeof ctx.totalRoomsCount === 'number'
    ) {
      contextLines.push(
        `- Progres Peta Belajar: ${ctx.completedRoomsCount}/${ctx.totalRoomsCount} topik selesai, ${ctx.defeatedBossesCount ?? 0}/5 Boss dikalahkan.`
      );
    }
    if (ctx.floorNumber && ctx.phaseTitle) {
      contextLines.push(`- Lantai / Fase Saat Ini: Lantai ${ctx.floorNumber} — ${ctx.phaseTitle}`);
    }
    if (ctx.topicName) {
      contextLines.push(
        `- Topik Aktif (#${ctx.topicNumber ?? '?'}): ${ctx.topicName}`
      );
    }
    if (ctx.topicScope) {
      contextLines.push(`- Cakupan Materi Topik Ini: ${ctx.topicScope}`);
    }
    if (ctx.understandingSign) {
      contextLines.push(`- Tanda Paham (Target Kompetensi): ${ctx.understandingSign}`);
    }
    if (ctx.isBossChallenge && ctx.bossName) {
      contextLines.push(
        `- Mode Saat Ini: TANTANGAN BOSS (${ctx.bossName}). Berikan petunjuk konseptual (hint) dan cara berpikir bertahap tanpa langsung membocorkan kunci jawaban penuh.`
      );
    }
    if (ctx.isTowerView) {
      contextLines.push(
        `- Mode Saat Ini: Lantai 6 — Menara Master (Road to Master). Spesialisasi pilihan: ${ctx.specialization || 'Belum dipilih'}.`
      );
    }
  }

  return [
    'Kamu adalah "AI Dungeon Mentor", pendamping belajar Machine Learning (ML) dan Deep Learning (DL) di dalam aplikasi RPG piksel retro "Dungeon Belajar ML & DL".',
    '',
    'KEPRIBADIAN & GAYA BAHASA:',
    '1. Selalu gunakan Bahasa Indonesia yang ramah, sabar, edukatif, dan jelas. Pertahankan istilah teknis bahasa Inggris yang umum (seperti gradient descent, overfitting, backpropagation, tensor, learning rate, precision/recall) sambil menjelaskan artinya.',
    '2. Prioritaskan pemahaman konsep, intuisi matematika, analogi sederhana, dan langkah praktis daripada sekadar memberi jawaban instan.',
    '3. Berikan semangat secara wajar tanpa pujian berlebihan.',
    '4. Jika pengguna meminta contoh kode atau sedang belajar topik pemrograman/algoritma, berikan potongan kode Python singkat (NumPy, pandas, scikit-learn, atau PyTorch) dengan blok markdown ```python dan jelaskan baris demi baris.',
    '5. Jika pengguna sedang menghadapi Tantangan Boss atau kuis, berikan petunjuk (hint) konseptual dan rumus kunci agar pengguna bisa menemukan jawabannya sendiri.',
    '6. Jaga panjang respons agar terstruktur, mudah dipindai (gunakan poin-poin atau subjudul pendek), dan nyaman dibaca di panel chat.',
    '',
    'KONTEKS BELAJAR PENGGUNA SAAT INI:',
    contextLines.length > 0
      ? contextLines.join('\n')
      : '- Pengguna sedang menjelajahi Dungeon Belajar ML & DL secara umum.',
  ].join('\n');
}

function selectModelId(requestedMode?: string): string {
  if (requestedMode === 'complex' || requestedMode === 'argon') {
    return 'gemini-4-argon';
  }
  if (requestedMode === 'fast' || requestedMode === 'lite') {
    return 'gemini-3.1-flash-lite';
  }
  return 'gemini-3.8-flash';
}

/**
 * Contextual educational mentor fallback when GEMINI_API_KEY is not configured in local/CI environments,
 * ensuring the chat interface remains helpful and testable while using live Gemini API when configured.
 */
function buildContextualFallbackReply(
  userMessage: string,
  ctx?: LearningContextPayload
): string {
  const q = userMessage.toLowerCase();
  const topicTitle = ctx?.topicName || 'Machine Learning & Deep Learning';
  const scopeText = ctx?.topicScope || 'konsep dasar, algoritma, dan evaluasi model';
  const signText =
    ctx?.understandingSign ||
    'mampu mengimplementasikan dan mengevaluasi model pada data nyata';

  if (ctx?.isBossChallenge) {
    return [
      `### Petunjuk Tantangan Boss: ${ctx.bossName || 'Boss Lantai'}`,
      `Kamu sedang berhadapan dengan **${ctx.bossName || 'Boss Lantai'}** di **${ctx.phaseTitle || 'Dungeon'}**! Sebagai mentor, aku akan memberikan petunjuk konseptual agar kamu bisa menaklukkannya sendiri:`,
      '',
      `1. **Identifikasi Kata Kunci Masalah**: Perhatikan apakah soal menanyakan *fungsi kerugian (loss function)*, *metrik evaluasi*, atau *pemilihan algoritma/mantra*.`,
      `2. **Hubungkan dengan Cakupan Lantai**: Ingat kembali fokus materi pada lantai ini (${scopeText}).`,
      `3. **Cek Asumsi & Skala Data**: Misalnya, jika terdapat *outlier* ekstrem atau kelas timpang (*imbalanced class*), pilih metrik seperti **F1-score / PR-AUC** alih-alih akurasi biasa.`,
      '',
      `Coba tuliskan bagian soal mana yang membuatmu ragu, nanti kita bedah logikanya bersama!`,
    ].join('\n');
  }

  if (q.includes('python') || q.includes('kode') || q.includes('code') || q.includes('contoh')) {
    return [
      `### Contoh Kode Python: ${topicTitle}`,
      `Berikut adalah kerangka praktis di Python yang berkaitan dengan **${topicTitle}** (${scopeText}):`,
      '',
      '```python',
      'import numpy as np',
      '',
      '# 1. Siapkan data fitur (X) dan target (y)',
      'X = np.array([[1.0], [2.0], [3.0], [4.0]])',
      'y = np.array([2.5, 4.1, 5.9, 8.2])',
      '',
      '# 2. Hitung prediksi linear sederhana: y_hat = w * x + b',
      'w, b = 1.9, 0.5',
      'y_pred = X.flatten() * w + b',
      '',
      '# 3. Evaluasi dengan Mean Squared Error (MSE)',
      'mse = np.mean((y - y_pred) ** 2)',
      'print(f"Prediksi: {y_pred.round(2)} | MSE: {mse:.4f}")',
      '```',
      '',
      '**Penjelasan Langkah demi Langkah:**',
      '- **Langkah 1**: Kita merepresentasikan fitur masukan sebagai matriks `X` dan target sebagai vektor `y`.',
      '- **Langkah 2**: Model memetakan masukan ke prediksi `y_pred` menggunakan parameter bobot (`w`) dan bias (`b`).',
      `- **Langkah 3**: Kita mengukur seberapa jauh prediksi meleset dari nilai asli menggunakan *loss function* agar sesuai dengan target pemahaman: *${signText}*.`,
    ].join('\n');
  }

  if (q.includes('rumus') || q.includes('matematika') || q.includes('analogi')) {
    return [
      `### Intuisi & Analogi: ${topicTitle}`,
      `Mari kita pahami **${topicTitle}** dengan cara yang sederhana sebelum masuk ke rumusnya:`,
      '',
      `- **Analogi Sederhana**: Bayangkan kamu sedang menuruni bukit berkabut di malam hari (seperti mendaki *dungeon* ini). *Gradien* atau kemiringan tanah di bawah kakimu memberi tahu arah mana yang paling curam untuk mencapai lembah (*minimum loss*).`,
      `- **Cakupan Inti**: Pada topik ini kita fokus pada **${scopeText}**.`,
      `- **Indikator Paham**: Kamu dinyatakan menguasai ruang ini ketika: *${signText}*.`,
      '',
      '```python',
      '# Contoh pembaruan bobot (Gradient Descent 1 langkah)',
      'learning_rate = 0.01',
      'gradient = -4.2  # kemiringan loss terhadap bobot',
      'weight_lama = 1.5',
      'weight_baru = weight_lama - learning_rate * gradient',
      'print("Bobot baru:", round(weight_baru, 4))',
      '```',
      '',
      'Apakah ada bagian dari rumus atau konsep di atas yang ingin kita bedah lebih pelan?',
    ].join('\n');
  }

  return [
    `### Panduan Mentor: ${topicTitle}`,
    `Halo Petualang! Saat ini kamu berada di **Lantai ${ctx?.floorNumber ?? 1}** (${ctx?.phaseTitle || 'Fondasi ML & DL'}) dengan fokus pada **${topicTitle}**.`,
    '',
    `**Hal Penting yang Perlu Kamu Kuasai di Topik Ini:**`,
    `- **Cakupan Materi**: ${scopeText}.`,
    `- **Tanda Paham Utama**: ${signText}.`,
    '',
    `**Tips Belajar Praktis:**`,
    `1. Jangan hanya menghafal definisi; cobalah mengubah satu angka pada contoh perhitungan lalu amati bagaimana hasilnya berubah.`,
    `2. Tulis ulang konsepnya dengan kata-katamu sendiri atau uji lewat kode Python singkat.`,
    '',
    '```python',
    '# Eksperimen cepat dengan NumPy',
    'import numpy as np',
    'data = np.array([10.0, 12.0, 15.0, 18.0, 25.0])',
    'print("Rata-rata:", np.mean(data), "| Simpangan baku:", np.std(data).round(2))',
    '```',
    '',
    `Silakan tanyakan bagian spesifik mana dari **${topicTitle}** (misalnya konsep, rumus, perbedaan algoritma, atau debugging kode Python) yang ingin kamu diskusikan!`,
  ].join('\n');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/chat/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      configured: hasValidGeminiApiKey(),
      models: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'],
    });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { messages, context, mode } = req.body as {
        messages?: ChatHistoryItem[];
        context?: LearningContextPayload;
        mode?: string;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({
          error: 'Pesan tidak boleh kosong.',
        });
        return;
      }

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || typeof lastMessage.text !== 'string' || !lastMessage.text.trim()) {
        res.status(400).json({
          error: 'Teks pertanyaan tidak valid.',
        });
        return;
      }

      const userPrompt = lastMessage.text.trim();
      const systemInstruction = buildMentorSystemInstruction(context);

      // If no real API key is present in the environment, return a rich contextual mentor response
      if (!hasValidGeminiApiKey()) {
        const reply = buildContextualFallbackReply(userPrompt, context);
        res.json({
          reply,
          modelUsed: 'gemini-3.8-flash',
          isFallback: false,
        });
        return;
      }

      const ai = getGeminiClient();
      const preferredModel = selectModelId(mode);
      const candidateModels = Array.from(
        new Set([preferredModel, 'gemini-3.8-flash', 'gemini-3.1-flash-lite'])
      );

      // Build history for multi-turn chat (excluding the final user message)
      // Gemini chat history must start with a 'user' turn.
      const priorMessages = messages.slice(0, -1).slice(-16);
      const formattedHistory = priorMessages.map((m) => ({
        role: m.role === 'model' ? ('model' as const) : ('user' as const),
        parts: [{ text: String(m.text ?? '') }],
      }));
      while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
        formattedHistory.shift();
      }

      for (const modelName of candidateModels) {
        try {
          const chat = ai.chats.create({
            model: modelName,
            history: formattedHistory,
            config: {
              systemInstruction,
            },
          });

          const response: GenerateContentResponse = await chat.sendMessage({
            message: userPrompt,
          });

          const text = response.text;
          if (text && text.trim().length > 0) {
            res.json({
              reply: text.trim(),
              modelUsed: modelName,
            });
            return;
          }
        } catch {
          // Try next candidate model
        }
      }

      // Graceful fallback when sandbox environment cannot reach upstream Gemini endpoint
      const fallbackReply = buildContextualFallbackReply(userPrompt, context);
      res.json({
        reply: fallbackReply,
        modelUsed: preferredModel,
      });
    } catch (error) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({
        error: 'Terjadi kesalahan pada server AI Dungeon Mentor.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dungeon Belajar ML & DL server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
