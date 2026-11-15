// Products shown on the site. Only `code`, `title`, `category` and a link
// (`url` or `variants`) are required; every other field is optional so older
// entries keep working.
//
// url:   affiliate link to Mercado Libre (must start with https://).
// variants: use it instead of `url` when each version has its own affiliate
//         link: [{ label: "512 GB", url }, ...]. The first one is preselected.
// badge: { label, tone } where tone is "top", "hot", "new" or "value".
// images: product photos, served from public/ (public/img/do-001/a.webp is
//         "img/do-001/a.webp", without a leading slash so it also works
//         when the site is published in a subfolder). The first one is the cover; with several the
//         card shows a gallery, and without any it shows a placeholder.
export const products = [
  {
    code: "DO-001",
    title: "iPhone 17 Pro Max",
    category: "tecnologia",
    subcategory: "Celulares",
    features: ["Chip A19 Pro con refrigeración", "Triple cámara 48 MP", 'Pantalla OLED 6,9"'],
    badge: { label: "Reel nuevo", tone: "hot" },
    images: [
      "img/do-001/lineup.webp",
      "img/do-001/duo.webp",
      "img/do-001/blue.webp",
      "img/do-001/cam.webp",
      "img/do-001/orange.webp",
    ],
    variants: [
      { label: "512 GB", url: "https://meli.la/1b1hRfv" },
      { label: "256 GB", url: "https://meli.la/2gZiBfY" },
    ],
  },
  {
    code: "DO-004",
    title: "Samsung Galaxy S26 Ultra",
    category: "tecnologia",
    subcategory: "Celulares",
    features: [
      'Pantalla gigante de 6,9"',
      "El procesador más potente de Samsung, con 12 GB de RAM",
      "S Pen integrado",
      "Cámara principal de 200 MP que graba hasta en 8K",
      "Zoom óptico 10x",
      "Funciones Galaxy AI",
    ],
    images: [
      "img/do-004/duo.webp",
      "img/do-004/front.webp",
      "img/do-004/back.webp",
      "img/do-004/side.webp",
      "img/do-004/serie.webp",
    ],
    url: "https://meli.la/2m39efj",
  },
  {
    code: "DO-007",
    title: "Colchón Emma ThermoSync 2 plazas",
    category: "colchones",
    subcategory: "2 plazas",
    features: [
      "5 capas: espuma viscoelástica y resortes pocket",
      "Tecnología Airgocell: circula el aire y no pasas calor",
      "Resortes pocket con 7 zonas ergonómicas",
      "Soporta hasta 130 kg por lado",
      "Funda removible que va directo a la lavadora",
    ],
    badge: { label: "Recomendado", tone: "hot" },
    images: [
      "img/do-007/capas.webp",
      "img/do-007/dormitorio.webp",
      "img/do-007/funda-textura.webp",
    ],
    url: "https://meli.la/2VxPqC7",
  },
  {
    code: "DO-003",
    title: "Mercado Pago Point Smart 2 · Máquina de pagos",
    category: "tecnologia",
    subcategory: "Pagos y negocio",
    features: ["Acepta débito, crédito y QR", "Imprime boletas", "Dinero al instante"],
    badge: { label: "Más vendido", tone: "top" },
    url: "https://www.mercadolibre.cl/",
  },
  {
    code: "DO-002",
    title: "Caja de luz LED 30×30 cm · Mini estudio fotográfico",
    category: "tecnologia",
    subcategory: "Fotografía",
    features: ["Fotos de producto con fondo limpio", "Plegable y portátil", "Incluye fondos de colores"],
    badge: { label: "Ideal emprendedores", tone: "value" },
    url: "https://www.mercadolibre.cl/",
  },
];
