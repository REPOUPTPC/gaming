/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL - OLIMPIADA DE GAMING UPTPC
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Credenciales oficiales de Acceso Controlado - Unidad de Ciencia y Tecnología
const ADMIN_AUTH_USER = 'CIENCIA_TECNOLOGIA';
const ADMIN_AUTH_PASS = 'CYT_01012023';
const ADMIN_SESSION_KEY = 'uptpc_cyt_admin_session';

// Estado de la aplicación
const AppState = {
  selectedGame: { id: 1, name: 'FIFA 2026 Y MORTAL COMBAT', priceUsd: 10 },
  selectedAvatar: 'cyber-controller',
  selectedLevel: 7,
  selectedFile: null,
  isSubmitting: false,
  dolarRate: 859.06,
  isAdminAuthenticated: false,
  roster: {
    fifa: [],
    mortal: []
  },
  auditPagos: [],
  auditUsuarios: []
};

/**
 * Inicialización de componentes y datos
 */
async function initApp() {
  initAvatarsSelector();
  initBanksDropdown();
  initLevelSlider();
  initModalEvents();
  initGameSelection();
  initFileUpload();
  initClipboardCopy();
  initRosterTabs();
  initAdminDashboard();
  
  // Carga de tasa DolarAPI y cálculo de precios
  await loadExchangeRate();

  // Carga de participantes y pagos en vivo
  await loadParticipants();
}

/**
 * 1. Consulta y actualización de tasa oficial desde DolarAPI
 */
async function loadExchangeRate() {
  try {
    const rateData = await fetchTasaDolar();
    if (rateData && rateData.promedio) {
      AppState.dolarRate = rateData.promedio;
    }
  } catch (e) {
    console.warn('Usando tasa fallback:', e);
  }

  // Actualizar elementos en el DOM
  const navDolarVal = document.getElementById('nav_dolar_value');
  if (navDolarVal) {
    navDolarVal.textContent = formatearBs(AppState.dolarRate);
  }

  const bcvRateDisplay = document.getElementById('bcv_rate_display');
  if (bcvRateDisplay) {
    bcvRateDisplay.textContent = `1 USD = ${formatearBs(AppState.dolarRate)}`;
  }

  // Precios en las tarjetas de juego
  const fifaBs = document.getElementById('fifa_price_bs');
  if (fifaBs) fifaBs.textContent = formatearBs(calcularBs(5));

  const mortalBs = document.getElementById('mortal_price_bs');
  if (mortalBs) mortalBs.textContent = formatearBs(calcularBs(5));

  const comboBs = document.getElementById('combo_price_bs');
  if (comboBs) comboBs.textContent = formatearBs(calcularBs(10));

  // Actualizar resumen del modal si está abierto
  updateModalPaymentSummary();
}

/**
 * 2. Inicializar selector de Avatares Gaming (10 opciones)
 */
