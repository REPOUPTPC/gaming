/**
 * Módulo de API: DolarAPI (Tasa Oficial BCV) y Google Apps Script (Sheets + Drive)
 */

// URL del Web App de Google Apps Script proporcionado por la UPTPC
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwLvCsBNgKJC0TxP7owwUX-tOuLKhB9qkJTO06QOJ8uMacmnj3AnykXOIaMhwGiqSJ6/exec';

// Endpoints de DolarAPI
const DOLAR_API_OFICIAL = 'https://ve.dolarapi.com/v1/dolares/oficial';
const DOLAR_API_ALL = 'https://ve.dolarapi.com/v1/dolares';

// Estado global de la tasa
let currentDolarRate = {
  promedio: 0,
  fecha: null,
  fuente: 'oficial'
};

/**
 * Obtiene la tasa oficial del dólar desde DolarAPI
 */
async function fetchTasaDolar() {
  try {
    let response = await fetch(DOLAR_API_OFICIAL, { cache: 'no-cache' });
    if (response.ok) {
      const data = await response.json();
      if (data && data.promedio) {
        currentDolarRate = {
          promedio: parseFloat(data.promedio),
          fecha: data.fechaActualizacion || new Date().toISOString(),
          fuente: 'oficial'
        };
        return currentDolarRate;
      }
    }
    
    // Intento con el listado general como respaldo
    const fallbackRes = await fetch(DOLAR_API_ALL, { cache: 'no-cache' });
    if (fallbackRes.ok) {
      const list = await fallbackRes.json();
      const oficial = list.find(item => item.fuente === 'oficial') || list[0];
      if (oficial && oficial.promedio) {
        currentDolarRate = {
          promedio: parseFloat(oficial.promedio),
          fecha: oficial.fechaActualizacion || new Date().toISOString(),
          fuente: 'oficial'
        };
        return currentDolarRate;
      }
    }
  } catch (error) {
    console.warn('Error al consultar DolarAPI:', error);
  }

  // Fallback si la API estuviese offline temporalmente
  if (currentDolarRate.promedio === 0) {
    currentDolarRate = {
      promedio: 859.06,
      fecha: new Date().toISOString(),
      fuente: 'oficial (estimado)'
    };
  }
  return currentDolarRate;
}

/**
 * Convierte un monto en USD a Bolívares según la tasa oficial
 */
function calcularBs(montoUsd) {
  const tasa = currentDolarRate.promedio || 859.06;
  return montoUsd * tasa;
}

/**
 * Formatea un número al estilo de moneda venezolana (ej: 4.295,30 Bs.)
 */
function formatearBs(monto) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(monto) + ' Bs.';
}

/**
 * Convierte un archivo File/Blob en Base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Envía los datos de inscripción y capture a Google Apps Script
 */
async function enviarInscripcion(datosInscripcion) {
  try {
    // Usamos text/plain para evitar bloqueos por CORS en Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(datosInscripcion)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error enviando inscripción a Apps Script:', error);
    throw error;
  }
}

/**
 * Obtiene la lista de participantes registrados desde Google Apps Script
 */
async function fetchParticipantes() {
  try {
    const url = `${GOOGLE_SCRIPT_URL}?action=getParticipantes&t=${new Date().getTime()}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.status === 'success') {
        return data;
      }
    }
  } catch (error) {
    console.warn('Aviso: Apps Script aún no retorna participantes o necesita actualización:', error);
  }

  // Lista inicial / demo si la hoja está recién creada o vacía
  return {
    status: 'success',
    total_usuarios: 6,
    fifa_players: [
      { id: 1, icono: 'cyber-controller', game_tag: 'NeoStriker', nombre: 'Carlos Mendoza', nivel: 9 },
      { id: 2, icono: 'mecha-helmet', game_tag: 'TitanGoal', nombre: 'Alejandro Ramos', nivel: 8 },
      { id: 3, icono: 'cyber-wolf', game_tag: 'WolfVzla', nombre: 'Daniela Peña', nivel: 7 },
      { id: 4, icono: 'golden-trophy', game_tag: 'PortoKing', nombre: 'Luis Morales', nivel: 10 }
    ],
    mortal_players: [
      { id: 1, icono: 'cyber-controller', game_tag: 'NeoStriker', nombre: 'Carlos Mendoza', nivel: 8 },
      { id: 5, icono: 'dragon-flame', game_tag: 'ScorpionUPTPC', nombre: 'Gabriel Silva', nivel: 9 },
      { id: 6, icono: 'cyber-skull', game_tag: 'SubZeroX', nombre: 'Andrés Castillo', nivel: 10 },
      { id: 7, icono: 'ninja-shadow', game_tag: 'ShadowKombat', nombre: 'María Rivas', nivel: 8 }
    ]
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchTasaDolar,
    calcularBs,
    formatearBs,
    fileToBase64,
    enviarInscripcion,
    fetchParticipantes,
    currentDolarRate,
    GOOGLE_SCRIPT_URL
  };
}
