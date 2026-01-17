/**
 * Styles CSS pour le PDF GARY
 * Extraits exactement du fichier source original
 */

export function getPdfStyles(): string {
  let css = '';

  // Reset & Base - marges normales
  css += '*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }';
  css += '@page { size: A4; margin: 6mm 8mm; }';
  css += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1a2e35; background: #fff; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }';
  css += '.page { width: 100%; max-width: 190mm; margin: 0 auto; position: relative; min-height: 277mm; padding-bottom: 40px; }';

  // Header compact avec accent
  css += '.header { background: #1a2e35; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FF4539; }';
  css += '.header svg { height: 28px; width: auto; }';
  css += '.header-date { color: rgba(255,255,255,0.8); font-size: 10px; font-weight: 500; }';

  // Badge confidentiel
  css += '.confidential { position: absolute; top: 12px; right: 20px; background: rgba(255,69,57,0.15); color: #FF4539; padding: 4px 10px; border-radius: 4px; font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border: 1px solid rgba(255,69,57,0.3); }';

  // Hero compact - padding augmenté pour zone sécurisée
  css += '.hero { background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 50%, #34495e 100%); color: white; padding: 16px 16px; position: relative; }';
  css += '.hero::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); opacity: 0.5; }';
  css += '.hero-badge { display: inline-block; background: linear-gradient(135deg, #FF4539 0%, #ff6b5b 100%); padding: 4px 12px; border-radius: 20px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(255,69,57,0.3); position: relative; }';
  css += '.hero-address { font-size: 20px; font-weight: 800; line-height: 1.2; margin-bottom: 3px; position: relative; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }';
  css += '.hero-city { font-size: 12px; opacity: 0.85; margin-bottom: 10px; font-weight: 500; position: relative; }';
  css += '.hero-info { display: flex; gap: 14px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 9px; flex-wrap: wrap; position: relative; }';
  css += '.hero-info span { opacity: 0.9; background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 4px; }';

  // Prix banner - padding augmenté pour zone sécurisée
  css += '.price-banner { background: linear-gradient(135deg, #FF4539 0%, #e63946 100%); padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(255,69,57,0.25); }';
  css += '.price-main { color: white; }';
  css += '.price-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.95; font-weight: 600; }';
  css += '.price-value { font-size: 28px; font-weight: 800; margin: 2px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.15); }';
  css += '.price-type { font-size: 9px; opacity: 0.9; font-weight: 500; }';
  css += '.price-range { color: white; text-align: right; font-size: 9px; background: rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 6px; }';
  css += '.price-range-label { opacity: 0.9; font-size: 8px; font-weight: 500; }';
  css += '.price-range-value { font-size: 12px; font-weight: 700; margin-top: 3px; }';

  // Metrics row - plus élégant
  css += '.metrics { display: flex; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-bottom: 2px solid #e2e8f0; }';
  css += '.metric { flex: 1; padding: 12px 8px; text-align: center; border-right: 1px solid #e2e8f0; position: relative; }';
  css += '.metric:last-child { border-right: none; }';
  css += '.metric-icon { font-size: 18px; margin-bottom: 4px; display: inline-block; background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%); width: 32px; height: 32px; line-height: 32px; border-radius: 8px; }';
  css += '.metric-val { font-size: 18px; font-weight: 800; color: #1a2e35; }';
  css += '.metric-lbl { font-size: 7px; color: #64748b; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px; font-weight: 600; }';

  // Values section - cartes premium
  css += '.values { padding: 12px 16px; background: white; }';
  css += '.section-lbl { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700; display: flex; align-items: center; gap: 6px; }';
  css += '.section-lbl::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, #e2e8f0 0%, transparent 100%); }';
  css += '.values-row { display: flex; gap: 10px; }';
  css += '.val-card { flex: 1; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 8px; padding: 10px; text-align: center; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; transition: transform 0.2s; }';
  css += '.val-card.accent { border-left: 4px solid #FF4539; background: linear-gradient(135deg, #fff5f4 0%, #ffffff 100%); }';
  css += '.val-card-lbl { font-size: 7px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; letter-spacing: 0.5px; }';
  css += '.val-card-amt { font-size: 15px; font-weight: 800; color: #1a2e35; }';
  css += '.val-card.accent .val-card-amt { color: #FF4539; }';
  css += '.val-card-sub { font-size: 7px; color: #94a3b8; margin-top: 3px; font-weight: 500; }';

  // Score section - plus premium
  css += '.score { padding: 10px 16px; background: linear-gradient(135deg, #1a2e35 0%, #243b48 100%); display: flex; align-items: center; gap: 14px; border-radius: 0; }';
  css += '.score-ring { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: white; position: relative; }';
  css += '.score-ring::before { content: ""; position: absolute; inset: 3px; border-radius: 50%; background: #1a2e35; }';
  css += '.score-val { position: relative; z-index: 1; }';
  css += '.score-g { background: conic-gradient(#10b981 var(--pct, 75%), #374151 0); }';
  css += '.score-y { background: conic-gradient(#f59e0b var(--pct, 50%), #374151 0); }';
  css += '.score-r { background: conic-gradient(#ef4444 var(--pct, 25%), #374151 0); }';
  css += '.score-info { color: white; }';
  css += '.score-title { font-size: 10px; font-weight: 700; margin-bottom: 2px; }';
  css += '.score-desc { font-size: 8px; opacity: 0.7; }';

  // Footer premium
  css += '.footer { background: linear-gradient(135deg, #1a2e35 0%, #243b48 100%); padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; position: absolute; bottom: 0; left: 0; right: 0; border-top: 3px solid #FF4539; }';
  css += '.footer svg { height: 18px; }';
  css += '.footer-ref { font-size: 8px; color: rgba(255,255,255,0.5); letter-spacing: 0.5px; }';
  css += '.footer-slogan { font-size: 10px; color: white; font-weight: 600; font-style: italic; }';

  // === PAGE 2 ===
  css += '.section-title { font-size: 9px; color: #FF4539; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; padding: 8px 16px; background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%); border-bottom: 2px solid #e2e8f0; border-left: 4px solid #FF4539; }';

  // Two columns layout
  css += '.two-col { display: flex; gap: 12px; padding: 10px 16px; }';
  css += '.col { flex: 1; min-width: 0; }';

  // Compact grid - plus élégant
  css += '.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }';
  css += '.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }';
  css += '.grid-item { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 6px; padding: 8px 10px; border: 1px solid #e2e8f0; }';
  css += '.grid-lbl { font-size: 6px; color: #64748b; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; font-weight: 600; }';
  css += '.grid-val { font-size: 11px; font-weight: 700; color: #1a2e35; }';

  // Etat chips - plus visuels
  css += '.etat-row { display: flex; gap: 6px; margin-top: 8px; }';
  css += '.etat-chip { flex: 1; text-align: center; padding: 8px 4px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }';
  css += '.etat-chip.checked { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }';
  css += '.etat-icon { font-size: 14px; }';
  css += '.etat-lbl { font-size: 6px; color: #64748b; margin-top: 2px; font-weight: 600; }';

  // Ambiance - barres plus premium
  css += '.amb-row { display: flex; gap: 10px; margin-top: 6px; }';
  css += '.amb-item { flex: 1; }';
  css += '.amb-head { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 5px; }';
  css += '.amb-lbl { color: #64748b; font-weight: 500; }';
  css += '.amb-val { font-weight: 700; color: #1a2e35; }';
  css += '.amb-bar { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }';
  css += '.amb-fill { height: 100%; background: linear-gradient(90deg, #FF4539 0%, #ff6b5b 100%); border-radius: 4px; }';

  // Calc table - plus professionnel
  css += '.calc { margin-top: 8px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }';
  css += '.calc-tbl { width: 100%; border-collapse: collapse; font-size: 8px; }';
  css += '.calc-tbl th { background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 100%); color: white; padding: 5px 8px; text-align: left; font-size: 6px; text-transform: uppercase; letter-spacing: 0.5px; }';
  css += '.calc-tbl th:last-child { text-align: right; }';
  css += '.calc-tbl td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; background: white; }';
  css += '.calc-tbl tr:hover td { background: #f8fafc; }';
  css += '.calc-tbl td:last-child { text-align: right; font-weight: 700; color: #1a2e35; }';
  css += '.calc-tbl .total { background: linear-gradient(135deg, #FF4539 0%, #e63946 100%); }';
  css += '.calc-tbl .total td { font-weight: 800; font-size: 10px; border: none; color: white; background: transparent; }';

  // Stratégie section
  css += '.strat-section { padding: 8px 16px; }';
  css += '.strat-title { font-size: 7px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; font-weight: 700; display: flex; align-items: center; gap: 5px; }';
  css += '.strat-title::before { content: ""; width: 2px; height: 10px; background: #FF4539; border-radius: 1px; }';

  // Capital - plus premium
  css += '.capital { background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 100%); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(26,46,53,0.2); }';
  css += '.cap-gauge { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }';
  css += '.cap-g { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }';
  css += '.cap-y { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }';
  css += '.cap-r { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); }';
  css += '.cap-info { color: white; }';
  css += '.cap-title { font-size: 10px; font-weight: 700; }';
  css += '.cap-desc { font-size: 8px; opacity: 0.8; margin-top: 1px; }';

  // Timeline - plus visuel
  css += '.timeline { display: flex; gap: 4px; margin-bottom: 8px; }';
  css += '.tl-phase { flex: 1; text-align: center; padding: 6px 4px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 6px; border: 2px solid #e2e8f0; transition: all 0.2s; }';
  css += '.tl-phase.active { border-color: #FF4539; background: linear-gradient(135deg, #FEF2F1 0%, #fff5f4 100%); box-shadow: 0 2px 8px rgba(255,69,57,0.15); }';
  css += '.tl-icon { font-size: 14px; }';
  css += '.tl-name { font-size: 7px; font-weight: 700; margin-top: 3px; color: #1a2e35; }';
  css += '.tl-dur { font-size: 6px; color: #64748b; margin-top: 1px; }';

  // Channels - plus élégants
  css += '.channels { margin-bottom: 8px; }';
  css += '.ch-lbl { font-size: 7px; color: #64748b; margin-bottom: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }';
  css += '.ch-row { display: flex; flex-wrap: wrap; gap: 4px; }';
  css += '.ch-chip { background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 100%); color: white; padding: 4px 8px; border-radius: 10px; font-size: 8px; display: flex; align-items: center; gap: 4px; font-weight: 500; }';
  css += '.ch-chip.reserve { background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%); color: #64748b; }';

  // Steps - plan d'action premium
  css += '.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }';
  css += '.step { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 6px; padding: 8px 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }';
  css += '.step-n { width: 20px; height: 20px; background: linear-gradient(135deg, #FF4539 0%, #e63946 100%); border-radius: 50%; color: white; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(255,69,57,0.3); }';
  css += '.step-t { font-size: 8px; color: #1a2e35; line-height: 1.2; font-weight: 500; }';

  // Notes - plus élégant
  css += '.notes { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #fbbf24; padding: 10px 12px; border-radius: 0 8px 8px 0; margin-top: 8px; box-shadow: 0 2px 8px rgba(251,191,36,0.15); }';
  css += '.notes-lbl { font-size: 9px; font-weight: 700; color: #92400e; margin-bottom: 4px; }';
  css += '.notes-txt { font-size: 8px; color: #78350f; line-height: 1.4; }';

  // === PAGE COUVERTURE ===
  css += '.cover { min-height: 277mm; display: flex; flex-direction: column; background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 50%, #243b48 100%); }';
  css += '.cover::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); pointer-events: none; }';
  css += '.cover-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px 30px; text-align: center; position: relative; }';
  css += '.cover-logo { position: relative; margin-bottom: 30px; }';
  css += '.cover-logo svg { height: 60px; width: auto; }';
  css += '.cover-title { font-size: 28px; font-weight: 300; color: white; margin-bottom: 8px; position: relative; }';
  css += '.cover-subtitle { font-size: 16px; font-style: italic; color: rgba(255,255,255,0.7); margin-bottom: 40px; position: relative; }';
  css += '.cover-divider { width: 60px; height: 2px; background: #FF4539; margin: 0 auto 40px; position: relative; }';
  css += '.cover-stats { display: flex; justify-content: center; gap: 40px; margin-bottom: 40px; position: relative; }';
  css += '.cover-stat { text-align: center; color: white; }';
  css += '.cover-stat-value { font-size: 28px; font-weight: 800; margin-bottom: 4px; }';
  css += '.cover-stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }';
  css += '.cover-social { display: flex; justify-content: center; gap: 20px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); position: relative; }';
  css += '.cover-social-item { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.6); font-size: 11px; }';

  // Section bien - intégrée au design sombre
  css += '.cover-bien { padding: 30px; position: relative; border-top: 1px solid rgba(255,255,255,0.1); }';
  css += '.cover-bien-type { color: white; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6; margin-bottom: 10px; text-align: center; }';
  css += '.cover-address { text-align: center; margin-bottom: 25px; }';
  css += '.cover-address-main { font-size: 26px; font-weight: 700; color: white; margin-bottom: 5px; }';
  css += '.cover-address-city { font-size: 14px; color: rgba(255,255,255,0.7); }';
  css += '.cover-address-bar { width: 40px; height: 3px; background: #FF4539; margin: 15px auto 0; }';
  css += '.cover-metrics { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }';
  css += '.cover-metric { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 15px 25px; text-align: center; min-width: 100px; }';
  css += '.cover-metric-value { font-size: 24px; font-weight: 800; color: white; }';
  css += '.cover-metric-unit { font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.6); }';
  css += '.cover-metric-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.5); margin-top: 5px; }';
  css += '.cover-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; margin-top: 15px; }';
  css += '.cover-tag { background: transparent; border: none; color: rgba(255,255,255,0.6); padding: 0; font-size: 10px; font-weight: 400; letter-spacing: 0.3px; display: flex; align-items: center; gap: 5px; }';

  // === PAGE QUI EST GARY ===
  css += '.gary-page { min-height: 277mm; background: #ffffff; padding: 0; display: flex; flex-direction: column; }';
  css += '.gary-header { background: #1a2e35; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FF4539; }';
  css += '.gary-content { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; }';
  css += '.gary-title { font-size: 22px; font-weight: 300; color: #1a2e35; text-align: center; margin-bottom: 6px; letter-spacing: -0.5px; }';
  css += '.gary-intro { font-size: 10px; color: #64748b; text-align: center; line-height: 1.6; max-width: 440px; margin: 0 auto 24px; }';
  css += '.gary-divider { width: 50px; height: 2px; background: #FF4539; margin: 0 auto 24px; }';
  css += '.gary-section { margin-bottom: 20px; }';
  css += '.gary-section-title { font-size: 11px; font-weight: 700; color: #1a2e35; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 8px; }';
  css += '.gary-section-title::before { content: ""; width: 3px; height: 14px; background: #FF4539; border-radius: 2px; }';
  css += '.gary-text { font-size: 9.5px; color: #374151; line-height: 1.65; }';
  css += '.gary-text p { margin-bottom: 8px; }';
  css += '.gary-text strong { color: #1a2e35; font-weight: 600; }';
  css += '.gary-principles { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 8px; }';
  css += '.gary-principle { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 10px 14px; border-radius: 0 6px 6px 0; }';
  css += '.gary-principle-title { font-size: 10px; font-weight: 600; color: #1a2e35; margin-bottom: 3px; }';
  css += '.gary-principle-text { font-size: 9px; color: #64748b; line-height: 1.5; }';
  css += '.gary-roles { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }';
  css += '.gary-role { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 9px; color: #374151; display: flex; align-items: center; gap: 6px; }';
  css += '.gary-role-icon { color: #FF4539; }';
  css += '.gary-note { background: #fffbeb; border-left: 3px solid #fbbf24; padding: 12px 14px; border-radius: 0 6px 6px 0; margin-top: 16px; }';
  css += '.gary-note-text { font-size: 9px; color: #78350f; line-height: 1.5; font-style: italic; }';
  css += '.gary-conclusion { text-align: center; margin-top: auto; padding-top: 16px; border-top: 1px solid #e2e8f0; }';
  css += '.gary-conclusion-text { font-size: 10px; color: #1a2e35; font-weight: 500; line-height: 1.6; }';
  css += '.gary-footer { background: #1a2e35; padding: 8px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 3px solid #FF4539; }';
  css += '.gary-footer-text { font-size: 8px; color: rgba(255,255,255,0.5); }';

  // Print
  css += '@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';

  return css;
}
