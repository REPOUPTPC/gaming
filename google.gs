/**
 * ============================================================================
 * OLIMPIADA DE GAMING UPTPC - BACKEND GOOGLE APPS SCRIPT
 * Organizado por la Unidad de Ciencia y Tecnología (UPTPC)
 * ============================================================================
 * 
 * Instrucciones de Configuración:
 * 1. Abre tu Google Sheets donde deseas almacenar los datos.
 * 2. En el menú superior, ve a: Extensiones > Apps Script.
 * 3. Borra el contenido existente y pega todo este código en el archivo (Código.gs / google.gs).
 * 4. Ejecuta manualmente la función 'setupSheets' una sola vez para crear las hojas y encabezados.
 * 5. Haz clic en "Implementar" > "Nueva implementación".
 *    - Tipo: Aplicación web
 *    - Descripción: API Olimpiada Gaming UPTPC
 *    - Ejecutar como: Yo (tu cuenta de Google)
 *    - Quién tiene acceso: Cualquier usuario (incluso anónimos)
 * 6. Copia la URL de la aplicación web y actualízala si cambia respecto a:
 *    https://script.google.com/macros/s/AKfycbwLvCsBNgKJC0TxP7owwUX-tOuLKhB9qkJTO06QOJ8uMacmnj3AnykXOIaMhwGiqSJ6/exec
 */

// ID de la carpeta de Google Drive donde se guardarán los captures de pago
var DRIVE_FOLDER_ID = '16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF';

// Nombres de las hojas (tablas)
var SHEET_USUARIOS = 'usuarios';
var SHEET_PAGOS = 'pagos';
var SHEET_JUEGOS = 'juegos';

/**
 * Función inicial para configurar las hojas y tablas con sus encabezados
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Hoja Juegos
  var sheetJuegos = ss.getSheetByName(SHEET_JUEGOS);
  if (!sheetJuegos) {
    sheetJuegos = ss.insertSheet(SHEET_JUEGOS);
  }
  if (sheetJuegos.getLastRow() === 0) {
    sheetJuegos.appendRow(['id', 'nombre', 'valor']);
    sheetJuegos.appendRow([1, 'FIFA 2026 Y MORTAL COMBAT', 10]);
    sheetJuegos.appendRow([2, 'FIFA 2026', 5]);
    sheetJuegos.appendRow([3, 'MORTAL COMBAT', 5]);
    formatHeaderRow(sheetJuegos);
  }

  // 2. Hoja Usuarios
  var sheetUsuarios = ss.getSheetByName(SHEET_USUARIOS);
  if (!sheetUsuarios) {
    sheetUsuarios = ss.insertSheet(SHEET_USUARIOS);
  }
  if (sheetUsuarios.getLastRow() === 0) {
    sheetUsuarios.appendRow(['id', 'icono', 'cedula', 'nombre', 'correo', 'telefono', 'game_tag', 'nivel']);
    formatHeaderRow(sheetUsuarios);
  }

  // 3. Hoja Pagos
  var sheetPagos = ss.getSheetByName(SHEET_PAGOS);
  if (!sheetPagos) {
    sheetPagos = ss.insertSheet(SHEET_PAGOS);
  }
  if (sheetPagos.getLastRow() === 0) {
    sheetPagos.appendRow(['id', 'id_juego', 'id_usuario', 'numero_pago', 'banco_origen', 'fecha', 'capture']);
    formatHeaderRow(sheetPagos);
  }

  Logger.log('Tablas inicializadas con éxito en Google Sheets.');
}

/**
 * Formato visual para los encabezados de las hojas
 */