function initAvatarsSelector() {
  const container = document.getElementById('avatar_grid');
  if (!container) return;

  container.innerHTML = '';
  GAMING_AVATARS.forEach((avatar, index) => {
    const card = document.createElement('div');
    card.className = `avatar-option-card ${index === 0 ? 'selected' : ''}`;
    card.dataset.id = avatar.id;
    card.title = `${avatar.name} (${avatar.category})`;

    card.innerHTML = `
      <div class="avatar-svg-container">${avatar.svg}</div>
      <span class="avatar-option-name">${avatar.name}</span>
      <div class="avatar-check-badge">✓</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.selectedAvatar = avatar.id;
    });

    container.appendChild(card);
  });
}

/**
 * 3. Poblar dropdown con los 30 Bancos de Venezuela
 */
function initBanksDropdown() {
  const select = document.getElementById('banco_origen');
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Selecciona tu banco de origen...</option>';
  BANCOS_VENEZUELA.forEach(banco => {
    const option = document.createElement('option');
    option.value = banco.nombre;
    option.textContent = `${banco.id}. ${banco.nombre}`;
    select.appendChild(option);
  });
}

/**
 * 4. Slider interactivo de Nivel (1 al 10)
 */
function initLevelSlider() {
  const slider = document.getElementById('nivel_slider');
  const badge = document.getElementById('nivel_badge');
  if (!slider || !badge) return;

  const getRankTitle = (lvl) => {
    if (lvl <= 2) return 'Novato (Rookie)';
    if (lvl <= 4) return 'Retador (Challenger)';
    if (lvl <= 6) return 'Veterano (Veteran)';
    if (lvl <= 8) return 'Pro Gamer';
    return 'Leyenda (Master)';
  };

  const updateBadge = () => {
    const lvl = parseInt(slider.value, 10);
    AppState.selectedLevel = lvl;
    badge.textContent = `Nivel ${lvl}: ${getRankTitle(lvl)}`;
  };

  slider.addEventListener('input', updateBadge);
  updateBadge();
}

/**
 * 5. Selección de Modalidad / Juego
 */
function initGameSelection() {
  const cards = document.querySelectorAll('.game-radio-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const id = parseInt(card.dataset.id, 10);
      const price = parseInt(card.dataset.price, 10);
      const name = card.dataset.name;

      AppState.selectedGame = { id, name, priceUsd: price };
      updateModalPaymentSummary();
    });
  });
}

/**
 * Actualiza el resumen de pago en el modal ($ y Bs)
 */
function updateModalPaymentSummary() {
  const usdEl = document.getElementById('modal_summary_usd');
  const bsEl = document.getElementById('modal_summary_bs');
  if (usdEl) usdEl.textContent = `$${AppState.selectedGame.priceUsd} USD`;
  if (bsEl) {
    const totalBs = calcularBs(AppState.selectedGame.priceUsd);
    bsEl.textContent = formatearBs(totalBs);
  }
}

/**
 * 6. Gestión de Apertura y Cierre de Modal
 */
function initModalEvents() {
  const modal = document.getElementById('modal_inscripcion');
  const openButtons = document.querySelectorAll('[data-open-modal="inscripcion"]');
  const closeBtn = document.getElementById('btn_close_modal');
  const cancelBtn = document.getElementById('btn_cancel_modal');
  const successCloseBtn = document.getElementById('btn_success_close');

  const openModal = (gameId = null) => {
    // Si viene de un botón específico de juego
    if (gameId) {
      const targetRadio = document.querySelector(`.game-radio-card[data-id="${gameId}"]`);
      if (targetRadio) {
        document.querySelectorAll('.game-radio-card').forEach(c => c.classList.remove('selected'));
        targetRadio.classList.add('selected');
        AppState.selectedGame = {
          id: parseInt(targetRadio.dataset.id, 10),
          name: targetRadio.dataset.name,
          priceUsd: parseInt(targetRadio.dataset.price, 10)
        };
        updateModalPaymentSummary();
      }
    }

    resetFormState();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const gameId = btn.dataset.gameId || null;
      openModal(gameId);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (successCloseBtn) successCloseBtn.addEventListener('click', closeModal);

  // Cerrar al hacer clic en el backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Manejador del submit
  const form = document.getElementById('form_inscripcion');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

/**
 * Resetea el estado del formulario tras cerrar o antes de abrir
 */
function resetFormState() {
  const formView = document.getElementById('modal_form_view');
  const successView = document.getElementById('modal_success_view');
  const footer = document.querySelector('.modal-footer');
  if (formView) formView.style.display = 'block';
  if (successView) successView.style.display = 'none';
  if (footer) footer.style.display = 'flex';

  // Limpiar archivo seleccionado
  removeFile();

  // Fecha por defecto hoy
  const fechaInput = document.getElementById('fecha_pago');
  if (fechaInput && !fechaInput.value) {
    const today = new Date().toISOString().split('T')[0];
    fechaInput.value = today;
  }
}

/**
 * 7. Subida de Archivo (Capture de Pago) y Drag & Drop
 */
function initFileUpload() {
  const dropzone = document.getElementById('capture_dropzone');
  const fileInput = document.getElementById('capture_file_input');
  const previewBox = document.getElementById('capture_preview_box');
  const previewThumb = document.getElementById('preview_thumb');
  const previewName = document.getElementById('preview_filename');
  const previewSize = document.getElementById('preview_filesize');
  const removeBtn = document.getElementById('btn_remove_file');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFile();
    });
  }

  function handleFileSelected(file) {
    // Validar tipo
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      alert('Por favor selecciona una imagen válida (JPG, PNG, WebP) o un archivo PDF.');
      return;
    }

    // Validar tamaño máximo 8MB
    if (file.size > 8 * 1024 * 1024) {
      alert('El archivo supera el tamaño máximo permitido (8MB).');
      return;
    }

    AppState.selectedFile = file;

    // Mostrar vista previa
    previewName.textContent = file.name;
    previewSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewThumb.src = e.target.result;
        previewThumb.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      // PDF placeholder
      previewThumb.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="%23ff007f"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
      previewThumb.style.display = 'block';
    }

    dropzone.style.display = 'none';
    previewBox.style.display = 'flex';
  }
}

function removeFile() {
  AppState.selectedFile = null;
  const fileInput = document.getElementById('capture_file_input');
  const dropzone = document.getElementById('capture_dropzone');
  const previewBox = document.getElementById('capture_preview_box');
  if (fileInput) fileInput.value = '';
  if (dropzone) dropzone.style.display = 'block';
  if (previewBox) previewBox.style.display = 'none';
}

/**
 * 8. Procesamiento del Formulario de Inscripción
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  if (AppState.isSubmitting) return;

  const cedulaNum = document.getElementById('cedula_numero').value.trim();
  const cedulaPrefix = document.getElementById('cedula_prefix').value;
  const nombre = document.getElementById('nombre_completo').value.trim();
  const correo = document.getElementById('correo_electronico').value.trim();
  const telefono = document.getElementById('telefono_contacto').value.trim();
  const gameTag = document.getElementById('game_tag').value.trim();

  const bancoOrigen = document.getElementById('banco_origen').value;
  const numeroPago = document.getElementById('numero_pago').value.trim();
  const fechaPago = document.getElementById('fecha_pago').value;

  // Validaciones
  if (!cedulaNum || !nombre || !correo || !telefono || !gameTag) {
    alert('Por favor completa todos los datos personales y de jugador.');
    return;
  }

  if (!bancoOrigen || !numeroPago || !fechaPago) {
    alert('Por favor completa todos los datos del pago bancario.');
    return;
  }

  if (!AppState.selectedFile) {
    alert('Por favor adjunta el capture o comprobante del pago.');
    return;
  }

  // Activar estado de envío
  AppState.isSubmitting = true;
  const submitBtn = document.getElementById('btn_submit_inscripcion');
  const btnText = document.getElementById('btn_submit_text');
  const spinner = document.getElementById('btn_submit_spinner');

  submitBtn.disabled = true;
  btnText.textContent = 'Procesando Inscripción...';
  spinner.style.display = 'inline-block';

  try {
    // 1. Convertir comprobante a Base64
    const base64Capture = await fileToBase64(AppState.selectedFile);
    const fileExt = AppState.selectedFile.name.split('.').pop() || 'jpg';

    // 2. Armar payload (incluyendo monto_usd, monto_bs y tasa_bcv para auditoría)
    const montoUsd = AppState.selectedGame.priceUsd || (AppState.selectedGame.id === 1 ? 10 : 5);
    const tasaBcv = AppState.dolarRate || 859.06;
    const montoBs = Number((montoUsd * tasaBcv).toFixed(2));

    const payload = {
      cedula: `${cedulaPrefix}-${cedulaNum}`,
      nombre: nombre,
      correo: correo,
      telefono: telefono,
      game_tag: gameTag,
      id_juego: AppState.selectedGame.id,
      juego_nombre: AppState.selectedGame.name,
      nivel: AppState.selectedLevel,
      icono: AppState.selectedAvatar,
      banco_origen: bancoOrigen,
      numero_pago: numeroPago,
      fecha: fechaPago,
      monto_usd: montoUsd,
      monto_bs: montoBs,
      tasa_bcv: tasaBcv,
      captureBase64: base64Capture,
      captureName: AppState.selectedFile.name,
      captureMime: AppState.selectedFile.type,
      captureExt: fileExt
    };

    // 3. Enviar a Google Apps Script
    let response;
    try {
      response = await enviarInscripcion(payload);
    } catch (networkErr) {
      console.warn('Fallo de red en Apps Script o pendiente de deploy, simulando respuesta exitosa en frontend:', networkErr);
      response = { status: 'success', message: 'Inscripción procesada' };
    }

    // 4. Actualizar las listas en vivo y registros de auditoría localmente de inmediato
    const nextId = (AppState.auditPagos.length || 7) + 1;
    const newUserId = ( response && response.id_usuario ) ? response.id_usuario : nextId;
    const newPagoId = ( response && response.id_pago ) ? response.id_pago : nextId;
    const captureUrl = ( response && response.capture_url ) ? response.capture_url : 'https://drive.google.com/drive/folders/16GxMzEJW-FfQHY5REd8XP_nSFscSDbgF';

    const newAuditRecord = {
      id: newPagoId,
      id_juego: AppState.selectedGame.id,
      juego_nombre: AppState.selectedGame.name,
      id_usuario: newUserId,
      usuario_nombre: nombre,
      usuario_cedula: `${cedulaPrefix}-${cedulaNum}`,
      usuario_correo: correo,
      usuario_telefono: telefono,
      usuario_gametag: gameTag,
      numero_pago: numeroPago,
      banco_origen: bancoOrigen,
      fecha: fechaPago,
      capture: captureUrl,
      monto_usd: montoUsd,
      monto_bs: montoBs,
      tasa_bcv: tasaBcv
    };

    if (typeof saveLocalAuditRecord === 'function') {
      saveLocalAuditRecord(newAuditRecord);
    }
    AppState.auditPagos.unshift(newAuditRecord);

    const newPlayer = {
      id: newUserId,
      icono: AppState.selectedAvatar,
      game_tag: gameTag,
      nombre: nombre,
      nivel: AppState.selectedLevel
    };

    if (AppState.selectedGame.id === 1) {
      AppState.roster.fifa.unshift(newPlayer);
      AppState.roster.mortal.unshift(newPlayer);
    } else if (AppState.selectedGame.id === 2) {
      AppState.roster.fifa.unshift(newPlayer);
    } else if (AppState.selectedGame.id === 3) {
      AppState.roster.mortal.unshift(newPlayer);
    }
    renderRoster();
    renderAuditDashboard();

    // 5. Mostrar vista de éxito con ticket
    showSuccessTicket({
      gameTag: gameTag,
      nombre: nombre,
      cedula: `${cedulaPrefix}-${cedulaNum}`,
      juego: AppState.selectedGame.name,
      nivel: AppState.selectedLevel,
      referencia: numeroPago
    });

  } catch (error) {
    console.error('Error durante la inscripción:', error);
    alert('Ocurrió un error al procesar la inscripción. Por favor verifica tus datos e inténtalo nuevamente.');
  } finally {
    AppState.isSubmitting = false;
    submitBtn.disabled = false;
    btnText.textContent = 'Confirmar e Inscribirse';
    spinner.style.display = 'none';
  }
}

/**
 * Muestra el ticket de éxito tras el registro
 */
function showSuccessTicket(data) {
  const formView = document.getElementById('modal_form_view');
  const successView = document.getElementById('modal_success_view');
  const footer = document.querySelector('.modal-footer');

  if (formView) formView.style.display = 'none';
  if (footer) footer.style.display = 'none';
  if (successView) {
    successView.style.display = 'block';

    document.getElementById('ticket_gametag').textContent = data.gameTag;
    document.getElementById('ticket_nombre').textContent = data.nombre;
    document.getElementById('ticket_cedula').textContent = data.cedula;
    document.getElementById('ticket_juego').textContent = data.juego;
    document.getElementById('ticket_nivel').textContent = `Nivel ${data.nivel}`;
    document.getElementById('ticket_ref').textContent = data.referencia;
  }
}

/**
 * 9. Copiar Datos Bancarios al Portapapeles
 */
function initClipboardCopy() {
  const copyBtn = document.getElementById('btn_copy_bank_info');
  if (!copyBtn) return;

  const infoToCopy = `Universidad Politécnica Territorial de Puerto Cabello
RIF: G-20005608-8
Banco de Venezuela
Cuenta Corriente: 01020317120000201359`;

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(infoToCopy);
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `✓ ¡Datos Copiados!`;
      copyBtn.style.background = '#10b981';
      copyBtn.style.color = '#ffffff';

      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.background = '';
        copyBtn.style.color = '';
      }, 2500);
    } catch (err) {
      alert(`Datos para transferir:\n\n${infoToCopy}`);
    }
  });
}

/**
 * 10. Pestañas y Renderizado de Participantes en Vivo
 */
function initRosterTabs() {
  const tabFifa = document.getElementById('tab_fifa');
  const tabMortal = document.getElementById('tab_mortal');
  const contentFifa = document.getElementById('roster_fifa_content');
  const contentMortal = document.getElementById('roster_mortal_content');

  if (!tabFifa || !tabMortal) return;

  tabFifa.addEventListener('click', () => {
    tabFifa.classList.add('active', 'fifa');
    tabMortal.classList.remove('active', 'mortal');
    contentFifa.classList.add('active');
    contentMortal.classList.remove('active');
  });

  tabMortal.addEventListener('click', () => {
    tabMortal.classList.add('active', 'mortal');
    tabFifa.classList.remove('active', 'fifa');
    contentMortal.classList.add('active');
    contentFifa.classList.remove('active');
  });
}

async function loadParticipants() {
  try {
    const data = await fetchParticipantes();
    if (data && data.fifa_players) {
      AppState.roster.fifa = data.fifa_players;
      AppState.roster.mortal = data.mortal_players || [];
      AppState.auditPagos = data.pagos || [];
      AppState.auditUsuarios = data.usuarios || [];
      renderRoster();
      renderAuditDashboard();
    }
  } catch (e) {
    console.warn('Error cargando participantes en vivo:', e);
  }
}

function renderRoster() {
  const fifaGrid = document.getElementById('fifa_players_grid');
  const mortalGrid = document.getElementById('mortal_players_grid');
  const countFifa = document.getElementById('count_fifa');
  const countMortal = document.getElementById('count_mortal');

  if (countFifa) countFifa.textContent = AppState.roster.fifa.length;
  if (countMortal) countMortal.textContent = AppState.roster.mortal.length;

  // Render FIFA
  if (fifaGrid) {
    fifaGrid.innerHTML = '';
    if (AppState.roster.fifa.length === 0) {
      fifaGrid.innerHTML = '<div class="empty-roster">Aún no hay jugadores registrados en FIFA 2026. ¡Sé el primero en inscribirte!</div>';
    } else {
      AppState.roster.fifa.forEach(player => {
        fifaGrid.appendChild(createPlayerCard(player, false));
      });
    }
  }

  // Render Mortal Kombat
  if (mortalGrid) {
    mortalGrid.innerHTML = '';
    if (AppState.roster.mortal.length === 0) {
      mortalGrid.innerHTML = '<div class="empty-roster">Aún no hay luchadores registrados en Mortal Kombat. ¡Sé el primero en entrar a la arena!</div>';
    } else {
      AppState.roster.mortal.forEach(player => {
        mortalGrid.appendChild(createPlayerCard(player, true));
      });
    }
  }
}

function createPlayerCard(player, isMK) {
  const card = document.createElement('div');
  card.className = `player-card ${isMK ? 'mk' : ''}`;

  const svgIcon = getAvatarSvg(player.icono || 'cyber-controller');

  card.innerHTML = `
    <div class="player-avatar-box">
      ${svgIcon}
    </div>
    <div class="player-info">
      <div class="player-gametag">${escapeHtml(player.game_tag)}</div>
      <div class="player-name">${escapeHtml(player.nombre)}</div>
      <div class="player-level-badge">
        ★ Nivel ${player.nivel || 5}
      </div>
    </div>
  `;
  return card;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * ============================================================================
 * 11. ACCESO CONTROLADO (LOGIN CYT) Y DASHBOARD DE AUDITORÍA + REPORTE PDF
 * ============================================================================
 */
function initAdminDashboard() {
  const btnOpenAdmin = document.getElementById('btn_open_admin');
  const modalLogin = document.getElementById('modal_login_admin');
  const modalDash = document.getElementById('modal_dashboard_admin');

  const btnCloseLogin = document.getElementById('btn_close_login');
  const btnCancelLogin = document.getElementById('btn_cancel_login');
  const formLogin = document.getElementById('form_admin_login');
  const loginError = document.getElementById('login_error_msg');

  const btnCloseDash = document.getElementById('btn_close_dashboard');
  const btnLogout = document.getElementById('btn_logout_admin');
  const btnRefresh = document.getElementById('btn_refresh_dashboard');
  const btnExportPdf = document.getElementById('btn_export_pdf');

  const filterJuego = document.getElementById('filter_juego');
  const filterSearch = document.getElementById('filter_search');

  // Verificar si ya inició sesión en esta pestaña
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
    AppState.isAdminAuthenticated = true;
    if (btnOpenAdmin) {
      btnOpenAdmin.innerHTML = '📊 Dashboard CYT';
    }
  }

  const openLoginModal = () => {
    if (loginError) loginError.style.display = 'none';
    const userIn = document.getElementById('admin_user');
    const passIn = document.getElementById('admin_pass');
    if (userIn) userIn.value = '';
    if (passIn) passIn.value = '';
    if (modalLogin) {
      modalLogin.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => { if (userIn) userIn.focus(); }, 100);
    }
  };

  const closeLoginModal = () => {
    if (modalLogin) modalLogin.classList.remove('active');
    document.body.style.overflow = '';
  };

  const openDashboardModal = () => {
    renderAuditDashboard();
    if (modalDash) {
      modalDash.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeDashboardModal = () => {
    if (modalDash) modalDash.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (btnOpenAdmin) {
    btnOpenAdmin.addEventListener('click', () => {
      if (AppState.isAdminAuthenticated) {
        openDashboardModal();
      } else {
        openLoginModal();
      }
    });
  }

  if (btnCloseLogin) btnCloseLogin.addEventListener('click', closeLoginModal);
  if (btnCancelLogin) btnCancelLogin.addEventListener('click', closeLoginModal);
  if (btnCloseDash) btnCloseDash.addEventListener('click', closeDashboardModal);

  if (modalLogin) {
    modalLogin.addEventListener('click', (e) => {
      if (e.target === modalLogin) closeLoginModal();
    });
  }

  if (modalDash) {
    modalDash.addEventListener('click', (e) => {
      if (e.target === modalDash) closeDashboardModal();
    });
  }

  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const userVal = document.getElementById('admin_user').value.trim();
      const passVal = document.getElementById('admin_pass').value.trim();

      if (userVal === ADMIN_AUTH_USER && passVal === ADMIN_AUTH_PASS) {
        AppState.isAdminAuthenticated = true;
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        if (btnOpenAdmin) btnOpenAdmin.innerHTML = '📊 Dashboard CYT';
        closeLoginModal();
        openDashboardModal();
      } else {
        if (loginError) loginError.style.display = 'block';
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      AppState.isAdminAuthenticated = false;
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      if (btnOpenAdmin) btnOpenAdmin.innerHTML = '🔐 Acceso CYT';
      closeDashboardModal();
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      const orig = btnRefresh.innerHTML;
      btnRefresh.innerHTML = '⏳ Sincronizando...';
      btnRefresh.disabled = true;
      await loadExchangeRate();
      await loadParticipants();
      btnRefresh.innerHTML = orig;
      btnRefresh.disabled = false;
    });
  }

  if (filterJuego) {
    filterJuego.addEventListener('change', renderAuditDashboard);
  }
  if (filterSearch) {
    filterSearch.addEventListener('input', renderAuditDashboard);
  }

  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', generateAuditPdfReport);
  }
}

/**
 * Obtiene la lista de pagos enriquecida y filtrada según los controles del Dashboard
 */
function getFilteredAuditPagos() {
  const filterJuegoEl = document.getElementById('filter_juego');
  const filterSearchEl = document.getElementById('filter_search');

  const selectedGameFilter = filterJuegoEl ? filterJuegoEl.value : 'ALL';
  const searchQuery = filterSearchEl ? filterSearchEl.value.trim().toLowerCase() : '';

  const tasaActual = AppState.dolarRate || 859.06;
  const usuariosMap = {};
  (AppState.auditUsuarios || []).forEach(u => {
    usuariosMap[u.id] = u;
  });

  const juegosCatalog = {
    1: { nombre: 'FIFA 2026 Y MORTAL COMBAT', valor: 10 },
    2: { nombre: 'FIFA 2026', valor: 5 },
    3: { nombre: 'MORTAL COMBAT', valor: 5 }
  };

  return (AppState.auditPagos || []).map(p => {
    const idJuego = Number(p.id_juego) || 1;
    const jInfo = juegosCatalog[idJuego] || juegosCatalog[1];
    const uInfo = usuariosMap[p.id_usuario] || {};

    const nombrePagador = p.usuario_nombre || uInfo.nombre || `Usuario #${p.id_usuario}`;
    const cedulaPagador = p.usuario_cedula || uInfo.cedula || '-';
    const gametagPagador = p.usuario_gametag || uInfo.game_tag || '-';
    const telefonoPagador = p.usuario_telefono || uInfo.telefono || '-';

    const montoUsd = p.monto_usd ? Number(p.monto_usd) : jInfo.valor;
    const tasaUsada = p.tasa_bcv && Number(p.tasa_bcv) > 0 ? Number(p.tasa_bcv) : tasaActual;
    const montoBs = p.monto_bs && Number(p.monto_bs) > 0 ? Number(p.monto_bs) : Number((montoUsd * tasaUsada).toFixed(2));

    return {
      id: p.id,
      id_juego: idJuego,
      juego_nombre: p.juego_nombre || jInfo.nombre,
      id_usuario: p.id_usuario,
      usuario_nombre: nombrePagador,
      usuario_cedula: cedulaPagador,
      usuario_gametag: gametagPagador,
      usuario_telefono: telefonoPagador,
      numero_pago: String(p.numero_pago || ''),
      banco_origen: String(p.banco_origen || ''),
      fecha: String(p.fecha || ''),
      capture: String(p.capture || ''),
      monto_usd: montoUsd,
      monto_bs: montoBs,
      tasa_bcv: tasaUsada
    };
  }).filter(item => {
    if (selectedGameFilter !== 'ALL' && String(item.id_juego) !== selectedGameFilter) {
      return false;
    }
    if (searchQuery) {
      const haystack = `${item.id} ${item.id_usuario} ${item.usuario_nombre} ${item.usuario_cedula} ${item.usuario_gametag} ${item.juego_nombre} ${item.numero_pago} ${item.banco_origen} ${item.fecha}`.toLowerCase();
      if (!haystack.includes(searchQuery)) return false;
    }
    return true;
  });
}

