import React from 'react'
import {
  Rocket,
  ExternalLink,
  Bot,
  MessageSquare,
  Sun,
  Zap,
  Smartphone,
  Lightbulb,
  Heart
} from 'lucide-react'
import { styles } from '../../styles/appStyles'

interface GuideCardsProps {
  isMobile: boolean
}

export const GuideCards: React.FC<GuideCardsProps> = ({ isMobile }) => {
  return (
    <>
      {/* Creator Card */}
      <div
        style={{
          ...styles.aboutCard,
          padding: isMobile ? '18px 16px' : '24px 28px'
        }}
      >
        <div style={styles.aboutCardBadge}>PENGEMBANG UTAMA</div>
        <h2
          style={{
            ...styles.aboutCardTitle,
            fontSize: isMobile ? '19px' : '22px'
          }}
        >
          Raditya Rai Zeeshan
        </h2>
        <p
          style={{
            ...styles.aboutCardLead,
            fontSize: isMobile ? '13.5px' : '15px'
          }}
        >
          Proyek <strong>AI VTuber Zeera</strong> ini dirancang dan dikembangkan secara mandiri oleh{' '}
          <strong style={{ color: 'var(--accent-blue-text)' }}>Raditya Rai Zeeshan</strong> sebagai platform asisten virtual
          berbasis web yang menggabungkan model karakter 3D anime interaktif, kecerdasan buatan, dan sintesis suara natural.
        </p>
        <div style={styles.aboutPortoBox}>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Kunjungi portofolio resmi saya:
          </p>
          <a
            href="https://radityarz.my.id"
            target="_blank"
            rel="noreferrer"
            style={{
              ...styles.bigPortoButton,
              fontSize: isMobile ? '13px' : '14px',
              padding: isMobile ? '9px 14px' : '10px 18px',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Rocket size={16} />
            <span>radityarz.my.id</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Panduan Penggunaan */}
      <div
        style={{
          ...styles.aboutCard,
          padding: isMobile ? '18px 16px' : '24px 28px'
        }}
      >
        <div style={styles.aboutCardBadge}>TATA CARA PENGGUNAAN</div>
        <h3
          style={{
            ...styles.aboutCardTitle,
            fontSize: isMobile ? '18px' : '22px'
          }}
        >
          Cara Berinteraksi dengan Zeera
        </h3>

        <div style={styles.guideGrid}>
          {/* Step 1 */}
          <div
            style={{
              ...styles.guideItem,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : '16px'
            }}
          >
            <div style={styles.guideIcon}>
              <Bot size={22} color="#60a5fa" />
            </div>
            <div style={styles.guideContent}>
              <h4 style={styles.guideHeading}>
                1. Mode AI Asisten Virtual (Avatar 3D, Suara Natural & Real-Time Loader)
              </h4>
              <p style={styles.guideText}>
                Rasakan pengalaman interaksi virtual yang hidup bersama avatar 3D anime interaktif berbasis model{' '}
                <strong>Pixiv VRM</strong>. Avatar dilengkapi dengan simulasi bernafas alami (<em>idle</em>), kedipan mata otomatis (<em>blink</em>), ekspresi wajah responsif (senang, terkejut, santai), serta gestur dinamis.
              </p>
              <ul
                style={{
                  margin: '8px 0 0 0',
                  paddingLeft: '18px',
                  fontSize: '12.5px',
                  color: 'var(--text-lead)',
                  lineHeight: '1.6'
                }}
              >
                <li>
                  <strong>Percakapan Suara Real-Time:</strong> Tekan tombol <strong>Mikrofon</strong> di bar kontrol bawah untuk berbicara langsung dalam Bahasa Indonesia.
                </li>
                <li>
                  <strong>Sintesis Suara & Lip-Sync:</strong> Zeera merespon dengan suara natural <em>Microsoft Edge Neural TTS (id-ID-GadisNeural)</em> yang dipadukan dengan sinkronisasi gerakan bibir (<em>Lip-Sync</em>) presisi via Web Audio API.
                </li>
                <li>
                  <strong>Input Teks Cepat:</strong> Anda juga dapat mengetik pesan singkat di kotak input bawah dan menekan Enter.
                </li>
                <li>
                  <strong>UX Loading Cerdas & Real-Time Progress:</strong> Saat memuat model 3D, sistem menampilkan teks ramah <em>&quot;Sebentar ya, Zeeranya siap-siap dulu...&quot;</em> disertai persentase progres unduhan dan animasi progress bar yang halus secara real-time.
                </li>
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              ...styles.guideItem,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : '16px',
              borderColor: 'rgba(59, 130, 246, 0.4)',
              backgroundColor: 'var(--bg-card)',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            <div style={{ ...styles.guideIcon, backgroundColor: 'var(--accent-blue-subtle)' }}>
              <MessageSquare size={22} color="var(--accent-blue-text)" />
            </div>
            <div style={styles.guideContent}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                  flexWrap: 'wrap'
                }}
              >
                <h4 style={{ ...styles.guideHeading, margin: 0 }}>
                  2. Mode AI Text Chat, Multi-Model & Rich Markdown
                </h4>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--accent-blue-text)',
                    backgroundColor: 'var(--accent-blue-subtle)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  UPDATED
                </span>
              </div>
              <p style={styles.guideText}>
                Ruang obrolan teks modern bertema ala ChatGPT yang ditenagai oleh mesin AI generasi terbaru. Beroperasi secara <em>silent mode</em> (tanpa suara), ideal untuk coding, riset, diskusi mendalam, maupun konsultasi sehari-hari.
              </p>
              <ul
                style={{
                  margin: '8px 0 0 0',
                  paddingLeft: '18px',
                  fontSize: '12.5px',
                  color: 'var(--text-lead)',
                  lineHeight: '1.65'
                }}
              >
                <li>
                  <strong>Model Selector AI (Custom Dropdown):</strong> Pengguna dapat memilih versi model AI secara bebas melalui tombol dropdown pil di samping tombol Kirim. Pilihan model otomatis tersimpan di <code>localStorage</code>.
                </li>
                <li>
                  <strong>Pemisah Tanggal Otomatis (Date Divider):</strong> Pesan otomatis dipisahkan berdasarkan hari pengiriman kalender dengan label pintar (<em>&quot;Hari Ini&quot;</em>, <em>&quot;Kemarin&quot;</em>, atau format tanggal lengkap Indonesia).
                </li>
                <li>
                  <strong>Rendering Markdown & Tabel GFM (remark-gfm):</strong> Balasan Zeera mendukung format Markdown lengkap termasuk <strong>tabel data interaktif</strong>, blok sintaks kode dengan penyorotan rapi, dan daftar ceklis.
                </li>
                <li>
                  <strong>Salin Pesan Sekali Klik:</strong> Setiap pesan dari Zeera dilengkapi tombol salin (<em>Copy to Clipboard</em>) dengan indikator centang visual saat berhasil disalin.
                </li>
                <li>
                  <strong>Penyimpanan Persisten (Local-First Dexie/IndexedDB):</strong> Seluruh riwayat obrolan tersimpan aman di peramban lokal Anda tanpa server pihak ketiga.
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              ...styles.guideItem,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : '16px'
            }}
          >
            <div style={{ ...styles.guideIcon, backgroundColor: 'rgba(251, 191, 36, 0.18)' }}>
              <Sun size={22} color="#f59e0b" />
            </div>
            <div style={styles.guideContent}>
              <h4 style={styles.guideHeading}>3. Sistem Tema Dinamis (Mode Gelap & Mode Terang)</h4>
              <p style={styles.guideText}>
                Zeera AI dilengkapi sistem tema ganda yang dapat dialihkan kapan saja melalui tombol matahari/bulan di bagian atas sidebar.
              </p>
              <ul
                style={{
                  margin: '8px 0 0 0',
                  paddingLeft: '18px',
                  fontSize: '12.5px',
                  color: 'var(--text-lead)',
                  lineHeight: '1.6'
                }}
              >
                <li>
                  <strong>Peralihan Mulus Berbasis CSS Variables:</strong> Menyesuaikan warna latar belakang, kartu glassmorphic, teks, border, dan bayangan tanpa reload.
                </li>
                <li>
                  <strong>Rendering Kanvas 3D Adaptif:</strong> Background kanvas avatar 3D menyesuaikan palet warna tema secara otomatis tanpa merusak shader Three.js.
                </li>
                <li>
                  <strong>Persistensi Tema:</strong> Pilihan mode gelap atau terang Anda tersimpan permanen di memori lokal.
                </li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div
            style={{
              ...styles.guideItem,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : '16px'
            }}
          >
            <div style={styles.guideIcon}>
              <Zap size={22} color="#fbbf24" />
            </div>
            <div style={styles.guideContent}>
              <h4 style={styles.guideHeading}>4. Arsitektur Performa Tanpa Reload</h4>
              <p style={styles.guideText}>
                Sistem navigasi dirancang dengan arsitektur performa tinggi. Berpindah antara mode <strong>AI Asisten Virtual</strong>, <strong>AI Text Chat</strong>, dan <strong>Filosofi & Panduan</strong> berjalan seketika tanpa perlu me-reload model karakter 3D atau merusak WebGL Context Three.js.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div
            style={{
              ...styles.guideItem,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : '16px'
            }}
          >
            <div style={styles.guideIcon}>
              <Smartphone size={22} color="#a78bfa" />
            </div>
            <div style={styles.guideContent}>
              <h4 style={styles.guideHeading}>5. Tampilan Responsif Layar Smartphone</h4>
              <p style={styles.guideText}>
                Antarmuka Zeera AI sepenuhnya adaptif untuk perangkat ponsel cerdas dan tablet. Pada layar mobile, sidebar navigasi berubah menjadi drawer menu yang dapat dibuka melalui tombol hamburger.
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div
            style={{
              ...styles.guideItem,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : '16px'
            }}
          >
            <div style={styles.guideIcon}>
              <Lightbulb size={22} color="#34d399" />
            </div>
            <div style={styles.guideContent}>
              <h4 style={styles.guideHeading}>6. Tips Berinteraksi dengan Zeera AI</h4>
              <p style={styles.guideText}>
                Zeera diprogram dengan kepribadian yang ceria, ramah, santai, dan solutif layaknya teman akrab. Anda dapat menyapa santai, meminta saran kreatif, membahas pemrograman, atau berdiskusi topik sains.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Card */}
      <div
        style={{
          ...styles.aboutCard,
          padding: isMobile ? '18px 16px' : '24px 28px'
        }}
      >
        <div style={styles.aboutCardBadge}>ARSITEKTUR & TEKNOLOGI</div>
        <h3
          style={{
            ...styles.aboutCardTitle,
            fontSize: isMobile ? '18px' : '22px'
          }}
        >
          Teknologi yang Digunakan
        </h3>
        <div style={styles.techBadgeContainer}>
          <span style={styles.techBadge}>React 18</span>
          <span style={styles.techBadge}>Vite 5</span>
          <span style={styles.techBadge}>TypeScript</span>
          <span style={styles.techBadge}>Three.js (WebGL)</span>
          <span style={styles.techBadge}>Pixiv Three-VRM</span>
          <span style={styles.techBadge}>Realtime Progress Loader</span>
          <span style={styles.techBadge}>Google Gemini AI (Multi-Model)</span>
          <span style={styles.techBadge}>Gemini 3.1, 3.5, 3.6 Flash</span>
          <span style={styles.techBadge}>Custom Model Selector</span>
          <span style={styles.techBadge}>React Markdown</span>
          <span style={styles.techBadge}>remark-gfm (GFM Tables)</span>
          <span style={styles.techBadge}>IndexedDB & Dexie.js</span>
          <span style={styles.techBadge}>dexie-react-hooks (Live Queries)</span>
          <span style={styles.techBadge}>Local-First Architecture</span>
          <span style={styles.techBadge}>Auto-Title Session Engine</span>
          <span style={styles.techBadge}>Date Divider Engine</span>
          <span style={styles.techBadge}>Dark & Light Theming (CSS Vars)</span>
          <span style={styles.techBadge}>ChatGPT-Style Chat UI</span>
          <span style={styles.techBadge}>Multi-Turn Conversation Memory</span>
          <span style={styles.techBadge}>Microsoft Edge Neural TTS (GadisNeural)</span>
          <span style={styles.techBadge}>Web Audio API (Realtime Lip-Sync)</span>
          <span style={styles.techBadge}>Web Speech Recognition (Browser STT)</span>
          <span style={styles.techBadge}>Clipboard API (Instant Copy)</span>
        </div>
      </div>

      {/* Watermark in About Tab */}
      <div style={{ ...styles.watermarkContainer, marginTop: '8px', paddingBottom: '16px' }}>
        <a
          href="https://radityarz.my.id"
          target="_blank"
          rel="noreferrer"
          style={{
            ...styles.watermarkLink,
            fontSize: isMobile ? '11px' : '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>Developed with</span>
          <Heart size={12} color="#3b82f6" fill="#3b82f6" />
          <span>by</span>
          <span style={{ color: 'rgba(147, 197, 253, 0.9)', fontWeight: 600 }}>Raditya Rai Zeeshan</span>
        </a>
      </div>
    </>
  )
}
