// Génère des icônes PNG (react-icons -> SVG -> PNG) en 3 couleurs
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
const fs = require('fs');
fs.mkdirSync('icons', { recursive: true });

const ICONS = ['FaCogs', 'FaCog', 'FaSearch', 'FaStethoscope', 'FaEye', 'FaRuler', 'FaCube', 'FaPlay', 'FaCheck', 'FaWrench', 'FaGraduationCap',
  'FaLightbulb', 'FaClock', 'FaSun', 'FaMoon', 'FaLink', 'FaMicroscope', 'FaCut', 'FaOilCan', 'FaCar', 'FaRoute', 'FaBullseye', 'FaClipboardList',
  'FaLayerGroup', 'FaMousePointer', 'FaBolt', 'FaTachometerAlt', 'FaThermometerHalf', 'FaVolumeUp', 'FaUsers', 'FaBook', 'FaTools', 'FaSlidersH',
  'FaExpandArrowsAlt', 'FaCompressArrowsAlt', 'FaBrain', 'FaFlag', 'FaListOl', 'FaRocket', 'FaShareAlt', 'FaDesktop', 'FaChartLine', 'FaVideo', 'FaSyncAlt', 'FaArrowRight', 'FaHandPointer', 'FaFileAlt'];
const COLORS = { cyan: '#00E5FF', orange: '#FF6A00', white: '#F2F6FA', dark: '#070B11' };

(async () => {
  for (const name of ICONS) {
    const Comp = fa[name];
    if (!Comp) { console.log('manque', name); continue; }
    for (const [cn, col] of Object.entries(COLORS)) {
      const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: col, size: 256 }));
      await sharp(Buffer.from(svg)).png().resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(`icons/${name}_${cn}.png`);
    }
  }
  console.log('icons ok');
})();
