(() => {
  'use strict';

  /**
   * Ordered changelog entries for Makmal STEM (newest first).
   * Add future push updates at the top of this array.
   */
  window.STEMLAB_CHANGELOG = [
    {
      id: '2026-11-27',
      date: {
        ms: '27 November 2026',
        en: 'November 27, 2026'
      },
      version: 'v0.9',
      tag: 'new',
      title: {
        ms: 'Naik Taraf Ketaksamaan Linear & Halaman Kemas Kini',
        en: 'Linear Inequalities Upgrade & Changelog Page'
      },
      summary: {
        ms: 'Modul Ketaksamaan Linear kini keluar daripada fasa BETA dengan ruang kerja studio baharu dan 6 misi cabaran interaktif, diiringi pelancaran halaman Kemas Kini rasmi portal.',
        en: 'The Linear Inequalities module leaves BETA with a unified studio workspace and 6 interactive challenge missions, alongside the launch of the official portal Changelog page.'
      },
      sections: [
        {
          type: 'new',
          items: {
            ms: [
              'Mod Cabaran baharu pada simulasi Ketaksamaan Linear dengan 6 misi interaktif, sistem bintang, XP, pangkat dan kad misi terapung yang boleh diseret.',
              'Halaman Kemas Kini rasmi portal dengan garis masa interaktif di sebelah kiri, penapis kategori serta pautan baharu di bahagian bawah panel sisi (Maklumat).',
              'Pratetap contoh KSSM, ujian pantas asalan (0, 0), jadual rekod titik ujian P, ringkasan simbol sempadan dan bahagian Konsep Matematik pada modul Ketaksamaan Linear.'
            ],
            en: [
              'New Challenge Mode in Linear Inequalities with 6 interactive missions, stars, XP, ranks and a draggable floating mission card.',
              'Official portal Changelog page with an interactive left timeline rail, category filters and a new link at the bottom of the Information sidepanel.',
              'Added KSSM preset examples, quick origin (0, 0) test, test point P log table, boundary symbol summary and Mathematical Concepts section to Linear Inequalities.'
            ]
          }
        },
        {
          type: 'improved',
          items: {
            ms: [
              'Ruang kerja Ketaksamaan Linear direka semula kepada susun atur studio 3-lajur (analisis langsung, satah Cartes interaktif dan panel kawalan bertab) selaras modul simulasi terkini.',
              'Sokongan dwibahasa Bahasa Melayu dan Inggeris diperluas menyeluruh pada Ketaksamaan Linear serta halaman Kemas Kini.',
              'Label BETA digugurkan daripada modul Ketaksamaan Linear selepas penambahbaikan menyeluruh.'
            ],
            en: [
              'Redesigned the Linear Inequalities workspace into a unified 3-column studio layout (live analysis, interactive Cartesian stage and tabbed controls) matching newer modules.',
              'Expanded Bahasa Melayu and English translation coverage across Linear Inequalities and the Changelog page.',
              'Graduated the Linear Inequalities module out of BETA following comprehensive updates.'
            ]
          }
        }
      ],
      link: {
        href: 'ketaksamaan-linear.html',
        label: {
          ms: 'Cuba simulasi Ketaksamaan Linear',
          en: 'Try Linear Inequalities simulation'
        }
      }
    }
  ];
})();
