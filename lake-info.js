// Creates a themed info modal and exposes window.showLakeInfo(props, latlng)

(function () {
  // inject CSS (uses your CSS variables; fallbacks provided)
  const css = `
  .lake-info-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(2,10,25,0.55);
    z-index: 10050;
    display: none;
  }
  .lake-info-modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    width: min(84vw,520px);
    max-height: 80vh;
    overflow: auto;
    background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
    color: var(--text-on-primary,#fff);
    font-family: var(--body-font,'Poppins, sans-serif');
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.04);
    box-shadow: 0 2px 8px rgba(3,18,36,0.6), 0 0 0 2px rgba(8,53,90,0.95);
    backdrop-filter: blur(45px);
    z-index: 10051;
    padding: 0;
    display: none;
  }
  .lake-info-modal .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: linear-gradient(90deg, rgba(8,53,90,0.95), rgba(11,74,120,0.95));
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }
  .lake-info-modal .modal-title {
    font-family: var(--heading-font,'Montserrat, sans-serif');
    font-weight: 600;
    font-size: 18px;
    color: var(--text-on-primary,#fff);
  }
  .lake-info-modal .modal-close {
    background: transparent;
    border: 0;
    color: var(--text-on-primary,#fff);
    font-size: 24px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  .lake-info-modal .modal-close:hover {
    background: rgba(255,255,255,0.03);
    color: var(--accent);
  }
  .lake-info-modal .modal-body {
    padding: 16px;
    background: white;
    color: var(--primary, #08355a);
    font-size: 14px;
    line-height: 1.6;
  }
  .lake-info-modal .modal-subtitle,
  .lake-info-modal .modal-note {
    color: var(--primary, #08355a);
    padding: 12px;
    margin-bottom: 8px;
    font-size: 13px;
    background: white;
    border-radius: 6px;
    line-height: 1.6;
    box-shadow: 0 1px 3px rgba(8,53,90,0.1);
  }
  .lake-info-modal .modal-note {
    margin-top: 12px;
    white-space: pre-wrap;
  }
  @media (max-width:640px) {
    .lake-info-modal {
      width: 94vw;
      max-height: 86vh;
      border-radius: 8px;
    }
    .lake-info-modal .modal-title {
      font-size: 16px;
    }
  }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // build DOM
  const backdrop = document.createElement('div');
  backdrop.className = 'lake-info-backdrop';
  const modal = document.createElement('div');
  modal.className = 'lake-info-modal';
  modal.innerHTML = `
    <div class="modal-header">
      <div class="modal-title" id="lake-info-title"></div>
      <button class="modal-close" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="modal-subtitle area" id="lake-info-area"></div>
      <div class="modal-subtitle coords" id="lake-info-coords"></div>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:8px 0;">
      <div class="modal-note" id="lake-info-note"></div>
    </div>
  `;
  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  const titleEl = modal.querySelector('#lake-info-title');
  const areaEl = modal.querySelector('#lake-info-area');
  const coordsEl = modal.querySelector('#lake-info-coords');
  const noteEl = modal.querySelector('#lake-info-note');
  const closeBtn = modal.querySelector('.modal-close');

  function show(props = {}, latlng = null) {
    titleEl.textContent = props.name || 'Unknown Lake';
    const areaText = props.area_km2 ?? props['Area (km2)'] ?? props.Area ?? 'unknown';
    areaEl.innerHTML = `<strong>Area:</strong> ${areaText}${areaText !== 'unknown' ? ' km²' : ''}`;
    if (latlng && typeof latlng.lat === 'number' && typeof latlng.lng === 'number') {
      coordsEl.innerHTML = `<strong>Coordinates:</strong> ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    } else {
      coordsEl.textContent = '';
    }
    noteEl.textContent = props.note ?? props.description ?? 'No additional information.';
    backdrop.style.display = 'block';
    modal.style.display = 'block';
    closeBtn.focus();
  }

  function hide() {
    backdrop.style.display = 'none';
    modal.style.display = 'none';
  }

  backdrop.addEventListener('click', hide);
  closeBtn.addEventListener('click', hide);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });

  // expose
  window.showLakeInfo = show;
  window.hideLakeInfo = hide;
})();