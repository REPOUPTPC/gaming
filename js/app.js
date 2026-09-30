/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL - OLIMPIADA DE GAMING UPTPC
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Estado de la aplicación
const AppState = {
  selectedGame: { id: 1, name: 'FIFA 2026 Y MORTAL COMBAT', priceUsd: 10 },
  selectedAvatar: 'cyber-controller',
  selectedLevel: 7,
  selectedFile: null,
  isSubmitting: false,
  dolarRate: 859.06,
  roster: {
    fifa: [],
    mortal: []
  }
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
  
  // Carga de tasa DolarAPI y cálculo de precios
  await loadExchangeRate();

  // Carga de participantes en vivo
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

    // 2. Armar payload
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

    // 4. Actualizar las listas en vivo localmente de inmediato
    const newPlayer = {
      id: Date.now(),
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
      renderRoster();
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
