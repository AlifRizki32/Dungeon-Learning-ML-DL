export type Dungeon3DZoneId = 'overview' | 'portal' | 'neural' | 'clusters' | 'deeplearning';

export interface Dungeon3DZoneInfo {
  id: Dungeon3DZoneId;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  educationalNote: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  accentColor: string;
}

export const DUNGEON_3D_PALETTE = {
  bgAbyss: 0x0d0a1a,
  bgDungeon: 0x16112b,
  stoneDark: 0x1f193d,
  stoneMid: 0x2b2352,
  stoneLight: 0x5c4e99,
  cream: 0xf4f1ea,
  muted: 0xb3aad1,
  phosphorGreen: 0x38d864,
  greenDark: 0x1d8a3d,
  gold: 0xf5b935,
  goldDark: 0xa87312,
  bossRed: 0xe83b47,
  redDark: 0x941923,
  cyan: 0x3ac5eb,
  purple: 0x9b5de5,
} as const;

export const DUNGEON_3D_ZONES: Record<Dungeon3DZoneId, Dungeon3DZoneInfo> = {
  overview: {
    id: 'overview',
    title: 'Pulau Terapung Dungeon ML & DL',
    subtitle: 'Panorama Benteng Piksel 3D & Empat Monumen Pembelajaran',
    badge: 'PANORAMA 3D',
    description:
      'Benteng batu terapung di ruang abisal yang menyatukan Portal Inti Pengetahuan, Jaringan Saraf (Neural Network), Meja Klaster Data (Machine Learning), dan Menara Lapisan Tensor (Deep Learning).',
    educationalNote:
      'Gunakan mouse drag / sentuhan untuk memutar kamera, scroll untuk zoom, atau klik monumen 3D untuk mempelajari konsep visualnya.',
    cameraPosition: [0, 9.5, 16.5],
    cameraTarget: [0, 1.4, 0],
    accentColor: '#f5b935',
  },
  portal: {
    id: 'portal',
    title: 'Portal Inti Dimensi Pengetahuan',
    subtitle: 'Gerbang Aliran Data -> Fitur -> Model -> Evaluasi',
    badge: 'PORTAL UTAMA',
    description:
      'Gerbang batu berukir rune emas dengan pusaran energi hijau fosfor dan sian yang melambangkan siklus hidup sistem AI: dari data mentah hingga inferensi dunia nyata.',
    educationalNote:
      'Ilustrasi konseptual: dalam proyek nyata, setiap iterasi melewati gerbang eksperimen, validasi metrik, dan perbaikan kesalahan.',
    cameraPosition: [0, 4.2, 7.8],
    cameraTarget: [0, 2.5, -1.8],
    accentColor: '#38d864',
  },
  neural: {
    id: 'neural',
    title: 'Altar Jaringan Saraf (Neural Network)',
    subtitle: 'Visualisasi Input Layer -> Hidden Layer -> Output Layer',
    badge: 'NEURAL NETWORK',
    description:
      'Struktur 3D neuron yang saling terhubung oleh pipa sinapsis bercahaya. Pulsa energi mengalir dari lapisan masukan (Input), melewati transformasi non-linear (Hidden), menuju prediksi (Output).',
    educationalNote:
      'Ilustrasi pelengkap: bobot (weights) mengatur kekuatan sambungan antar-node, sedangkan fungsi aktivasi menentukan apakah sinyal diteruskan.',
    cameraPosition: [-6.4, 4.2, 4.4],
    cameraTarget: [-4.5, 1.9, 0.8],
    accentColor: '#3ac5eb',
  },
  clusters: {
    id: 'clusters',
    title: 'Meja Holotable Klaster Data & Decision Boundary',
    subtitle: 'Klasifikasi, Pengelompokan Fitur & Bidang Pemisah',
    badge: 'MACHINE LEARNING',
    description:
      'Kumpulan titik data terapung dalam ruang 3D yang terbagi menjadi dua kelas (Kristal Hijau vs Kubus Emas), dipisahkan oleh bidang batas keputusan (Decision Boundary) semi-transparan.',
    educationalNote:
      'Ilustrasi pelengkap: algoritma seperti SVM, Logistic Regression, dan Decision Tree mencari batas pemisah optimal di ruang fitur.',
    cameraPosition: [6.4, 4.2, 4.4],
    cameraTarget: [4.5, 1.8, 0.8],
    accentColor: '#38d864',
  },
  deeplearning: {
    id: 'deeplearning',
    title: 'Menara Lapisan Tensor & Attention (Deep Learning)',
    subtitle: 'Hierarki Ekstraksi Fitur Bertingkat & Residual Skip Connection',
    badge: 'DEEP LEARNING',
    description:
      'Menara berlapis yang menampilkan lempeng representasi tensor dari fitur tingkat rendah di dasar hingga prisma Attention merah-emas di puncak, dihubungkan oleh jalur lintas (skip connections).',
    educationalNote:
      'Ilustrasi pelengkap: arsitektur modern seperti ResNet dan Transformer menyusun blok berlapis dengan jalur residual agar gradien tetap mengalir.',
    cameraPosition: [-3.8, 5.4, -0.5],
    cameraTarget: [0, 2.2, -4.4],
    accentColor: '#e83b47',
  },
};

export const DUNGEON_3D_ZONE_LIST: Dungeon3DZoneInfo[] = [
  DUNGEON_3D_ZONES.overview,
  DUNGEON_3D_ZONES.portal,
  DUNGEON_3D_ZONES.neural,
  DUNGEON_3D_ZONES.clusters,
  DUNGEON_3D_ZONES.deeplearning,
];

export function isWebGLAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export function detectSoftwareWebGL(): boolean {
  try {
    if (typeof document === 'undefined') return true;
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}