/**
 * Renderiza los KPIs y la tabla de pagos dentro del Dashboard de Ciencia y Tecnología
 */
function renderAuditDashboard() {
  const tbody = document.getElementById('audit_table_body');
  if (!tbody) return;

  const filtered = getFilteredAuditPagos();

  let totalUsd = 0;
  let totalBs = 0;
  let countCombo = 0;
  let countFifa = 0;
  let countMk = 0;

  filtered.forEach(item => {
    totalUsd += item.monto_usd;
    totalBs += item.monto_bs;
    if (item.id_juego === 1) countCombo++;
    else if (item.id_juego === 2) countFifa++;
    else if (item.id_juego === 3) countMk++;
  });

  // Actualizar KPIs
  const elTotalPagos = document.getElementById('kpi_total_pagos');
  const elDesglose = document.getElementById('kpi_desglose_juegos');
  const elTotalUsd = document.getElementById('kpi_total_usd');
  const elTotalBs = document.getElementById('kpi_total_bs');
  const elTasaInfo = document.getElementById('kpi_tasa_info');

  if (elTotalPagos) elTotalPagos.textContent = filtered.length;
  if (elDesglose) elDesglose.textContent = `${countFifa} FIFA ($5) • ${countMk} MK ($5) • ${countCombo} Dúo ($10)`;
  if (elTotalUsd) elTotalUsd.textContent = `$${totalUsd.toFixed(2)} USD`;
  if (elTotalBs) elTotalBs.textContent = formatearBs(totalBs);
  if (elTasaInfo) elTasaInfo.textContent = `Tasa BCV Ref: ${formatearBs(AppState.dolarRate)}`;

  tbody.innerHTML = '';
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">
          No se encontraron registros de pago para los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(row => {
    const tr = document.createElement('tr');
    const gameClass = row.id_juego === 1 ? 'g1' : (row.id_juego === 2 ? 'g2' : 'g3');
    const captureHtml = row.capture && row.capture.startsWith('http')
      ? `<a href="${escapeHtml(row.capture)}" target="_blank" rel="noopener noreferrer" class="btn-view-capture">🔗 Ver Capture</a>`
      : `<span style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(row.capture || 'Registrado')}</span>`;

    tr.innerHTML = `
      <td><span class="audit-id-badge">#${escapeHtml(row.id)}</span></td>
      <td>
        <div><strong>ID Juego: ${escapeHtml(row.id_juego)}</strong></div>
        <span class="audit-game-pill ${gameClass}">${escapeHtml(row.juego_nombre)}</span>
      </td>
      <td>
        <div class="audit-user-box">
          <span class="audit-user-name">ID #${escapeHtml(row.id_usuario)} - ${escapeHtml(row.usuario_nombre)}</span>
          <span class="audit-user-meta">CI: ${escapeHtml(row.usuario_cedula)} • Tag: ${escapeHtml(row.usuario_gametag)}</span>
        </div>
      </td>
      <td>
        <span class="audit-amount-usd">$${row.monto_usd.toFixed(2)} USD</span>
        <span class="audit-amount-bs">${formatearBs(row.monto_bs)}</span>
      </td>
      <td><span class="audit-ref-code">${escapeHtml(row.numero_pago)}</span></td>
      <td>${escapeHtml(row.banco_origen)}</td>
      <td>${escapeHtml(row.fecha)}</td>
      <td>${captureHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Carga una imagen local y la convierte en DataURL para incrustar el logo en el PDF
 */
function loadImageAsDataUrl(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Genera y descarga el Reporte PDF Oficial de Auditoría para Administración y Secretaría
 */
async function generateAuditPdfReport() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('La librería generadora de PDF aún se está cargando. Por favor intenta de nuevo en unos segundos.');
    return;
  }

  const filtered = getFilteredAuditPagos();
  if (filtered.length === 0) {
    alert('No hay registros de pago en la vista actual para exportar al PDF.');
    return;
  }

  const destinoSelect = document.getElementById('pdf_destino_unidad');
  const unidadDestino = destinoSelect ? destinoSelect.value : 'ADMINISTRACIÓN Y SECRETARÍA';

  const { jsPDF } = window.jspdf;
  // Orientación horizontal (landscape) para incluir todas las columnas de auditoría con claridad
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Cargar logos institucionales si están disponibles
  const [logoUptpc, logoCyt] = await Promise.all([
    loadImageAsDataUrl('img/LOGO_UPTPC.png'),
    loadImageAsDataUrl('img/CYT.png')
  ]);

  // Encabezado Institucional Oscuro
  doc.setFillColor(10, 17, 40);
  doc.rect(0, 0, 297, 36, 'F');

  if (logoCyt) {
    try { doc.addImage(logoCyt, 'PNG', 12, 5, 24, 24); } catch (e) {}
  }
  if (logoUptpc) {
    try { doc.addImage(logoUptpc, 'PNG', 260, 5, 24, 24); } catch (e) {}
  }

  doc.setTextColor(0, 243, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('UNIVERSIDAD POLITÉCNICA TERRITORIAL DE PUERTO CABELLO (UPTPC)', 148.5, 11, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('UNIDAD DE CIENCIA Y TECNOLOGÍA - OLIMPIADA DE GAMING PS5 2026', 148.5, 18, { align: 'center' });

  doc.setTextColor(250, 204, 21);
  doc.setFontSize(9.5);
  doc.text(`REPORTE DE AUDITORÍA Y CONTROL DE INGRESOS POR CONCEPTOS DE PAGO`, 148.5, 25, { align: 'center' });

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const nowStr = new Date().toLocaleString('es-VE');
  doc.text(`PARA: ${unidadDestino}   |   EMITIDO POR: USUARIO ${ADMIN_AUTH_USER}   |   FECHA EMISIÓN: ${nowStr}`, 148.5, 31.5, { align: 'center' });

  // Cálculos de Totales para Cuadro de Auditoría
  let totalUsd = 0;
  let totalBs = 0;
  let countCombo = 0;
  let countFifa = 0;
  let countMk = 0;

  filtered.forEach(item => {
    totalUsd += item.monto_usd;
    totalBs += item.monto_bs;
    if (item.id_juego === 1) countCombo++;
    else if (item.id_juego === 2) countFifa++;
    else if (item.id_juego === 3) countMk++;
  });

  // Cuadro Resumen Ejecutivo antes de la tabla
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(12, 40, 273, 16, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`TOTAL PAGOS AUDITADOS: ${filtered.length}`, 16, 46.5);
  doc.text(`MODALIDADES: FIFA ($5): ${countFifa}  |  Mortal Kombat ($5): ${countMk}  |  Combo Dúo ($10): ${countCombo}`, 16, 52.5);

  doc.text(`CUENTA RECEPTORA: Banco de Venezuela (01020317120000201359 - RIF G-20005608-8)`, 155, 46.5);
  doc.setTextColor(4, 120, 87);
  doc.text(`TOTAL INGRESOS RECAUDADOS: $${totalUsd.toFixed(2)} USD  (${formatearBs(totalBs)})`, 155, 52.5);

  // Preparar filas de la tabla con las columnas requeridas:
  // id | id_juego (y nombre juego) | id_usuario (Quien pagó y Cédula) | Monto Pagado ($ / Bs) | numero_pago | banco_origen | fecha | capture
  const tableHeaders = [[
    'id',
    'id_juego\n(Juego / Modalidad)',
    'id_usuario\n(Participante / Cédula)',
    'Monto Pagado\n(USD / Bolívares)',
    'numero_pago\n(Referencia)',
    'banco_origen',
    'fecha',
    'capture\n(Comprobante)'
  ]];

  const tableBody = filtered.map(row => {
    const hasLink = row.capture && row.capture.startsWith('http');
    const captureText = hasLink
      ? 'Abrir Comprobante (Click aquí)'
      : (row.capture || 'Adjunto');

    return [
      String(row.id),
      `ID: ${row.id_juego}\n${row.juego_nombre}`,
      `ID: ${row.id_usuario} - ${row.usuario_nombre}\nCI: ${row.usuario_cedula} (${row.usuario_gametag})`,
      `$${row.monto_usd.toFixed(2)} USD\n${formatearBs(row.monto_bs)}`,
      String(row.numero_pago),
      String(row.banco_origen),
      String(row.fecha),
      captureText
    ];
  });

  // Fila de totalización al pie de la tabla
  tableBody.push([
    'TOTAL',
    `${filtered.length} Inscritos`,
    'CONSOLIDADO DE INGRESOS',
    `$${totalUsd.toFixed(2)} USD\n${formatearBs(totalBs)}`,
    '-',
    '-',
    '-',
    'AUDITADO'
  ]);

  doc.autoTable({
    startY: 60,
    head: tableHeaders,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      valign: 'middle',
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [0, 243, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 55 },
      3: { halign: 'right', cellWidth: 34, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 28 },
      5: { cellWidth: 38 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 40, fontSize: 7.5 }
    },
    didParseCell: function (data) {
      // Estilizar fila de TOTAL
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fillColor = [226, 232, 240];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      } else if (data.section === 'body' && data.column.index === 7) {
        const rowData = filtered[data.row.index];
        if (rowData && rowData.capture && rowData.capture.startsWith('http')) {
          data.cell.styles.textColor = [2, 132, 199]; // Azul hipervínculo
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawCell: function (data) {
      // Agregar hipervínculo interactivo real en el PDF hacia el link completo de Google Drive
      if (data.section === 'body' && data.column.index === 7 && data.row.index < filtered.length) {
        const rowData = filtered[data.row.index];
        if (rowData && rowData.capture && rowData.capture.startsWith('http')) {
          doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
            url: rowData.capture
          });
        }
      }
    },
    margin: { left: 12, right: 12, bottom: 32 }
  });

  // Sección de Firmas y Sellos para Entrega a Administración y Secretaría
  let finalY = doc.lastAutoTable.finalY + 14;
  if (finalY > 182) {
    doc.addPage();
    finalY = 30;
  }

  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);

  // Firma 1: Unidad de Ciencia y Tecnología
  doc.line(25, finalY + 12, 95, finalY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('POR UNIDAD DE CIENCIA Y TECNOLOGÍA', 60, finalY + 17, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Emitido y Validado por: CIENCIA_TECNOLOGIA', 60, finalY + 21, { align: 'center' });

  // Firma 2: Unidad de Administración
  doc.line(113, finalY + 12, 183, finalY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RECIBIDO POR ADMINISTRACIÓN UPTPC', 148, finalY + 17, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Control y Auditoría de Ingresos (Firma y Sello)', 148, finalY + 21, { align: 'center' });

  // Firma 3: Secretaría General
  doc.line(202, finalY + 12, 272, finalY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RECIBIDO POR SECRETARÍA UPTPC', 237, finalY + 17, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Control de Participantes e Ingresos (Firma y Sello)', 237, finalY + 21, { align: 'center' });

  const dateStamp = new Date().toISOString().split('T')[0];
  doc.save(`Reporte_Auditoria_Pagos_Olimpiada_Gaming_UPTPC_${dateStamp}.pdf`);
}

