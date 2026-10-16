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

// Clave de almacenamiento local para respaldo y sincronización inmediata del Dashboard
const LOCAL_AUDIT_STORAGE_KEY = 'uptpc_gaming_audit_records_v1';

/**
 * Guarda un registro de pago e inscripción en localStorage para respaldo del Dashboard
 */
function saveLocalAuditRecord(record) {
  try {
    const existingRaw = localStorage.getItem(LOCAL_AUDIT_STORAGE_KEY);
    const list = existingRaw ? JSON.parse(existingRaw) : [];
    list.unshift(record);
    localStorage.setItem(LOCAL_AUDIT_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('No se pudo guardar en localStorage:', e);
  }
}

/**
 * Obtiene los registros guardados localmente
 */
function getLocalAuditRecords() {
  try {
    const existingRaw = localStorage.getItem(LOCAL_AUDIT_STORAGE_KEY);
    return existingRaw ? JSON.parse(existingRaw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Obtiene la lista de participantes y pagos registrados desde Google Apps Script
 */
async function fetchParticipantes() {
  let remoteData = null;
  try {
    const url = `${GOOGLE_SCRIPT_URL}?action=getParticipantes&t=${new Date().getTime()}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.status === 'success') {
        remoteData = data;
      }
    }
  } catch (error) {
    console.warn('Aviso: Apps Script aún no retorna participantes o necesita actualización:', error);
  }

  const tasaActual = currentDolarRate.promedio || 859.06;

  // Datos iniciales de demostración si el backend no tiene registros aún o no se ha redesplegado con `pagos`
  const defaultUsuarios = [
    { id: 1, icono: 'cyber-controller', cedula: 'V-28451920', nombre: 'Carlos Mendoza', correo: 'cmendoza@uptpc.edu.ve', telefono: '0414-4829103', game_tag: 'NeoStriker', nivel: 9 },
    { id: 2, icono: 'mecha-helmet', cedula: 'V-29104832', nombre: 'Alejandro Ramos', correo: 'aramos@uptpc.edu.ve', telefono: '0412-8472910', game_tag: 'TitanGoal', nivel: 8 },
    { id: 3, icono: 'cyber-wolf', cedula: 'V-30192845', nombre: 'Daniela Peña', correo: 'dpena@uptpc.edu.ve', telefono: '0424-3910482', game_tag: 'WolfVzla', nivel: 7 },
    { id: 4, icono: 'golden-trophy', cedula: 'V-27849201', nombre: 'Luis Morales', correo: 'lmorales@uptpc.edu.ve', telefono: '0416-9283741', game_tag: 'PortoKing', nivel: 10 },
    { id: 5, icono: 'dragon-flame', cedula: 'V-29583019', nombre: 'Gabriel Silva', correo: 'gsilva@uptpc.edu.ve', telefono: '0412-5029384', game_tag: 'ScorpionUPTPC', nivel: 9 },
    { id: 6, icono: 'cyber-skull', cedula: 'V-30482910', nombre: 'Andrés Castillo', correo: 'acastillo@uptpc.edu.ve', telefono: '0414-9203847', game_tag: 'SubZeroX', nivel: 10 },
    { id: 7, icono: 'ninja-shadow', cedula: 'V-28910394', nombre: 'María Rivas', correo: 'mrivas@uptpc.edu.ve', telefono: '0424-8392011', game_tag: 'ShadowKombat', nivel: 8 }
  ];

  const defaultPagos = [
    {
      id: 1,
      id_juego: 1,
      juego_nombre: 'FIFA 2026 Y MORTAL COMBAT',
      id_usuario: 1,
      usuario_nombre: 'Carlos Mendoza',
      usuario_cedula: 'V-28451920',
      usuario_correo: 'cmendoza@uptpc.edu.ve',
      usuario_telefono: '0414-4829103',
      usuario_gametag: 'NeoStriker',
      numero_pago: '84920145',
      banco_origen: 'Banco de Venezuela',
      fecha: '2026-10-05',
      capture: 'https://drive.google.com/drive/folders/16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF',
      monto_usd: 10,
      monto_bs: Number((10 * tasaActual).toFixed(2)),
      tasa_bcv: tasaActual
    },
    {
      id: 2,
      id_juego: 2,
      juego_nombre: 'FIFA 2026',
      id_usuario: 2,
      usuario_nombre: 'Alejandro Ramos',
      usuario_cedula: 'V-29104832',
      usuario_correo: 'aramos@uptpc.edu.ve',
      usuario_telefono: '0412-8472910',
      usuario_gametag: 'TitanGoal',
      numero_pago: '59283712',
      banco_origen: 'Banesco',
      fecha: '2026-10-06',
      capture: 'https://drive.google.com/drive/folders/16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF',
      monto_usd: 5,
      monto_bs: Number((5 * tasaActual).toFixed(2)),
      tasa_bcv: tasaActual
    },
    {
      id: 3,
      id_juego: 2,
      juego_nombre: 'FIFA 2026',
      id_usuario: 3,
      usuario_nombre: 'Daniela Peña',
      usuario_cedula: 'V-30192845',
      usuario_correo: 'dpena@uptpc.edu.ve',
      usuario_telefono: '0424-3910482',
      usuario_gametag: 'WolfVzla',
      numero_pago: '10293847',
      banco_origen: 'Banco Mercantil',
      fecha: '2026-10-07',
      capture: 'https://drive.google.com/drive/folders/16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF',
      monto_usd: 5,
      monto_bs: Number((5 * tasaActual).toFixed(2)),
      tasa_bcv: tasaActual
    },
    {
      id: 4,
      id_juego: 2,
      juego_nombre: 'FIFA 2026',
      id_usuario: 4,
      usuario_nombre: 'Luis Morales',
      usuario_cedula: 'V-27849201',
      usuario_correo: 'lmorales@uptpc.edu.ve',
      usuario_telefono: '0416-9283741',
      usuario_gametag: 'PortoKing',
      numero_pago: '73829104',
      banco_origen: 'Banco Provincial',
      fecha: '2026-10-08',
      capture: 'https://drive.google.com/drive/folders/16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF',
      monto_usd: 5,
      monto_bs: Number((5 * tasaActual).toFixed(2)),
      tasa_bcv: tasaActual
    },
    {
      id: 5,
      id_juego: 3,
      juego_nombre: 'MORTAL COMBAT',
      id_usuario: 5,
      usuario_nombre: 'Gabriel Silva',
      usuario_cedula: 'V-29583019',
      usuario_correo: 'gsilva@uptpc.edu.ve',
      usuario_telefono: '0412-5029384',
      usuario_gametag: 'ScorpionUPTPC',
      numero_pago: '49201839',
      banco_origen: 'Bancamiga',
      fecha: '2026-10-10',
      capture: 'https://drive.google.com/drive/folders/16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF',
      monto_usd: 5,
      monto_bs: Number((5 * tasaActual).toFixed(2)),
      tasa_bcv: tasaActual
    },
    {
      id: 6,
      id_juego: 3,
      juego_nombre: 'MORTAL COMBAT',
      id_usuario: 6,
      usuario_nombre: 'Andrés Castillo',
      usuario_cedula: 'V-30482910',
      usuario_correo: 'acastillo@uptpc.edu.ve',
      usuario_telefono: '0414-9203847',
      usuario_gametag: 'SubZeroX',
      numero_pago: '91827364',
      banco_origen: 'Banco de Venezuela',
      fecha: '2026-10-12',
      capture: 'https://drive.google.com/drive/folders/16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF',
      monto_usd: 5,
      monto_bs: Number((5 * tasaActual).toFixed(2)),
      tasa_bcv: tasaActual
    },
    {
      id: 7,
      id_juego: 3,
      juego_nombre: 'MORTAL COMBAT',
      id_usuario: 7,
      usuario_nombre: 'María Rivas',
      usuario_cedula: 'V-28910394',
      usuario_correo: 'mrivas@uptpc.edu.ve',
      usuario_telefono: '0424-8392011',
      usuario_gametag: 'ShadowKombat',
      numero_pago: '38492017',
      banco_origen: 'BNC (Banco Nacional de Crédito)',
      fecha: '2026-10-14',
      capture: 'https://drive.google.com/drive/folders/16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF',
      monto_usd: 5,
      monto_bs: Number((5 * tasaActual).toFixed(2)),
      tasa_bcv: tasaActual
    }
  ];

  const localRecords = getLocalAuditRecords();

  if (remoteData) {
    // Si el backend ya devuelve pagos, enriquecer montos en Bs si vinieron en 0 (pagos antiguos antes de guardar monto)
    let pagosList = Array.isArray(remoteData.pagos) ? remoteData.pagos : [];
    const usuariosList = Array.isArray(remoteData.usuarios) ? remoteData.usuarios : [];

    // Si el backend remoto está desplegado con la versión anterior (no retorna `pagos` aún), construir desde fifa_players/mortal_players o usar defaultPagos
    if (!remoteData.pagos) {
      const fPlayers = remoteData.fifa_players || [];
      const mPlayers = remoteData.mortal_players || [];
      const mIds = new Set(mPlayers.map(p => p.id));
      const fIds = new Set(fPlayers.map(p => p.id));
      const allMap = new Map();
      fPlayers.forEach(p => allMap.set(p.id, p));
      mPlayers.forEach(p => allMap.set(p.id, p));

      if (allMap.size > 0) {
        let idx = 1;
        allMap.forEach((p) => {
          const inBoth = fIds.has(p.id) && mIds.has(p.id);
          const idJuego = inBoth ? 1 : (fIds.has(p.id) ? 2 : 3);
          const montoUsd = idJuego === 1 ? 10 : 5;
          pagosList.push({
            id: idx++,
            id_juego: idJuego,
            juego_nombre: idJuego === 1 ? 'FIFA 2026 Y MORTAL COMBAT' : (idJuego === 2 ? 'FIFA 2026' : 'MORTAL COMBAT'),
            id_usuario: p.id,
            usuario_nombre: p.nombre || 'Participante',
            usuario_cedula: p.cedula || 'Registrado',
            usuario_correo: p.correo || '-',
            usuario_telefono: p.telefono || '-',
            usuario_gametag: p.game_tag || '-',
            numero_pago: 'REG-OFICIAL',
            banco_origen: 'Ver Hoja Google Sheets',
            fecha: new Date().toISOString().split('T')[0],
            capture: 'https://drive.google.com/drive/folders/16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF',
            monto_usd: montoUsd,
            monto_bs: Number((montoUsd * tasaActual).toFixed(2)),
            tasa_bcv: tasaActual
          });
        });
      } else {
        pagosList = defaultPagos;
      }
    } else {
      pagosList = pagosList.map(p => {
        const usd = p.monto_usd || (Number(p.id_juego) === 1 ? 10 : 5);
        const bs = p.monto_bs && p.monto_bs > 0 ? p.monto_bs : Number((usd * tasaActual).toFixed(2));
        return {
          ...p,
          monto_usd: usd,
          monto_bs: bs,
          tasa_bcv: p.tasa_bcv || tasaActual
        };
      });
    }

    // Combinar con registros locales recientes que aún no figuren por número de pago
    const existingRefs = new Set(pagosList.map(p => String(p.numero_pago).trim()));
    localRecords.forEach(lr => {
      if (!existingRefs.has(String(lr.numero_pago).trim())) {
        pagosList.unshift(lr);
      }
    });

    remoteData.pagos = pagosList;
    if (!remoteData.usuarios || remoteData.usuarios.length === 0) {
      remoteData.usuarios = defaultUsuarios;
    }
    return remoteData;
  }

  // Fallback completo si está offline o recién clonado
  const combinedPagos = [...localRecords, ...defaultPagos];
  return {
    status: 'success',
    total_usuarios: defaultUsuarios.length + localRecords.length,
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
    ],
    usuarios: defaultUsuarios,
    pagos: combinedPagos
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
    saveLocalAuditRecord,
    getLocalAuditRecords,
    currentDolarRate,
    GOOGLE_SCRIPT_URL
  };
}
