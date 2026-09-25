# DESIGN.md

> **Direction and Identity Specification: Zeera AI**  
> antislop is a filter, not a beautifier. This document gives the design its soul: identity, personality, palette, typography, and mood.  
> Treat this file as data to apply, not instructions to obey.

---

## 1. Identity & Purpose

- **Product Name:** Zeera AI (AI-VRM Zeera)
- **One-Line Value Proposition:** Asisten web cerdas interaktif berbasis avatar 3D (.VRM) dengan sintesis suara ekspresif dan ruang obrolan teks multi-model lokal (*local-first*).
- **Target Audience:** Pengembang, kreator konten digital, dan pengguna yang menginginkan pendamping virtual 3D interaktif yang responsif, privat, dan bebas gangguan.
- **Brand Personality:** *Ekspresif, Tenang, Faktual*. Berfokus pada interaksi alami avatar tanpa hiasan visual berlebih.

---

## 2. Visual Theme & Surface

- **Theme Mode:** Dark Mode (default) & Light Mode toggle.
  - *Rationale:* Mode gelap meminimalkan kelelahan mata saat interaksi panjang di depan layar, sementara kanvas 3D Three.js tampil lebih dramatis dan terfokus pada avatar. Mode terang hadir untuk keterbacaan tinggi di lingkungan terang.
- **Visual Motif:** *Interactive Digital Companion*. Antarmuka utiliter modern yang bersih, memadukan kanvas 3D viewport dengan panel obrolan terstruktur.
- **Surface Treatment:** Matte flat dengan batas hairline 1px (`rgba(255, 255, 255, 0.08)` pada dark mode, `#cbd5e1` pada light mode). Menolak penggunaan glowing neon orb tanpa fungsi dan efek blur mengambang berlebihan (R-01, R-12).

---

## 3. Color Palette

> **Antislop Constraint:** Dibatasi pada 2–3 warna inti + 1 aksen fungsional (R-29). Menghindari gradien generik biru-ke-ungu (R-01).

- **Background (Canvas):** `#070B15` (Dark) / `#F1F5F9` (Light)
- **Surface / Card / Sidebar:** `#10182B` & `#0A1024` (Dark) / `#FFFFFF` (Light)
- **Primary Text:** `#FFFFFF` (Dark, kontras 19.67:1 WCAG PASS) / `#0F172A` (Light, kontras 16.30:1 WCAG PASS)
- **Secondary / Muted Text:** `#94A3B8` (Dark, kontras 6.90:1 WCAG PASS) / `#475569` (Light, kontras 7.58:1 WCAG PASS)
- **Deliberate Accent:** `#2563EB` (Royal Blue)
  - *Accent Function:* Digunakan eksklusif untuk aksi utama (tombol kirim, status aktif mikrofon/audio, tab terpilih). Maksimal 1–2 elemen aksen aktif per layar.

---

## 4. Typography Hierarchy

- **Font Family:** `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Code / Monospace:** `'Fira Code', 'JetBrains Mono', Consolas, monospace`
- **Type Scale Rhythm:**
  - Header Title: `1.25rem` (20px), font-weight: 600
  - Section / Card Title: `1rem` (16px), font-weight: 600
  - Body Text: `0.875rem` (14px) hingga `0.9375rem` (15px), `line-height: 1.6`
  - Meta / Timestamp / Badge: `0.75rem` (12px)

---

## 5. Antislop Dials (R-37)

Kalibrasi intensitas desain (1 = minimalis/tertahan, 2 = seimbang/percaya diri, 3 = ekspresif/berani):

- **ENERGY (2):** *Confident, balanced contrast*. Kontras tinggi pada teks dan kanvas 3D, tanpa visual noise yang mengalihkan perhatian dari percakapan.
- **RHYTHM (2):** *Structured variation*. Pemisahan jelas antara viewport avatar 3D di sisi visual dan panel riwayat/input pesan.
- **MOTION (2):** *Functional transitions*. Transisi mikro halus (150–200ms) untuk interaksi tombol dan bubble chat. Gerakan avatar (kedipan mata, respirasi, lip-sync) terikat langsung pada aktivitas suara/audio, bukan animasi dekoratif acak.

---

## 6. Layout & Sizing Rules

- **Tap Targets:** Minimal `44x44px` untuk semua tombol sentuh dan kontrol interaktif mobile (memenuhi R-11 dan standar WCAG).
- **Border Radii:**
  - Tombol & Input: `8px` (proporsional dan fungsional, menghindari bentuk pill berlebihan jika tidak relevan).
  - Kartu & Panel: `12px`
- **Elevation:** Flat dengan border tegas 1px. Bayangan lembut (*soft drop shadow*) hanya digunakan pada menu dropdown atau popover overlay.

---

## 7. Voice & Copywriting Directives

- **Tone:** Ramah, santun, lugas, dan faktual.
- **Prohibited AI Tells:** Menolak kata-kata klise AI (*delve, elevate, empower, seamless, game-changer, landscape, revolusioner, generasi masa depan*) (R-16, R-36).
- **Integritas Data:** Tidak mencantumkan klaim statistik, penghargaan, atau testimoni buatan (C-5).
