import React from 'react'
import LOGO_URL from '../../assets/logo-zeera.jpeg'
import LOGO_BANNER_URL from '../../assets/logo-zeera16-9.jpg'
import { styles } from '../../styles/appStyles'

interface BrandPhilosophyCardProps {
  isMobile: boolean
}

export const BrandPhilosophyCard: React.FC<BrandPhilosophyCardProps> = ({ isMobile }) => {
  return (
    <div
      style={{
        ...styles.aboutCard,
        padding: isMobile ? '18px 16px' : '26px 30px',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={styles.aboutCardBadge}>IDENTITAS BRAND & FILOSOFI LOGO</div>
      <h2
        style={{
          ...styles.aboutCardTitle,
          fontSize: isMobile ? '19px' : '23px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <span>Makna & Filosofi Logo Zeera</span>
      </h2>
      <p
        style={{
          ...styles.aboutCardLead,
          fontSize: isMobile ? '13px' : '14.5px',
          marginBottom: '18px'
        }}
      >
        Logo <strong>Zeera</strong> dirancang sebagai representasi visual dari kecerdasan buatan masa depan yang adaptif, berkesinambungan, dan penuh inovasi. Setiap lekukan garis, titik simpul, dan gradasi warna memiliki filosofi mendalam:
      </p>

      {/* Visual Showcase 2-Kolom Seimbang */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '14px' : '18px',
          marginBottom: '22px'
        }}
      >
        {/* Kolom 1: Banner Widescreen 16:9 */}
        <div
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease'
          }}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: '#070a14',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <img
              src={LOGO_BANNER_URL}
              alt="Logo Zeera Versi 16:9"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              Landscape 16:9
            </span>
          </div>
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)', flex: 1 }}>
            <h5
              style={{
                margin: '0 0 4px 0',
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              Logo Zeera (Widescreen 16:9)
            </h5>
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: '1.4'
              }}
            >
              Format lanskap beresolusi tinggi untuk showcase visual utama, presentasi, dan banner brand.
            </p>
          </div>
        </div>

        {/* Kolom 2: Logo Square Icon 1:1 */}
        <div
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease'
          }}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: '#070a14',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px'
            }}
          >
            <img
              src={LOGO_URL}
              alt="Logo Zeera Versi 1:1"
              style={{
                height: '100%',
                width: 'auto',
                aspectRatio: '1/1',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                display: 'block'
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              Square 1:1
            </span>
          </div>
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)', flex: 1 }}>
            <h5
              style={{
                margin: '0 0 4px 0',
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              Logo Zeera (Square Icon 1:1)
            </h5>
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: '1.4'
              }}
            >
              Format bujur sangkar presisi untuk identitas favicon web, ikon aplikasi, dan logo avatar sidebar.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Pilar Filosofi Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        {/* 1. Bentuk Dasar (Form & Shape) */}
        <div
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: isMobile ? '14px 14px' : '16px 20px',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-blue-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue-text)',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              1
            </div>
            <h4
              style={{
                margin: 0,
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}
            >
              Bentuk Dasar (Form & Shape)
            </h4>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: isMobile ? '12.5px' : '13.5px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}
          >
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Inisial Huruf &quot;Z&quot; atau Angka &quot;2&quot;:</strong>{' '}
              Siluet utama logo ini membentuk huruf &quot;Z&quot; (mewakili nama &quot;Zeera&quot;) atau angka &quot;2&quot;. Garisnya dibuat melengkung dan mengalir, melambangkan fleksibilitas, adaptabilitas, dan pergerakan yang dinamis dalam mengikuti perkembangan zaman.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Simbol Infinity (Tak Terhingga):</strong>{' '}
              Alur pita yang menyambung dan saling tumpang tindih tanpa ujung membentuk pola menyerupai simbol infinity (∞). Ini bermakna kesinambungan (<em>sustainability</em>), pertumbuhan yang tidak pernah berhenti (<em>continuous improvement</em>), dan potensi kemajuan yang tanpa batas.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Struktur Pita 3D yang Saling Mengunci:</strong>{' '}
              Menunjukkan adanya sinergi, kolaborasi, dan ikatan yang kuat. Menandakan bahwa elemen-elemen di dalam sistem/brand saling mendukung untuk menciptakan kesatuan yang kokoh.
            </li>
          </ul>
        </div>

        {/* 2. Elemen Geometris & Cahaya */}
        <div
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: isMobile ? '14px 14px' : '16px 20px',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(168, 85, 247, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              2
            </div>
            <h4
              style={{
                margin: 0,
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}
            >
              Elemen Geometris & Cahaya (Kanan Atas)
            </h4>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: isMobile ? '12.5px' : '13.5px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}
          >
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Simpul Jaringan (Network Node) / Rasi Bintang:</strong>{' '}
              Pada ujung atas terdapat elemen garis-garis yang terhubung menyerupai jaring (koneksi) atau rasi bintang. Ini merepresentasikan teknologi, digitalisasi, konektivitas global, dan kemampuan membangun jaringan yang luas.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Titik Cahaya (Glowing Dot):</strong>{' '}
              Titik ungu yang menyala di ujung melambangkan &quot;titik terang&quot;, puncak pencapaian, inovasi, atau percikan ide (<em>spark of idea</em>). Ini menunjukkan bahwa brand ini adalah <em>trendsetter</em> atau penunjuk arah menuju masa depan yang cerah.
            </li>
          </ul>
        </div>

        {/* 3. Filosofi Warna */}
        <div
          style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: isMobile ? '14px 14px' : '16px 20px',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(236, 72, 153, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f472b6',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              3
            </div>
            <h4
              style={{
                margin: 0,
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}
            >
              Makna Gradasi Warna (Color Palette)
            </h4>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: isMobile ? '12.5px' : '13.5px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}
          >
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Gradasi Biru (Cyan/Blue):</strong>{' '}
              Melambangkan kecerdasan, teknologi mutakhir, stabilitas, profesionalisme, dan kepercayaan (<em>trustworthy</em>).
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Gradasi Ungu & Magenta (Purple/Pink):</strong>{' '}
              Melambangkan kreativitas, imajinasi masa depan, kemewahan modern, dan visi eksplorasi yang melampaui batas konvensional.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Latar Gelap & Efek Glow:</strong>{' '}
              Memberikan kontras tinggi yang menonjolkan energi cahaya dari logo, mencerminkan kemampuan AI Zeera dalam memberikan solusi di tengah ketidakpastian.
            </li>
          </ul>
        </div>
      </div>

      {/* Ringkasan Filosofi */}
      <div
        style={{
          padding: isMobile ? '14px' : '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: isMobile ? '12.5px' : '13.5px',
            color: 'var(--text-lead)',
            lineHeight: '1.6'
          }}
        >
          Logo <strong>&quot;Zeera&quot;</strong> ini merepresentasikan sebuah brand atau entitas yang inovatif, visioner, dan berbasis pada teknologi/konektivitas. Brand ini memiliki fondasi yang kuat namun tetap fleksibel, selalu bergerak maju untuk menciptakan pertumbuhan tanpa batas, dan bertujuan untuk menjadi pionir atau cahaya penuntun di industrinya.
        </p>
      </div>
    </div>
  )
}