function formatHeaderRow(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground('#0f172a');
  headerRange.setFontColor('#00f3ff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * Manejador de solicitudes GET (Consulta de participantes y Health Check)
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = e && e.parameter && e.parameter.action ? e.parameter.action : 'getParticipantes';

    if (action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: 'API Olimpiada Gaming UPTPC activa y funcionando correctamente',
        timestamp: new Date().toISOString()
      });
    }

    // Obtener listas de participantes
    var sheetUsuarios = ss.getSheetByName(SHEET_USUARIOS);
    var sheetPagos = ss.getSheetByName(SHEET_PAGOS);

    if (!sheetUsuarios || !sheetPagos) {
      setupSheets();
      sheetUsuarios = ss.getSheetByName(SHEET_USUARIOS);
      sheetPagos = ss.getSheetByName(SHEET_PAGOS);
    }

    var usuariosData = sheetUsuarios.getDataRange().getValues();
    var pagosData = sheetPagos.getDataRange().getValues();

    var usuarios = [];
    if (usuariosData.length > 1) {
      for (var i = 1; i < usuariosData.length; i++) {
        var row = usuariosData[i];
        if (!row[0]) continue;
        usuarios.push({
          id: row[0],
          icono: row[1] || 'gamepad',
          cedula: row[2],
          nombre: row[3],
          correo: row[4],
          telefono: row[5],
          game_tag: row[6],
          nivel: row[7]
        });
      }
    }

    var pagos = [];
    if (pagosData.length > 1) {
      for (var j = 1; j < pagosData.length; j++) {
        var pRow = pagosData[j];
        if (!pRow[0]) continue;
        pagos.push({
          id: pRow[0],
          id_juego: Number(pRow[1]),
          id_usuario: pRow[2],
          numero_pago: pRow[3],
          banco_origen: pRow[4],
          fecha: pRow[5],
          capture: pRow[6]
        });
      }
    }

    // Organizar participantes por juego
    // id_juego: 1 = AMBOS, 2 = FIFA 2026, 3 = MORTAL COMBAT
    var fifaPlayers = [];
    var mortalCombatPlayers = [];

    // Mapear pagos de cada usuario
    var userPaymentsMap = {};
    for (var k = 0; k < pagos.length; k++) {
      var pago = pagos[k];
      userPaymentsMap[pago.id_usuario] = pago.id_juego;
    }

    for (var u = 0; u < usuarios.length; u++) {
      var usr = usuarios[u];
      var idJuego = userPaymentsMap[usr.id] || 1; // Por defecto o según pago

      var playerObj = {
        id: usr.id,
        icono: usr.icono,
        game_tag: usr.game_tag,
        nombre: usr.nombre,
        nivel: usr.nivel
      };

      if (idJuego === 1) {
        // Participa en ambos juegos
        fifaPlayers.push(playerObj);
        mortalCombatPlayers.push(playerObj);
      } else if (idJuego === 2) {
        fifaPlayers.push(playerObj);
      } else if (idJuego === 3) {
        mortalCombatPlayers.push(playerObj);
      }
    }

    return jsonResponse({
      status: 'success',
      total_usuarios: usuarios.length,
      fifa_players: fifaPlayers,
      mortal_players: mortalCombatPlayers
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Manejador de solicitudes POST (Registro de usuario, pago y subida de capture)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Esperar hasta 30 segundos para evitar colisiones concurrentes
    lock.waitLock(30000);

    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error('No se recibieron datos en la solicitud.');
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetUsuarios = ss.getSheetByName(SHEET_USUARIOS);
    var sheetPagos = ss.getSheetByName(SHEET_PAGOS);

    if (!sheetUsuarios || !sheetPagos) {
      setupSheets();
      sheetUsuarios = ss.getSheetByName(SHEET_USUARIOS);
      sheetPagos = ss.getSheetByName(SHEET_PAGOS);
    }

    // 1. Guardar archivo en Google Drive si se adjuntó capture
    var captureUrl = '';
    if (data.captureBase64 && data.captureName) {
      try {
        var folder;
        try {
          folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        } catch (fErr) {
          folder = DriveApp.getRootFolder();
        }

        var contentType = data.captureMime || 'image/jpeg';
        var base64Data = data.captureBase64;
        if (base64Data.indexOf('base64,') > -1) {
          base64Data = base64Data.split('base64,')[1];
        }
        var decodedBytes = Utilities.base64Decode(base64Data);
        var filename = 'PAGO_' + (data.cedula || 'USER') + '_' + (data.numero_pago || 'REF') + '_' + new Date().getTime() + '.' + (data.captureExt || 'jpg');
        var blob = Utilities.newBlob(decodedBytes, contentType, filename);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        captureUrl = file.getUrl();
      } catch (uploadErr) {
        Logger.log('Error subiendo archivo a Drive: ' + uploadErr.toString());
        captureUrl = 'Error al subir comprobante: ' + uploadErr.message;
      }
    } else if (data.captureUrl) {
      captureUrl = data.captureUrl;
    }

    // 2. Generar IDs únicos
    var newUserId = (sheetUsuarios.getLastRow() === 1) ? 1 : (Number(sheetUsuarios.getRange(sheetUsuarios.getLastRow(), 1).getValue()) + 1);
    if (isNaN(newUserId) || newUserId <= 0) {
      newUserId = sheetUsuarios.getLastRow();
    }

    var newPagoId = (sheetPagos.getLastRow() === 1) ? 1 : (Number(sheetPagos.getRange(sheetPagos.getLastRow(), 1).getValue()) + 1);
    if (isNaN(newPagoId) || newPagoId <= 0) {
      newPagoId = sheetPagos.getLastRow();
    }

    // 3. Registrar en tabla 'usuarios'
    // Columnas: id, icono, cedula, nombre, correo, telefono, game_tag, nivel
    var icono = data.icono || 'gamepad';
    var cedula = data.cedula ? String(data.cedula).trim() : '';
    var nombre = data.nombre ? String(data.nombre).trim() : '';
    var correo = data.correo ? String(data.correo).trim() : '';
    var telefono = data.telefono ? String(data.telefono).trim() : '';
    var game_tag = data.game_tag ? String(data.game_tag).trim() : '';
    var nivel = data.nivel ? Number(data.nivel) : 5;

    sheetUsuarios.appendRow([
      newUserId,
      icono,
      cedula,
      nombre,
      correo,
      telefono,
      game_tag,
      nivel
    ]);

    // 4. Registrar en tabla 'pagos'
    // Columnas: id, id_juego, id_usuario, numero_pago, banco_origen, fecha, capture
    var id_juego = data.id_juego ? Number(data.id_juego) : 1;
    var numero_pago = data.numero_pago ? String(data.numero_pago).trim() : '';
    var banco_origen = data.banco_origen ? String(data.banco_origen).trim() : '';
    var fecha = data.fecha ? String(data.fecha).trim() : Utilities.formatDate(new Date(), 'GMT-4', 'yyyy-MM-dd');

    sheetPagos.appendRow([
      newPagoId,
      id_juego,
      newUserId,
      numero_pago,
      banco_origen,
      fecha,
      captureUrl
    ]);

    lock.releaseLock();

    return jsonResponse({
      status: 'success',
      message: '¡Inscripción registrada con éxito en la Olimpiada de Gaming UPTPC!',
      id_usuario: newUserId,
      id_pago: newPagoId,
      game_tag: game_tag,
      capture_url: captureUrl
    });

  } catch (error) {
    if (lock) {
      try { lock.releaseLock(); } catch(e) {}
    }
    return jsonResponse({
      status: 'error',
      message: 'Error procesando la inscripción: ' + error.toString()
    });
  }
}

/**
 * Genera la respuesta en formato JSON con cabeceras CORS
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
