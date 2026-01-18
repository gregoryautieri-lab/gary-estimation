            const downloadPDF = () => {
                setGenerating(true);
                
                // === DONNÃ‰ES ===
                const dateNow = new Date();
                const dateStr = dateNow.toLocaleDateString('fr-CH');
                const heureStr = dateNow.toLocaleTimeString('fr-CH', {hour: '2-digit', minute: '2-digit'});
                
                const val = function(v) { return v || '-'; };
                
                const vendeur = identification?.vendeur || {};
                const bien = identification?.bien || {};
                const contexte = identification?.contexte || {};
                const historique = identification?.historique || {};
                const carac = caracteristiques || {};
                const analyse = analyseTerrain || {};
                const pre = preEstimation || {};
                const strat = data || {};
                
                // === PROJET POST-VENTE (pour niveaux 2, 3 et coordination) ===
                const projetPVEarly = identification?.projetPostVente || {};
                const hasProjetAchatPDF = projetPVEarly.nature === 'achat';
                const avancementPDFEarly = projetPVEarly.avancement || '';
                var niveauContraintePDF = 0;
                if (hasProjetAchatPDF) {
                    if (avancementPDFEarly === 'acte_programme') niveauContraintePDF = 5;
                    else if (avancementPDFEarly === 'compromis_signe') niveauContraintePDF = 4;
                    else if (avancementPDFEarly === 'offre_deposee') niveauContraintePDF = 3;
                    else if (avancementPDFEarly === 'bien_identifie') niveauContraintePDF = 2;
                    else if (avancementPDFEarly === 'recherche') niveauContraintePDF = 1;
                }
                
                const typeBien = isAppartement ? 'Appartement' : (isMaison ? 'Maison' : '-');
                
                // Calculs surfaces
                const surfacePPE = parseFloat(carac.surfacePPE) || 0;
                const surfaceNonHab = parseFloat(carac.surfaceNonHabitable) || 0;
                const surfaceBalcon = parseFloat(carac.surfaceBalcon) || 0;
                const surfaceTerrasse = parseFloat(carac.surfaceTerrasse) || 0;
                const surfaceJardin = parseFloat(carac.surfaceJardin) || 0;
                const surfacePonderee = surfacePPE + (surfaceNonHab * 0.5) + (surfaceBalcon * 0.5) + (surfaceTerrasse * 0.33) + (surfaceJardin * 0.1);
                const surfaceTerrain = parseFloat(carac.surfaceTerrain) || 0;
                const surfaceUtile = parseFloat(carac.surfaceUtile) || 0;
                const surfaceHabMaison = parseFloat(carac.surfaceHabitableMaison) || 0;
                const cubage = parseFloat(pre.cubageManuel) || (surfaceUtile * 3.1);
                const nbNiveaux = parseInt(carac.nombreNiveaux) || 1;
                const surfaceAuSol = nbNiveaux > 0 ? surfaceHabMaison / nbNiveaux : 0;
                const surfaceAmenagement = Math.max(0, surfaceTerrain - surfaceAuSol);
                
                // Calculs valeurs
                const nbPlaceInt = parseInt(carac.parkingInterieur) || 0;
                const nbPlaceExt = parseInt(carac.parkingExterieur) || 0;
                const nbBox = parseInt(carac.box) || 0;
                const hasCave = carac.cave ? 1 : 0;
                
                const prixM2 = parseFloat(pre.prixM2) || 0;
                const tauxVetuste = parseFloat(pre.tauxVetuste) || 0;
                const prixM2Ajuste = prixM2 * (1 - tauxVetuste / 100);
                const prixPlaceInt = parseFloat(pre.prixPlaceInt) || 0;
                const prixPlaceExt = parseFloat(pre.prixPlaceExt) || 0;
                const prixBox = parseFloat(pre.prixBox) || 0;
                const prixCave = parseFloat(pre.prixCave) || 0;
                const prixM2Terrain = parseFloat(pre.prixM2Terrain) || 0;
                const prixM3 = parseFloat(pre.prixM3) || 0;
                const tauxVetusteMaison = parseFloat(pre.tauxVetusteMaison) || 0;
                const prixM3Ajuste = prixM3 * (1 - tauxVetusteMaison / 100);
                const prixM2Amenagement = parseFloat(pre.prixM2Amenagement) || 0;
                
                const valeurSurface = surfacePonderee * prixM2Ajuste;
                const valeurPlaceInt = nbPlaceInt * prixPlaceInt;
                const valeurPlaceExt = nbPlaceExt * prixPlaceExt;
                const valeurBox = nbBox * prixBox;
                const valeurCave = hasCave * prixCave;
                const valeurLignesSupp = (pre.lignesSupp || []).reduce(function(sum, l) { return sum + (parseFloat(l.prix) || 0); }, 0);
                
                const valeurTerrain = surfaceTerrain * prixM2Terrain;
                const valeurCubage = cubage * prixM3Ajuste;
                const valeurAmenagement = surfaceAmenagement * prixM2Amenagement;
                const valeurAnnexes = (pre.annexes || []).reduce(function(sum, a) { return sum + (parseFloat(a.prix) || 0); }, 0);
                
                const totalVenaleAppart = valeurSurface + valeurPlaceInt + valeurPlaceExt + valeurBox + valeurCave + valeurLignesSupp;
                const totalVenaleMaison = valeurTerrain + valeurCubage + valeurAmenagement + valeurAnnexes;
                const totalVenale = isAppartement ? totalVenaleAppart : totalVenaleMaison;
                const totalVenaleArrondi = Math.ceil(totalVenale / 5000) * 5000;
                
                const loyerMensuel = parseFloat(pre.loyerMensuel) || 0;
                const loyerNet = loyerMensuel * 0.9;
                const loyerAnnuel = loyerNet * 12;
                const tauxCapi = (pre.tauxCapitalisation || 2.5) / 100;
                const valeurRendement = tauxCapi > 0 ? Math.ceil((loyerAnnuel / tauxCapi) / 5000) * 5000 : 0;
                const valeurGage = (2 * totalVenale + valeurRendement) / 3;
                const valeurGageArrondi = Math.ceil(valeurGage / 5000) * 5000;
                
                const prixEntre = Math.ceil(totalVenale * 0.97 / 5000) * 5000;
                const prixEt = Math.ceil(totalVenale * 1.03 / 5000) * 5000;
                
                const typeMV = pre.typeMiseEnVente || 'public';
                const coefMV = typeMV === 'offmarket' ? 1.15 : (typeMV === 'comingsoon' ? 1.10 : 1.06);
                const prixMiseEnVente = Math.ceil(totalVenale * coefMV / 5000) * 5000;
                
                // Calcul Capital-VisibilitÃ© basÃ© sur l'historique
                var capitalPct = 100;
                var capitalAlerts = [];
                var pauseRecommandee = false;
                
                if (historique.dejaDiffuse) {
                    // Impact de la durÃ©e
                    var dureeImpact = 0;
                    if (historique.duree === 'moins1mois') dureeImpact = 5;
                    else if (historique.duree === '1-3mois') dureeImpact = 15;
                    else if (historique.duree === '3-6mois') dureeImpact = 30;
                    else if (historique.duree === '6-12mois') dureeImpact = 50;
                    else if (historique.duree === 'plus12mois') dureeImpact = 65;
                    
                    // Impact du type de diffusion
                    var diffusionImpact = 0;
                    if (historique.typeDiffusion === 'discrete') diffusionImpact = 5;
                    else if (historique.typeDiffusion === 'moderee') diffusionImpact = 15;
                    else if (historique.typeDiffusion === 'massive') diffusionImpact = 30;
                    
                    // Combinaison durÃ©e + type
                    capitalPct = 100 - dureeImpact - diffusionImpact;
                    
                    // Bonus si diffusion discrÃ¨te longue (moins grave)
                    if (historique.typeDiffusion === 'discrete' && dureeImpact > 15) {
                        capitalPct += 10;
                    }
                    
                    // Malus si diffusion massive longue (trÃ¨s grave)
                    if (historique.typeDiffusion === 'massive' && (historique.duree === '3-6mois' || historique.duree === '6-12mois' || historique.duree === 'plus12mois')) {
                        capitalPct -= 10;
                    }
                    
                    // S'assurer que le capital reste entre 10 et 100
                    capitalPct = Math.max(10, Math.min(100, capitalPct));
                    
                    // Alertes et recommandations
                    if (capitalPct < 40) {
                        pauseRecommandee = true;
                        capitalAlerts.push({type: 'critical', msg: 'Pause commerciale de 2-3 semaines recommandÃ©e avant toute nouvelle action'});
                        capitalAlerts.push({type: 'info', msg: 'RÃ©inventer l\'objet : nouvelles photos, vidÃ©o, brochure repensÃ©e'});
                    }
                    
                    // VÃ©rifier Ã©cart de prix si prix estimÃ© disponible
                    var prixAfficheNum = parseFloat(historique.prixAffiche) || 0;
                    if (prixAfficheNum > 0 && totalVenale > 0) {
                        var ecartPrix = ((prixAfficheNum - totalVenale) / totalVenale) * 100;
                        if (ecartPrix > 30) {
                            capitalAlerts.push({type: 'warning', msg: 'Prix affichÃ© prÃ©cÃ©demment (' + prixAfficheNum.toLocaleString('fr-CH') + ' CHF) supÃ©rieur de ' + ecartPrix.toFixed(0) + '% Ã  notre estimation. Repositionnement prix nÃ©cessaire.'});
                        } else if (ecartPrix > 10) {
                            capitalAlerts.push({type: 'info', msg: 'Prix affichÃ© prÃ©cÃ©demment lÃ©gÃ¨rement au-dessus de notre estimation (' + ecartPrix.toFixed(0) + '%)'});
                        }
                    }
                    
                    // Portails utilisÃ©s pour Ã©viter
                    var portailsUtilises = historique.portails || [];
                    if (portailsUtilises.length > 0) {
                        var portailsLabels = {immoscout: 'Immoscout', homegate: 'Homegate', acheterlouer: 'Acheter-Louer', anibis: 'Anibis', immostreet: 'ImmoStreet', autres: 'Autres'};
                        var portailsStr = portailsUtilises.map(function(p) { return portailsLabels[p] || p; }).join(', ');
                        capitalAlerts.push({type: 'info', msg: 'Portails dÃ©jÃ  utilisÃ©s : ' + portailsStr});
                    }
                }
                
                // ==================== CALCUL LUXMODE (adaptatif, invisible utilisateur) ====================
                var luxScore = 0;
                
                // Type de bien premium
                var sousTypePremium = ['attique', 'penthouse', 'loft', 'duplex'].includes(carac.sousType);
                var sousTypeMaisonPremium = ['villa', 'propriete', 'chalet'].includes(carac.sousType);
                if (sousTypePremium) luxScore += 15;
                if (sousTypeMaisonPremium) luxScore += 12;
                if (carac.dernierEtage && isAppartement) luxScore += 8;
                
                // Surfaces hors norme
                var surfaceHab = isAppartement ? surfacePonderee : surfaceHabMaison;
                if (surfaceHab > 300) luxScore += 15;
                else if (surfaceHab > 200) luxScore += 10;
                else if (surfaceHab > 150) luxScore += 5;
                
                // Terrain (maison)
                if (isMaison && surfaceTerrain > 3000) luxScore += 15;
                else if (isMaison && surfaceTerrain > 1500) luxScore += 10;
                else if (isMaison && surfaceTerrain > 800) luxScore += 5;
                
                // Annexes premium
                if (carac.piscine) luxScore += 12;
                var annexesPremium = (carac.annexesAppart || []).filter(function(a) {
                    return ['piscine_int', 'piscine_ext', 'hammam', 'sauna', 'jacuzzi'].includes(a);
                });
                luxScore += annexesPremium.length * 5;
                
                // Contexte vendeur (discrÃ©tion, long terme)
                if (contexte.confidentialite === 'confidentielle') luxScore += 12;
                else if (contexte.confidentialite === 'discrete') luxScore += 8;
                if (contexte.horizon === 'flexible') luxScore += 5;
                if (contexte.prioriteVendeur === 'prixMax') luxScore += 5;
                
                // Bien dÃ©jÃ  exposÃ© + volontÃ© de protÃ©ger
                if (historique.dejaDiffuse && contexte.confidentialite !== 'normale') luxScore += 8;
                
                // Valeur vÃ©nale
                if (totalVenaleArrondi > 10000000) luxScore += 20;
                else if (totalVenaleArrondi > 5000000) luxScore += 15;
                else if (totalVenaleArrondi > 3000000) luxScore += 10;
                else if (totalVenaleArrondi > 2000000) luxScore += 5;
                
                // Seuil luxMode
                var luxMode = luxScore >= 35;
                
                // DEBUG (console uniquement, jamais dans le PDF)
                console.log('GARY luxScore:', luxScore, '| luxMode:', luxMode);
                
                // ==================== VOCABULAIRE ADAPTATIF ====================
                var getCopy = function(isLux) {
                    return {
                        pageTitle: isLux ? 'ScÃ©narios de gouvernance' : 'Trajectoires de vente',
                        headerTitle: isLux ? 'ScÃ©narios de gouvernance' : 'Trajectoires de vente',
                        timeline: isLux ? 'Cycle de maturation' : 'Timeline de diffusion',
                        diffusion: isLux ? 'Exposition maÃ®trisÃ©e' : 'Diffusion',
                        visibilite: isLux ? 'PortÃ©e contrÃ´lÃ©e' : 'VisibilitÃ©',
                        capitalLabel: isLux ? 'Capital de portÃ©e' : 'Capital-VisibilitÃ©',
                        accelerer: isLux ? 'Arbitrer le tempo' : 'AccÃ©lÃ©rer',
                        introPhrase: isLux 
                            ? 'Chaque bien d\'exception appelle une gouvernance sur mesure. Le choix du scÃ©nario dÃ©pend de votre tempo, vos exigences et votre vision.'
                            : 'Chaque bien peut Ãªtre vendu selon diffÃ©rentes trajectoires. Le choix du point de dÃ©part stratÃ©gique dÃ©pend de votre contexte, vos prioritÃ©s et votre horizon temporel.',
                        disclaimerPhrase: isLux
                            ? 'Dans ce segment, la retenue et la sÃ©lectivitÃ© font partie de la stratÃ©gie. Un objectif de valeur reflÃ¨te le positionnement stratÃ©gique, pas une promesse de marchÃ©.'
                            : 'Un objectif de valeur n\'est pas une promesse. Il dÃ©pend des signaux du marchÃ©, du rythme de diffusion et du pilotage dans le temps. Le point de dÃ©part stratÃ©gique est rÃ©versible â€” vous pouvez changer de trajectoire selon les retours observÃ©s.',
                        recalibrageTitle: isLux ? 'Recalibrage nÃ©cessaire' : 'Recommandations',
                        recalibragePhrase: isLux 
                            ? 'Avant d\'amplifier, on stabilise le message et on Ã©vite les signaux contradictoires.'
                            : ''
                    };
                };
                var copy = getCopy(luxMode);
                
                const surfacePrincipale = isAppartement ? surfacePonderee : surfaceHabMaison;
                
                // URL carte OpenStreetMap
                const adresseComplete = [bien.adresse, bien.codePostal, bien.localite].filter(Boolean).join(', ');
                const adresseEncoded = encodeURIComponent(adresseComplete + ', Suisse');
                const mapUrl = 'https://www.openstreetmap.org/search?query=' + adresseEncoded;
                
                // Logo blanc pour headers
                const logoWhite = '<svg viewBox="0 0 1372 309"><g fill="#FFFFFF"><path d="M12,156.2C12,72.9,73.2,9.4,162.1,9.4c58.5,0,102.7,25.5,127,62l-42.8,27.8c-15.7-26.5-44.7-44.1-84.2-44.1c-57.8,0-96.3,43.4-96.3,101.1c0,58.1,38.6,101.9,96.3,101.9c47.2,0,81-26.3,89.6-68.5h-92.5v-43.9h151c0,93.3-57.2,157.4-148.1,157.4C73.2,303,12,239.5,12,156.2z"/><path d="M505.7,15.2h57l114.6,282.1h-53.5L594.4,223H474l-29.4,74.3h-53.3L505.7,15.2z M577.9,178.5L534.3,67.7l-43.8,110.7H577.9z"/><path d="M787.6,15.2h100.4c69.1,0,101.1,32.2,101.1,80.2c0,40.1-26.1,71-76,77.3l110.3,124.5h-63.1L854.7,175.8h-16.5v121.5h-50.7V15.2z M883.7,134.1c34.7,0,51.4-13.2,51.4-38.2c0-24.9-16.7-38.2-51.4-38.2h-45.5v76.4H883.7z"/><path d="M1192.1,177.1l-112.3-162h56.6l81.2,119.5l81.2-119.5h56.4l-112.4,162v120.1h-50.7V177.1z"/></g></svg>';
                // Logo rouge pour footers
                const logoRed = '<svg viewBox="0 0 1372 309"><g fill="#FF4539"><path d="M12,156.2C12,72.9,73.2,9.4,162.1,9.4c58.5,0,102.7,25.5,127,62l-42.8,27.8c-15.7-26.5-44.7-44.1-84.2-44.1c-57.8,0-96.3,43.4-96.3,101.1c0,58.1,38.6,101.9,96.3,101.9c47.2,0,81-26.3,89.6-68.5h-92.5v-43.9h151c0,93.3-57.2,157.4-148.1,157.4C73.2,303,12,239.5,12,156.2z"/><path d="M505.7,15.2h57l114.6,282.1h-53.5L594.4,223H474l-29.4,74.3h-53.3L505.7,15.2z M577.9,178.5L534.3,67.7l-43.8,110.7H577.9z"/><path d="M787.6,15.2h100.4c69.1,0,101.1,32.2,101.1,80.2c0,40.1-26.1,71-76,77.3l110.3,124.5h-63.1L854.7,175.8h-16.5v121.5h-50.7V15.2z M883.7,134.1c34.7,0,51.4-13.2,51.4-38.2c0-24.9-16.7-38.2-51.4-38.2h-45.5v76.4H883.7z"/><path d="M1192.1,177.1l-112.3-162h56.6l81.2,119.5l81.2-119.5h56.4l-112.4,162v120.1h-50.7V177.1z"/></g></svg>';
                
                // BibliothÃ¨que d'icÃ´nes SVG style Lucide (ligne fine, minimaliste)
                const ico = function(name, size, color) {
                    size = size || 20;
                    color = color || '#64748b';
                    const paths = {
                        // MÃ©triques bien
                        surface: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
                        pieces: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
                        chambres: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
                        etage: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
                        terrain: '<path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z"/><circle cx="12" cy="10" r="3"/>',
                        construction: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
                        // Ambiance
                        luminosite: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
                        calme: '<path d="M18 8a6 6 0 0 0-12 0c0 7 6 13 6 13s6-6 6-13Z"/><circle cx="12" cy="8" r="2"/>',
                        volumes: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
                        // ProximitÃ©s
                        bus: '<path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M18 18H6a4 4 0 0 1-4-4V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
                        train: '<path d="M8 3h8l4 6v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9l4-6Z"/><path d="M10 19v3"/><path d="M14 19v3"/><path d="M9 3v6"/><path d="M15 3v6"/><path d="M4 9h16"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
                        ecole: '<path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>',
                        commerce: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
                        sante: '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/>',
                        nature: '<path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9Z"/><path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9 4.03 9 9Z"/><path d="M12 13V2"/><path d="M9 5.5c.78-.78 2.22-.78 3 0 .78.78.78 2.22 0 3-.78.78-2.22.78-3 0-.78-.78-.78-2.22 0-3Z"/>',
                        // Ã‰tats
                        checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
                        alertCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
                        info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
                        shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
                        users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
                        star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
                        edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
                        refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
                        xCircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
                        sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
                        // Timeline/StratÃ©gie
                        target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
                        trendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
                        flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
                        lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
                        clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
                        rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
                        globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
                        megaphone: '<path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
                        // Canaux
                        heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
                        camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
                        video: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/>',
                        share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
                        mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
                        // Autres
                        user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
                        phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
                        mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
                        check: '<polyline points="20 6 9 17 4 12"/>',
                        x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
                        minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
                        circle: '<circle cx="12" cy="12" r="10"/>',
                        arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
                        file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
                        key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
                        home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
                        parking: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
                        bath: '<path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="7" y1="19" x2="7" y2="21"/><line x1="17" y1="19" x2="17" y2="21"/>',
                        thermometer: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
                        zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
                        mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
                        tree: '<path d="M12 22v-7l-2-2"/><path d="M17 8v.8A6 6 0 0 1 13.8 20v0H10v0A6.5 6.5 0 0 1 7 8h0a5 5 0 0 1 10 0Z"/><path d="m14 14-2 2"/>',
                        eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
                        compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
                        instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
                        linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
                        tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>',
                        building: '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>'
                    };
                    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">' + (paths[name] || '') + '</svg>';
                };
                
                // Calcul du nombre de pages photos
                var photoItems = (photos && photos.items) ? photos.items : [];
                var photosCount = photoItems.length;
                var photoPagesCount = photosCount > 0 ? Math.ceil(photosCount / 9) : 0;
                
                // Calcul annexe comparables (si >7 vendus OU >7 en vente)
                var compVendus = (pre && pre.comparablesVendus) ? pre.comparablesVendus : [];
                var compEnVente = (pre && pre.comparablesEnVente) ? pre.comparablesEnVente : [];
                var comparablesEnAnnexe = compVendus.length > 7 || compEnVente.length > 7;
                var totalComparables = compVendus.length + compEnVente.length;
                
                var totalPages = 6 + (comparablesEnAnnexe ? 1 : 0) + photoPagesCount;
                
                var printWindow = window.open('', '_blank');
                var html = '';
                
                html += '<!DOCTYPE html><html><head><meta charset="UTF-8">';
                html += '<title>GARY - Estimation ' + val(vendeur.nom) + '</title>';
                html += '<style>';
                
                // Reset & Base - marges normales
                html += '*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }';
                html += '@page { size: A4; margin: 6mm 8mm; }';
                html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1a2e35; background: #fff; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }';
                html += '.page { width: 100%; max-width: 190mm; margin: 0 auto; position: relative; min-height: 277mm; padding-bottom: 40px; }';
                
                // Header compact avec accent
                html += '.header { background: #1a2e35; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FF4539; }';
                html += '.header svg { height: 28px; width: auto; }';
                html += '.header-date { color: rgba(255,255,255,0.8); font-size: 10px; font-weight: 500; }';
                
                // Badge confidentiel
                html += '.confidential { position: absolute; top: 12px; right: 20px; background: rgba(255,69,57,0.15); color: #FF4539; padding: 4px 10px; border-radius: 4px; font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border: 1px solid rgba(255,69,57,0.3); }';
                
                // Hero compact - padding augmentÃ© pour zone sÃ©curisÃ©e
                html += '.hero { background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 50%, #34495e 100%); color: white; padding: 16px 16px; position: relative; }';
                html += '.hero::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); opacity: 0.5; }';
                html += '.hero-badge { display: inline-block; background: linear-gradient(135deg, #FF4539 0%, #ff6b5b 100%); padding: 4px 12px; border-radius: 20px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(255,69,57,0.3); position: relative; }';
                html += '.hero-address { font-size: 20px; font-weight: 800; line-height: 1.2; margin-bottom: 3px; position: relative; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }';
                html += '.hero-city { font-size: 12px; opacity: 0.85; margin-bottom: 10px; font-weight: 500; position: relative; }';
                html += '.hero-info { display: flex; gap: 14px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 9px; flex-wrap: wrap; position: relative; }';
                html += '.hero-info span { opacity: 0.9; background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 4px; }';
                
                // Prix banner - padding augmentÃ© pour zone sÃ©curisÃ©e
                html += '.price-banner { background: linear-gradient(135deg, #FF4539 0%, #e63946 100%); padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(255,69,57,0.25); }';
                html += '.price-main { color: white; }';
                html += '.price-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.95; font-weight: 600; }';
                html += '.price-value { font-size: 28px; font-weight: 800; margin: 2px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.15); }';
                html += '.price-type { font-size: 9px; opacity: 0.9; font-weight: 500; }';
                html += '.price-range { color: white; text-align: right; font-size: 9px; background: rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 6px; }';
                html += '.price-range-label { opacity: 0.9; font-size: 8px; font-weight: 500; }';
                html += '.price-range-value { font-size: 12px; font-weight: 700; margin-top: 3px; }';
                
                // Metrics row - plus Ã©lÃ©gant
                html += '.metrics { display: flex; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-bottom: 2px solid #e2e8f0; }';
                html += '.metric { flex: 1; padding: 12px 8px; text-align: center; border-right: 1px solid #e2e8f0; position: relative; }';
                html += '.metric:last-child { border-right: none; }';
                html += '.metric-icon { font-size: 18px; margin-bottom: 4px; display: inline-block; background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%); width: 32px; height: 32px; line-height: 32px; border-radius: 8px; }';
                html += '.metric-val { font-size: 18px; font-weight: 800; color: #1a2e35; }';
                html += '.metric-lbl { font-size: 7px; color: #64748b; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px; font-weight: 600; }';
                
                // Values section - cartes premium
                html += '.values { padding: 12px 16px; background: white; }';
                html += '.section-lbl { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700; display: flex; align-items: center; gap: 6px; }';
                html += '.section-lbl::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, #e2e8f0 0%, transparent 100%); }';
                html += '.values-row { display: flex; gap: 10px; }';
                html += '.val-card { flex: 1; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 8px; padding: 10px; text-align: center; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; transition: transform 0.2s; }';
                html += '.val-card.accent { border-left: 4px solid #FF4539; background: linear-gradient(135deg, #fff5f4 0%, #ffffff 100%); }';
                html += '.val-card-lbl { font-size: 7px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; letter-spacing: 0.5px; }';
                html += '.val-card-amt { font-size: 15px; font-weight: 800; color: #1a2e35; }';
                html += '.val-card.accent .val-card-amt { color: #FF4539; }';
                html += '.val-card-sub { font-size: 7px; color: #94a3b8; margin-top: 3px; font-weight: 500; }';
                
                // Score section - plus premium
                html += '.score { padding: 10px 16px; background: linear-gradient(135deg, #1a2e35 0%, #243b48 100%); display: flex; align-items: center; gap: 14px; border-radius: 0; }';
                html += '.score-circle { width: 46px; height: 46px; border-radius: 50%; background: conic-gradient(#FF4539 0deg, #FF4539 calc(var(--s) * 72deg), #3d5a6e calc(var(--s) * 72deg)); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }';
                html += '.score-inner { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #1a2e35 0%, #243b48 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 800; }';
                html += '.score-info { flex: 1; color: white; }';
                html += '.score-title { font-size: 10px; font-weight: 700; }';
                html += '.score-sub { font-size: 8px; opacity: 0.7; margin-top: 1px; }';
                html += '.score-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 5px; }';
                html += '.tag { font-size: 7px; padding: 3px 8px; border-radius: 10px; font-weight: 600; }';
                html += '.tag-g { background: rgba(16,185,129,0.25); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }';
                html += '.tag-r { background: rgba(239,68,68,0.25); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }';
                
                // ProximitÃ©s section - plus Ã©lÃ©gant
                html += '.proximites { padding: 12px 16px; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }';
                html += '.proximites-title { font-size: 9px; font-weight: 700; color: #1a2e35; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }';
                html += '.proximites-title::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, #e2e8f0 0%, transparent 100%); }';
                html += '.proximites-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }';
                html += '.prox-item { background: white; border-radius: 8px; padding: 10px; display: flex; align-items: center; gap: 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }';
                html += '.prox-icon { font-size: 18px; background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%); width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }';
                html += '.prox-info { flex: 1; min-width: 0; }';
                html += '.prox-label { font-size: 10px; color: #1a2e35; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }';
                html += '.prox-dist { font-size: 13px; font-weight: 800; color: #FF4539; }';
                html += '.prox-empty { color: #94a3b8; font-style: italic; font-size: 9px; text-align: center; padding: 20px; }';
                
                // Arguments de vente section - premium
                html += '.arguments { padding: 14px 16px; background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 50%, #34495e 100%); margin: 12px 16px; border-radius: 12px; box-shadow: 0 4px 15px rgba(26,46,53,0.3); position: relative; overflow: hidden; }';
                html += '.arguments::before { content: ""; position: absolute; top: -50%; right: -50%; width: 100%; height: 100%; background: radial-gradient(circle, rgba(255,69,57,0.1) 0%, transparent 70%); }';
                html += '.arguments-title { font-size: 10px; font-weight: 700; color: white; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; position: relative; }';
                html += '.arguments-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; position: relative; }';
                html += '.argument-item { background: rgba(255,255,255,0.08); border-radius: 8px; padding: 10px; display: flex; align-items: flex-start; gap: 10px; border: 1px solid rgba(255,255,255,0.1); }';
                html += '.argument-icon { font-size: 16px; background: rgba(255,69,57,0.2); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }';
                html += '.argument-text { font-size: 10px; color: white; line-height: 1.4; font-weight: 500; }';
                html += '.arguments-empty { color: rgba(255,255,255,0.5); font-style: italic; font-size: 10px; text-align: center; padding: 15px; }';
                
                // Signature section (page 2) - premium
                html += '.signature-section { margin: 12px 16px; padding: 16px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 12px; border: 2px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }';
                html += '.signature-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }';
                html += '.signature-courtier { display: flex; align-items: center; gap: 12px; }';
                html += '.signature-avatar { width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #FF4539 0%, #ff6b5b 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 800; box-shadow: 0 4px 12px rgba(255,69,57,0.3); }';
                html += '.signature-info { }';
                html += '.signature-name { font-size: 13px; font-weight: 700; color: #1a2e35; }';
                html += '.signature-role { font-size: 9px; color: #FF4539; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }';
                html += '.signature-contact { font-size: 9px; color: #64748b; margin-top: 3px; }';
                html += '.signature-lieu { text-align: right; background: #f0f4f8; padding: 10px 12px; border-radius: 8px; }';
                html += '.signature-lieu-text { font-size: 11px; color: #1a2e35; font-weight: 600; }';
                html += '.signature-lieu-date { font-size: 9px; color: #64748b; margin-top: 3px; }';
                html += '.signature-line { margin-top: 16px; padding-top: 16px; border-top: 2px dashed #e2e8f0; display: flex; justify-content: space-between; gap: 30px; }';
                html += '.signature-box { flex: 1; }';
                html += '.signature-box-label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; font-weight: 600; }';
                html += '.signature-box-line { border-bottom: 2px solid #1a2e35; height: 35px; }';
                
                // Footer premium
                html += '.footer { background: linear-gradient(135deg, #1a2e35 0%, #243b48 100%); padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; position: absolute; bottom: 0; left: 0; right: 0; border-top: 3px solid #FF4539; }';
                html += '.footer svg { height: 18px; }';
                html += '.footer-ref { font-size: 8px; color: rgba(255,255,255,0.5); letter-spacing: 0.5px; }';
                html += '.footer-slogan { font-size: 10px; color: white; font-weight: 600; font-style: italic; }';
                
                // === PAGE 2 ===
                html += '.section-title { font-size: 9px; color: #FF4539; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; padding: 8px 16px; background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%); border-bottom: 2px solid #e2e8f0; border-left: 4px solid #FF4539; }';
                
                // Two columns layout
                html += '.two-col { display: flex; gap: 12px; padding: 10px 16px; }';
                html += '.col { flex: 1; min-width: 0; }';
                
                // Compact grid - plus Ã©lÃ©gant
                html += '.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }';
                html += '.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }';
                html += '.grid-item { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 6px; padding: 8px 10px; border: 1px solid #e2e8f0; }';
                html += '.grid-lbl { font-size: 6px; color: #64748b; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; font-weight: 600; }';
                html += '.grid-val { font-size: 11px; font-weight: 700; color: #1a2e35; }';
                
                // Etat chips - plus visuels
                html += '.etat-row { display: flex; gap: 6px; margin-top: 8px; }';
                html += '.etat-chip { flex: 1; text-align: center; padding: 8px 4px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }';
                html += '.etat-chip.checked { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }';
                html += '.etat-icon { font-size: 14px; }';
                html += '.etat-lbl { font-size: 6px; color: #64748b; margin-top: 2px; font-weight: 600; }';
                
                // Ambiance - barres plus premium
                html += '.amb-row { display: flex; gap: 10px; margin-top: 6px; }';
                html += '.amb-item { flex: 1; }';
                html += '.amb-head { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 5px; }';
                html += '.amb-lbl { color: #64748b; font-weight: 500; }';
                html += '.amb-val { font-weight: 700; color: #1a2e35; }';
                html += '.amb-bar { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }';
                html += '.amb-fill { height: 100%; background: linear-gradient(90deg, #FF4539 0%, #ff6b5b 100%); border-radius: 4px; }';
                
                // Calc table - plus professionnel
                html += '.calc { margin-top: 8px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }';
                html += '.calc-tbl { width: 100%; border-collapse: collapse; font-size: 8px; }';
                html += '.calc-tbl th { background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 100%); color: white; padding: 5px 8px; text-align: left; font-size: 6px; text-transform: uppercase; letter-spacing: 0.5px; }';
                html += '.calc-tbl th:last-child { text-align: right; }';
                html += '.calc-tbl td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; background: white; }';
                html += '.calc-tbl tr:hover td { background: #f8fafc; }';
                html += '.calc-tbl td:last-child { text-align: right; font-weight: 700; color: #1a2e35; }';
                html += '.calc-tbl .total { background: linear-gradient(135deg, #FF4539 0%, #e63946 100%); }';
                html += '.calc-tbl .total td { font-weight: 800; font-size: 10px; border: none; color: white; background: transparent; }';
                
                // StratÃ©gie section
                html += '.strat-section { padding: 8px 16px; }';
                html += '.strat-title { font-size: 7px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; font-weight: 700; display: flex; align-items: center; gap: 5px; }';
                html += '.strat-title::before { content: ""; width: 2px; height: 10px; background: #FF4539; border-radius: 1px; }';
                
                // Capital - plus premium
                html += '.capital { background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 100%); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(26,46,53,0.2); }';
                html += '.cap-gauge { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }';
                html += '.cap-g { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); }';
                html += '.cap-y { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }';
                html += '.cap-r { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); }';
                html += '.cap-info { color: white; }';
                html += '.cap-title { font-size: 10px; font-weight: 700; }';
                html += '.cap-desc { font-size: 8px; opacity: 0.8; margin-top: 1px; }';
                
                // Timeline - plus visuel
                html += '.timeline { display: flex; gap: 4px; margin-bottom: 8px; }';
                html += '.tl-phase { flex: 1; text-align: center; padding: 6px 4px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 6px; border: 2px solid #e2e8f0; transition: all 0.2s; }';
                html += '.tl-phase.active { border-color: #FF4539; background: linear-gradient(135deg, #FEF2F1 0%, #fff5f4 100%); box-shadow: 0 2px 8px rgba(255,69,57,0.15); }';
                html += '.tl-icon { font-size: 14px; }';
                html += '.tl-name { font-size: 7px; font-weight: 700; margin-top: 3px; color: #1a2e35; }';
                html += '.tl-dur { font-size: 6px; color: #64748b; margin-top: 1px; }';
                
                // Channels - plus Ã©lÃ©gants
                html += '.channels { margin-bottom: 8px; }';
                html += '.ch-lbl { font-size: 7px; color: #64748b; margin-bottom: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }';
                html += '.ch-row { display: flex; flex-wrap: wrap; gap: 4px; }';
                html += '.ch-chip { background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 100%); color: white; padding: 4px 8px; border-radius: 10px; font-size: 8px; display: flex; align-items: center; gap: 4px; font-weight: 500; }';
                html += '.ch-chip.reserve { background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%); color: #64748b; }';
                
                // Steps - plan d'action premium
                html += '.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }';
                html += '.step { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-radius: 6px; padding: 8px 10px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }';
                html += '.step-n { width: 20px; height: 20px; background: linear-gradient(135deg, #FF4539 0%, #e63946 100%); border-radius: 50%; color: white; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(255,69,57,0.3); }';
                html += '.step-t { font-size: 8px; color: #1a2e35; line-height: 1.2; font-weight: 500; }';
                
                // Notes - plus Ã©lÃ©gant
                html += '.notes { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #fbbf24; padding: 10px 12px; border-radius: 0 8px 8px 0; margin-top: 8px; box-shadow: 0 2px 8px rgba(251,191,36,0.15); }';
                html += '.notes-lbl { font-size: 9px; font-weight: 700; color: #92400e; margin-bottom: 4px; }';
                html += '.notes-txt { font-size: 8px; color: #78350f; line-height: 1.4; }';
                
                // === PAGE COUVERTURE ===
                html += '.cover { min-height: 277mm; display: flex; flex-direction: column; background: linear-gradient(135deg, #1a2e35 0%, #2c3e50 50%, #243b48 100%); }';
                html += '.cover::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); pointer-events: none; }';
                html += '.cover-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px 30px; text-align: center; position: relative; }';
                html += '.cover-logo { position: relative; margin-bottom: 30px; }';
                html += '.cover-logo svg { height: 60px; width: auto; }';
                html += '.cover-title { font-size: 28px; font-weight: 300; color: white; margin-bottom: 8px; position: relative; }';
                html += '.cover-subtitle { font-size: 16px; font-style: italic; color: rgba(255,255,255,0.7); margin-bottom: 40px; position: relative; }';
                html += '.cover-divider { width: 60px; height: 2px; background: #FF4539; margin: 0 auto 40px; position: relative; }';
                html += '.cover-stats { display: flex; justify-content: center; gap: 40px; margin-bottom: 40px; position: relative; }';
                html += '.cover-stat { text-align: center; color: white; }';
                html += '.cover-stat-value { font-size: 28px; font-weight: 800; margin-bottom: 4px; }';
                html += '.cover-stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }';
                html += '.cover-social { display: flex; justify-content: center; gap: 20px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); position: relative; }';
                html += '.cover-social-item { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.6); font-size: 11px; }';
                
                // Section bien - intÃ©grÃ©e au design sombre
                html += '.cover-bien { padding: 30px; position: relative; border-top: 1px solid rgba(255,255,255,0.1); }';
                html += '.cover-bien-type { color: white; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6; margin-bottom: 10px; text-align: center; }';
                html += '.cover-address { text-align: center; margin-bottom: 25px; }';
                html += '.cover-address-main { font-size: 26px; font-weight: 700; color: white; margin-bottom: 5px; }';
                html += '.cover-address-city { font-size: 14px; color: rgba(255,255,255,0.7); }';
                html += '.cover-address-bar { width: 40px; height: 3px; background: #FF4539; margin: 15px auto 0; }';
                html += '.cover-metrics { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }';
                html += '.cover-metric { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 15px 25px; text-align: center; min-width: 100px; }';
                html += '.cover-metric-value { font-size: 24px; font-weight: 800; color: white; }';
                html += '.cover-metric-unit { font-size: 11px; font-weight: 400; color: rgba(255,255,255,0.6); }';
                html += '.cover-metric-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.5); margin-top: 5px; }';
                html += '.cover-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; margin-top: 15px; }';
                html += '.cover-tag { background: transparent; border: none; color: rgba(255,255,255,0.6); padding: 0; font-size: 10px; font-weight: 400; letter-spacing: 0.3px; display: flex; align-items: center; gap: 5px; }';
                
                // === PAGE QUI EST GARY ===
                html += '.gary-page { min-height: 277mm; background: #ffffff; padding: 0; display: flex; flex-direction: column; }';
                html += '.gary-header { background: #1a2e35; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FF4539; }';
                html += '.gary-content { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; }';
                html += '.gary-title { font-size: 22px; font-weight: 300; color: #1a2e35; text-align: center; margin-bottom: 6px; letter-spacing: -0.5px; }';
                html += '.gary-intro { font-size: 10px; color: #64748b; text-align: center; line-height: 1.6; max-width: 440px; margin: 0 auto 24px; }';
                html += '.gary-divider { width: 50px; height: 2px; background: #FF4539; margin: 0 auto 24px; }';
                html += '.gary-section { margin-bottom: 20px; }';
                html += '.gary-section-title { font-size: 11px; font-weight: 700; color: #1a2e35; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 8px; }';
                html += '.gary-section-title::before { content: ""; width: 3px; height: 14px; background: #FF4539; border-radius: 2px; }';
                html += '.gary-text { font-size: 9.5px; color: #374151; line-height: 1.65; }';
                html += '.gary-text p { margin-bottom: 8px; }';
                html += '.gary-text strong { color: #1a2e35; font-weight: 600; }';
                html += '.gary-principles { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 8px; }';
                html += '.gary-principle { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 10px 14px; border-radius: 0 6px 6px 0; }';
                html += '.gary-principle-title { font-size: 10px; font-weight: 600; color: #1a2e35; margin-bottom: 3px; }';
                html += '.gary-principle-text { font-size: 9px; color: #64748b; line-height: 1.5; }';
                html += '.gary-roles { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }';
                html += '.gary-role { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 9px; color: #374151; display: flex; align-items: center; gap: 6px; }';
                html += '.gary-role-icon { color: #FF4539; }';
                html += '.gary-note { background: #fffbeb; border-left: 3px solid #fbbf24; padding: 12px 14px; border-radius: 0 6px 6px 0; margin-top: 16px; }';
                html += '.gary-note-text { font-size: 9px; color: #78350f; line-height: 1.5; font-style: italic; }';
                html += '.gary-conclusion { text-align: center; margin-top: auto; padding-top: 16px; border-top: 1px solid #e2e8f0; }';
                html += '.gary-conclusion-text { font-size: 10px; color: #1a2e35; font-weight: 500; line-height: 1.6; }';
                html += '.gary-footer { background: #1a2e35; padding: 8px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 3px solid #FF4539; }';
                html += '.gary-footer-text { font-size: 8px; color: rgba(255,255,255,0.5); }';
                
                html += '@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';
                html += '</style></head><body>';
                
                // ==================== PAGE COUVERTURE ====================
                html += '<div class="page cover">';
                
                // Hero section avec stats GARY
                html += '<div class="cover-hero">';
                html += '<div class="cover-logo">' + logoRed.replace('viewBox', 'style="height:60px;width:auto;" viewBox').replace('#FF4539', '#FF4539') + '</div>';
                html += '<div class="cover-title">Votre stratÃ©gie de vente</div>';
                html += '<div class="cover-subtitle">sur mesure</div>';
                html += '<div class="cover-divider"></div>';
                
                // Stats marketing
                html += '<div class="cover-stats">';
                html += '<div class="cover-stat"><div class="cover-stat-value">6.6M+</div><div class="cover-stat-label">Vues en 2025</div></div>';
                html += '<div class="cover-stat"><div class="cover-stat-value">40K+</div><div class="cover-stat-label">CommunautÃ©</div></div>';
                html += '<div class="cover-stat"><div class="cover-stat-value">5.0 â˜…</div><div class="cover-stat-label">(91 avis) Google</div></div>';
                html += '<div class="cover-stat"><div class="cover-stat-value">3.5</div><div class="cover-stat-label">Mois en moyenne</div></div>';
                html += '</div>';
                
                // RÃ©seaux sociaux
                html += '<div class="cover-social">';
                html += '<div class="cover-social-item">' + ico('instagram', 14, 'rgba(255,255,255,0.7)') + ' 33K</div>';
                html += '<div class="cover-social-item">' + ico('linkedin', 14, 'rgba(255,255,255,0.7)') + ' 3.4K</div>';
                html += '<div class="cover-social-item">' + ico('tiktok', 14, 'rgba(255,255,255,0.7)') + ' 4.6K</div>';
                html += '</div>';
                html += '</div>';
                
                // Section bien - design unifiÃ© sombre
                html += '<div class="cover-bien">';
                
                // Type de bien
                html += '<div class="cover-bien-type">' + ico(isAppartement ? 'building' : 'home', 16, 'rgba(255,255,255,0.6)') + ' ' + typeBien + (carac.sousType ? ' â€¢ ' + carac.sousType : '') + '</div>';
                
                // Adresse
                html += '<div class="cover-address">';
                html += '<div class="cover-address-main">' + val(bien.adresse) + '</div>';
                html += '<div class="cover-address-city">' + val(bien.codePostal) + ' ' + val(bien.localite) + '</div>';
                html += '<div class="cover-address-bar"></div>';
                html += '</div>';
                
                // MÃ©triques du bien
                html += '<div class="cover-metrics">';
                if (isAppartement) {
                    html += '<div class="cover-metric"><div class="cover-metric-value">' + (surfacePonderee || surfacePPE).toFixed(0) + '<span class="cover-metric-unit"> mÂ²</span></div><div class="cover-metric-label">Surface</div></div>';
                    html += '<div class="cover-metric"><div class="cover-metric-value">' + (carac.nombreChambres || 'â€”') + '</div><div class="cover-metric-label">Chambres</div></div>';
                    html += '<div class="cover-metric"><div class="cover-metric-value">' + (carac.nombreSDB || 'â€”') + '</div><div class="cover-metric-label">SDB</div></div>';
                    var exterieur = parseFloat(carac.surfaceBalcon || 0) + parseFloat(carac.surfaceTerrasse || 0);
                    if (exterieur > 0) {
                        html += '<div class="cover-metric"><div class="cover-metric-value">' + exterieur.toFixed(0) + '<span class="cover-metric-unit"> mÂ²</span></div><div class="cover-metric-label">ExtÃ©rieur</div></div>';
                    }
                } else {
                    html += '<div class="cover-metric"><div class="cover-metric-value">' + surfaceHabMaison.toFixed(0) + '<span class="cover-metric-unit"> mÂ²</span></div><div class="cover-metric-label">Habitable</div></div>';
                    html += '<div class="cover-metric"><div class="cover-metric-value">' + surfaceTerrain.toFixed(0) + '<span class="cover-metric-unit"> mÂ²</span></div><div class="cover-metric-label">Terrain</div></div>';
                    html += '<div class="cover-metric"><div class="cover-metric-value">' + (carac.nombreChambres || 'â€”') + '</div><div class="cover-metric-label">Chambres</div></div>';
                    if (carac.anneeConstruction) {
                        html += '<div class="cover-metric"><div class="cover-metric-value">' + carac.anneeConstruction + '</div><div class="cover-metric-label">AnnÃ©e</div></div>';
                    }
                }
                html += '</div>';
                
                // Tags (points forts + dernier Ã©tage)
                var allTags = [];
                if (carac.dernierEtage) {
                    allTags.push('<span style="display:inline-flex;align-items:center;gap:4px;">' + ico('mountain', 14, 'rgba(255,255,255,0.5)') + ' Dernier Ã©tage</span>');
                }
                var pointsForts = (analyse.pointsForts || []).filter(function(p) { return p; });
                var emojiToIcon = {
                    'â˜€ï¸': 'luminosite', 'ðŸ—ï¸': 'mountain', 'ðŸ˜Œ': 'calme', 'ðŸ³': 'home',
                    'ðŸš¿': 'bath', 'ðŸªµ': 'volumes', 'ðŸŒ³': 'tree', 'ðŸš—': 'parking',
                    'ðŸ ': 'home', 'ðŸ“': 'mapPin', 'ðŸš†': 'train', 'ðŸ«': 'ecole',
                    'âœ“': 'check'
                };
                pointsForts.forEach(function(p) {
                    var iconName = 'check';
                    var textOnly = p;
                    for (var emoji in emojiToIcon) {
                        if (p.indexOf(emoji) === 0) {
                            iconName = emojiToIcon[emoji];
                            textOnly = p.replace(emoji, '').trim();
                            break;
                        }
                    }
                    allTags.push('<span style="display:inline-flex;align-items:center;gap:5px;">' + ico(iconName, 14, 'rgba(255,255,255,0.5)') + ' ' + textOnly + '</span>');
                });
                allTags = allTags.slice(0, 4); // Max 4 tags
                
                if (allTags.length > 0) {
                    html += '<div class="cover-tags">';
                    allTags.forEach(function(tag) {
                        html += '<div class="cover-tag">' + tag + '</div>';
                    });
                    html += '</div>';
                }
                
                html += '</div>'; // cover-bien
                html += '</div>'; // page cover
                
                // ==================== PAGE QUI EST GARY ====================
                html += '<div class="page gary-page" style="page-break-before:always;">';
                
                // Header
                html += '<div class="gary-header">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
                html += '<div class="header-date">Qui est GARY</div>';
                html += '</div>';
                
                // Content
                html += '<div class="gary-content">';
                
                // Titre et intro
                html += '<div class="gary-title">Une autre faÃ§on de penser la vente immobiliÃ¨re</div>';
                html += '<div class="gary-intro">Vendre un bien, ce n\'est pas publier une annonce. C\'est une sÃ©quence de dÃ©cisions qui engagent l\'image du bien sur le marchÃ©. Chaque exposition laisse une trace. Chaque silence aussi.</div>';
                html += '<div class="gary-divider"></div>';
                
                // Section : Ce que nous croyons
                html += '<div class="gary-section">';
                html += '<div class="gary-section-title">Ce que nous croyons</div>';
                html += '<div class="gary-principles">';
                
                html += '<div class="gary-principle">';
                html += '<div class="gary-principle-title">Une vente est une orchestration, pas une diffusion</div>';
                html += '<div class="gary-principle-text">Le marchÃ© ne rÃ©agit pas aux intentions. Il rÃ©agit aux signaux. Le prix affichÃ©, le moment choisi, le canal utilisÃ© â€” tout parle. Notre rÃ´le est de maÃ®triser ce que le marchÃ© entend.</div>';
                html += '</div>';
                
                html += '<div class="gary-principle">';
                html += '<div class="gary-principle-title">Chaque bien dispose d\'un capital d\'attention limitÃ©</div>';
                html += '<div class="gary-principle-text">Un bien trop exposÃ© perd son pouvoir d\'attraction. Un bien mal positionnÃ© au dÃ©part se retrouve en nÃ©gociation dÃ©fensive. La premiÃ¨re impression conditionne toute la suite.</div>';
                html += '</div>';
                
                html += '<div class="gary-principle">';
                html += '<div class="gary-principle-title">Le timing compte autant que le prix</div>';
                html += '<div class="gary-principle-text">Deux stratÃ©gies identiques, lancÃ©es Ã  deux semaines d\'Ã©cart, peuvent produire des rÃ©sultats opposÃ©s. Le contexte change. Les acheteurs aussi. La mÃ©thode doit s\'adapter en permanence.</div>';
                html += '</div>';
                
                html += '</div>'; // gary-principles
                html += '</div>'; // gary-section
                
                // Section : Notre approche
                html += '<div class="gary-section">';
                html += '<div class="gary-section-title">Notre approche</div>';
                html += '<div class="gary-text">';
                html += '<p>Il n\'existe pas de recette universelle. Plusieurs chemins de vente sont toujours possibles. Le bon choix dÃ©pend du bien, du moment, du contexte, et surtout des retours rÃ©els du marchÃ©.</p>';
                html += '<p>Une stratÃ©gie qui semblait Ã©vidente au dÃ©part peut devoir Ã©voluer aprÃ¨s les premiers signaux. <strong>C\'est pourquoi nous ne figeons jamais un plan. Nous le pilotons.</strong></p>';
                html += '</div>';
                html += '</div>';
                
                // Section : Ce que nous faisons
                html += '<div class="gary-section">';
                html += '<div class="gary-section-title">Ce que nous faisons</div>';
                html += '<div class="gary-roles">';
                html += '<div class="gary-role"><span class="gary-role-icon">' + ico('compass', 12, '#FF4539') + '</span>Lire et interprÃ©ter les signaux du marchÃ©</div>';
                html += '<div class="gary-role"><span class="gary-role-icon">' + ico('target', 12, '#FF4539') + '</span>Arbitrer entre exposition et retenue</div>';
                html += '<div class="gary-role"><span class="gary-role-icon">' + ico('edit', 12, '#FF4539') + '</span>Adapter le discours aux rÃ©actions observÃ©es</div>';
                html += '<div class="gary-role"><span class="gary-role-icon">' + ico('eye', 12, '#FF4539') + '</span>ProtÃ©ger l\'image du bien dans la durÃ©e</div>';
                html += '<div class="gary-role"><span class="gary-role-icon">' + ico('check', 12, '#FF4539') + '</span>SÃ©curiser vos dÃ©cisions Ã  chaque Ã©tape</div>';
                // Niveau 3 : Argument "Pilotage transition" si projet d'achat dÃ©tectÃ©
                if (hasProjetAchatPDF && niveauContraintePDF > 0) {
                    html += '<div class="gary-role"><span class="gary-role-icon">' + ico('refresh', 12, '#FF4539') + '</span>Synchroniser vente et projets personnels</div>';
                }
                html += '</div>';
                html += '<div class="gary-text" style="margin-top:10px;font-style:italic;color:#64748b;">Nous ne sommes pas des diffuseurs. Nous sommes des pilotes.</div>';
                html += '</div>';
                
                // Note
                html += '<div class="gary-note">';
                html += '<div class="gary-note-text">Cette page ne remplace pas un Ã©change. Elle ne donne pas de stratÃ©gie clÃ© en main. Chaque stratÃ©gie se construit Ã  partir du bien rÃ©el, de son contexte, et des signaux observÃ©s sur le terrain.</div>';
                html += '</div>';
                
                // Conclusion
                html += '<div class="gary-conclusion">';
                html += '<div class="gary-conclusion-text">Une bonne stratÃ©gie ne se choisit pas sur le papier.<br/>Elle se construit dans le temps, avec mÃ©thode et discernement.</div>';
                html += '</div>';
                
                html += '</div>'; // gary-content
                
                // Footer
                html += '<div class="gary-footer">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                html += '<div class="gary-footer-text">gary.ch</div>';
                html += '</div>';
                
                html += '</div>'; // page gary
                
                // ==================== PAGE 1 : CARACTÃ‰RISTIQUES & ENVIRONNEMENT ====================
                html += '<div class="page" style="page-break-before:always;">';
                
                // Header
                html += '<div class="header">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
                html += '<div class="header-date">CaractÃ©ristiques du bien</div>';
                html += '</div>';
                
                // Contexte de vente (tags) - design Ã©purÃ©
                var ctxItems = [];
                var statutOcc = contexte.statutOccupation;
                if (statutOcc === 'libre') ctxItems.push({icon: 'key', text: 'Libre'});
                else if (statutOcc === 'loue') {
                    var finBail = contexte.finBailMois && contexte.finBailAnnee ? contexte.finBailMois + '/' + contexte.finBailAnnee : '';
                    ctxItems.push({icon: 'file', text: 'LouÃ©' + (finBail ? ' (fin ' + finBail + ')' : '')});
                }
                else if (statutOcc === 'occupeProprietaire') ctxItems.push({icon: 'home', text: 'OccupÃ© propriÃ©taire'});
                
                var confid = contexte.confidentialite;
                if (confid === 'discrete') ctxItems.push({icon: 'eye', text: 'Vente discrÃ¨te'});
                else if (confid === 'confidentielle') ctxItems.push({icon: 'lock', text: 'Off-market'});
                
                var prio = contexte.prioriteVendeur;
                if (prio === 'prixMax') ctxItems.push({icon: 'trendingUp', text: 'PrioritÃ© prix'});
                else if (prio === 'venteRapide') ctxItems.push({icon: 'zap', text: 'PrioritÃ© rapiditÃ©'});
                
                if (carac.dernierEtage) ctxItems.push({icon: 'mountain', text: 'Dernier Ã©tage'});
                
                if (ctxItems.length > 0) {
                    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 24px;background:#fafafa;border-bottom:1px solid #e5e7eb;">';
                    ctxItems.forEach(function(item) {
                        html += '<span style="font-size:11px;padding:6px 12px;background:white;border-radius:6px;border:1px solid #e5e7eb;display:flex;align-items:center;gap:6px;color:#374151;">' + ico(item.icon, 14, '#6b7280') + item.text + '</span>';
                    });
                    html += '</div>';
                }
                
                // MÃ©triques principales - design Ã©purÃ© et compact
                html += '<div style="display:flex;background:white;border-bottom:1px solid #e5e7eb;">';
                html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
                html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
                html += '<div>' + ico('surface', 20, '#9ca3af') + '</div>';
                html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + surfacePrincipale.toFixed(0) + '</div>';
                html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">mÂ² ' + (isAppartement ? 'pondÃ©rÃ©s' : 'habitables') + '</div></div>';
                html += '</div></div>';
                html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
                html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
                html += '<div>' + ico('pieces', 20, '#9ca3af') + '</div>';
                html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + val(carac.nombrePieces) + '</div>';
                html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">piÃ¨ces</div></div>';
                html += '</div></div>';
                html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
                html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
                html += '<div>' + ico('chambres', 20, '#9ca3af') + '</div>';
                html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + val(carac.nombreChambres) + '</div>';
                html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">chambres</div></div>';
                html += '</div></div>';
                if (isAppartement) {
                    html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
                    html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
                    html += '<div>' + ico('etage', 20, '#9ca3af') + '</div>';
                    html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + val(carac.etage) + '</div>';
                    html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Ã©tage</div></div>';
                    html += '</div></div>';
                } else {
                    html += '<div style="flex:1;padding:12px 8px;text-align:center;border-right:1px solid #f3f4f6;">';
                    html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
                    html += '<div>' + ico('tree', 20, '#9ca3af') + '</div>';
                    html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + surfaceTerrain.toFixed(0) + '</div>';
                    html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">mÂ² terrain</div></div>';
                    html += '</div></div>';
                }
                html += '<div style="flex:1;padding:12px 8px;text-align:center;">';
                html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;">';
                html += '<div>' + ico('construction', 20, '#9ca3af') + '</div>';
                html += '<div><div style="font-size:22px;font-weight:300;color:#111827;letter-spacing:-0.5px;">' + val(carac.anneeConstruction) + '</div>';
                html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">construction</div></div>';
                html += '</div></div>';
                html += '</div>';
                
                // Labels pour affichage vue
                var vueLabels = {degagee: 'DÃ©gagÃ©e', lac: 'Lac', montagne: 'Montagne', campagne: 'Campagne', jardin: 'Jardin', urbaine: 'Urbaine', vis_a_vis: 'Vis-Ã -vis'};
                var vueDisplay = vueLabels[carac.vue] || carac.vue || 'â€”';
                var diffLabels = {sol: 'Au sol', radiateur: 'Radiateurs', convecteur: 'Convecteurs', poele: 'PoÃªle', cheminee: 'CheminÃ©e', plafond: 'Plafond'};
                
                // CaractÃ©ristiques dÃ©taillÃ©es - design Ã©purÃ©
                html += '<div style="padding:20px 24px;background:white;">';
                html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;font-weight:600;">CaractÃ©ristiques dÃ©taillÃ©es</div>';
                
                if (isAppartement) {
                    var diffAppartList = carac.diffusion || [];
                    var diffAppartDisplay = diffAppartList.length > 0 ? diffAppartList.map(function(d) { return diffLabels[d] || d; }).join(', ') : 'â€”';
                    // APPARTEMENT - Ligne 1
                    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface PPE</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + surfacePPE.toFixed(0) + ' mÂ²</div></div>';
                    html += '<div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:10px;border-left:3px solid #111827;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface pondÃ©rÃ©e</div><div style="font-size:15px;font-weight:700;color:#111827;">' + surfacePonderee.toFixed(1) + ' mÂ²</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Ã‰tage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + val(carac.etage) + ' / ' + val(carac.nombreEtagesImmeuble) + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Ascenseur</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.ascenseur === 'oui' ? 'Oui' : (carac.ascenseur === 'non' ? 'Non' : 'â€”')) + '</div></div>';
                    html += '</div>';
                    // APPARTEMENT - Ligne 2
                    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Balcon</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.surfaceBalcon ? carac.surfaceBalcon + ' mÂ²' : 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Terrasse</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.surfaceTerrasse ? carac.surfaceTerrasse + ' mÂ²' : 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Salles de bain</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (val(carac.nombreSDB) || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">WC</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (val(carac.nombreWC) || 'â€”') + '</div></div>';
                    html += '</div>';
                    // APPARTEMENT - Ligne 3
                    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Diffusion chaleur</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + diffAppartDisplay + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Exposition</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + ((carac.exposition || []).join(', ') || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Vue</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + vueDisplay + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">CECB</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (val(carac.cecb) || 'â€”') + '</div></div>';
                    html += '</div>';
                    // APPARTEMENT - Ligne 4
                    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Parking int.</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (nbPlaceInt || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Parking ext.</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (nbPlaceExt || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Box</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (nbBox || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Charges</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (carac.chargesMensuelles ? carac.chargesMensuelles + ' CHF' : 'â€”') + '</div></div>';
                    html += '</div>';
                } else {
                    // MAISON - Ligne 1
                    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface habitable</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + val(carac.surfaceHabitableMaison) + ' mÂ²</div></div>';
                    html += '<div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:10px;border-left:3px solid #111827;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Surface terrain</div><div style="font-size:15px;font-weight:700;color:#111827;">' + surfaceTerrain.toFixed(0) + ' mÂ²</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Niveaux</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (val(carac.nombreNiveaux) || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Cubage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + cubage.toFixed(0) + ' mÂ³</div></div>';
                    html += '</div>';
                    // MAISON - Ligne 2
                    var chaufLabels = {pac: 'PAC', gaz: 'Gaz', mazout: 'Mazout', pellets: 'Pellets', electrique: 'Ã‰lectrique', cad: 'CAD', geothermie: 'GÃ©othermie', autre: 'Autre'};
                    var chaufDisplay = chaufLabels[carac.chauffage] || carac.chauffage || 'â€”';
                    var diffMap = {sol: 'Au sol', radiateur: 'Radiateurs', convecteur: 'Convecteurs', poele: 'PoÃªle', cheminee: 'CheminÃ©e', plafond: 'Plafond'};
                    var diffMaisonDisplay = 'â€”';
                    var diffMaisonRaw = carac.diffusionMaison;
                    if (diffMaisonRaw) {
                        if (Array.isArray(diffMaisonRaw)) {
                            var diffNames = diffMaisonRaw.map(function(d) { return diffMap[d] || d; });
                            diffMaisonDisplay = diffNames.join(', ') || 'â€”';
                        } else {
                            diffMaisonDisplay = diffMap[diffMaisonRaw] || diffMaisonRaw;
                        }
                    }
                    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Salles de bain</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (val(carac.nombreSDB) || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">WC</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (val(carac.nombreWC) || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Chauffage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + chaufDisplay + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Diffusion</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + diffMaisonDisplay + '</div></div>';
                    html += '</div>';
                    // MAISON - Ligne 3
                    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px;">';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Exposition</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + ((carac.exposition || []).join(', ') || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Vue</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + vueDisplay + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">CECB</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (val(carac.cecb) || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Construction</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (val(carac.anneeConstruction) || 'â€”') + '</div></div>';
                    html += '</div>';
                    // MAISON - Ligne 4 (parkings)
                    var pkgCouvert = parseInt(carac.parkingCouverte) || 0;
                    var pkgExtMaison = parseInt(carac.parkingExterieur) || 0;
                    var pkgGarage = parseInt(carac.box) || 0;
                    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Parking couvert</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (pkgCouvert || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Parking ext.</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (pkgExtMaison || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Garage</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (pkgGarage || 'â€”') + '</div></div>';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:4px;padding:10px;"><div style="font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Zone</div><div style="font-size:15px;font-weight:700;color:#1a2e35;">' + (val(carac.zone) || 'â€”') + '</div></div>';
                    html += '</div>';
                    
                    // RÃ‰PARTITION DES NIVEAUX (si renseignÃ©)
                    var repartitionSoussol = carac.repartitionSoussol || '';
                    var repartitionNiveaux = carac.repartitionNiveaux || [];
                    var niveauxCustom = carac.niveauxCustom || [];
                    var hasRepartition = repartitionSoussol || repartitionNiveaux.some(function(r) { return r; }) || niveauxCustom.length > 0;
                    
                    if (hasRepartition) {
                        html += '<div style="margin-top:12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">';
                        html += '<div style="background:#1a2e35;color:white;padding:8px 12px;font-size:9px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">ðŸ  RÃ©partition des niveaux</div>';
                        html += '<div style="padding:0;">';
                        
                        // Sous-sol
                        if (repartitionSoussol) {
                            html += '<div style="display:flex;border-bottom:1px solid #e5e7eb;">';
                            html += '<div style="width:120px;padding:8px 12px;background:#f1f5f9;font-size:10px;font-weight:600;color:#64748b;">Sous-sol</div>';
                            html += '<div style="flex:1;padding:8px 12px;font-size:10px;color:#1a2e35;">' + repartitionSoussol + '</div>';
                            html += '</div>';
                        }
                        
                        // Niveaux auto (Rez + Ã©tages)
                        var nombreNiveauxPdf = parseInt(carac.nombreNiveaux) || 0;
                        for (var ni = 0; ni < nombreNiveauxPdf; ni++) {
                            var niveauContent = repartitionNiveaux[ni] || '';
                            if (niveauContent) {
                                var niveauLabel = ni === 0 ? 'Rez-de-chaussÃ©e' : (ni === 1 ? '1er Ã©tage' : ni + 'Ã¨me Ã©tage');
                                html += '<div style="display:flex;border-bottom:1px solid #e5e7eb;">';
                                html += '<div style="width:120px;padding:8px 12px;background:#f1f5f9;font-size:10px;font-weight:600;color:#64748b;">' + niveauLabel + '</div>';
                                html += '<div style="flex:1;padding:8px 12px;font-size:10px;color:#1a2e35;">' + niveauContent + '</div>';
                                html += '</div>';
                            }
                        }
                        
                        // Niveaux custom (Combles, Mezzanine, etc.)
                        for (var ci = 0; ci < niveauxCustom.length; ci++) {
                            var customNiveau = niveauxCustom[ci];
                            if (customNiveau.label || customNiveau.description) {
                                html += '<div style="display:flex;border-bottom:1px solid #e5e7eb;">';
                                html += '<div style="width:120px;padding:8px 12px;background:#fef9c3;font-size:10px;font-weight:600;color:#92400e;">' + (customNiveau.label || 'Autre') + '</div>';
                                html += '<div style="flex:1;padding:8px 12px;font-size:10px;color:#1a2e35;">' + (customNiveau.description || 'â€”') + '</div>';
                                html += '</div>';
                            }
                        }
                        
                        html += '</div></div>';
                    }
                }
                html += '</div>';
                
                // Section RÃ©novations & Travaux (si renseignÃ©s)
                var renoLabels = {moins10ans: '< 10 ans', structure: 'Structure', technique: 'Technique', cuisine: 'Cuisine', salles_eau: 'Salles eau', menuiseries: 'FenÃªtres', finitions: 'Finitions'};
                var travLabels = {toiture: 'Toiture', facade: 'FaÃ§ade', fenetres: 'FenÃªtres', chauffage: 'Chauffage', electrique: 'Ã‰lectricitÃ©', plomberie: 'Plomberie', cuisine: 'Cuisine', sdb: 'SDB', sols: 'Sols', isolation: 'Isolation', peinture: 'Peinture', jardin: 'ExtÃ©rieurs'};
                var renoArr = carac.typeRenovation || [];
                var travArr = carac.travauxRecents || [];
                if (carac.anneeRenovation || renoArr.length > 0 || travArr.length > 0) {
                    html += '<div style="padding:12px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">';
                    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
                    html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;display:flex;align-items:center;gap:6px;">' + ico('refresh', 14, '#6b7280') + 'RÃ©novations & Travaux</div>';
                    if (carac.anneeRenovation) {
                        html += '<div style="font-size:10px;color:#374151;font-weight:600;">RÃ©novÃ© en ' + carac.anneeRenovation + '</div>';
                    }
                    html += '</div>';
                    if (renoArr.length > 0 || travArr.length > 0) {
                        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
                        for (var ri = 0; ri < renoArr.length; ri++) {
                            html += '<span style="background:white;color:#374151;padding:4px 10px;border-radius:4px;font-size:9px;border:1px solid #e5e7eb;">' + (renoLabels[renoArr[ri]] || renoArr[ri]) + '</span>';
                        }
                        for (var ti = 0; ti < travArr.length; ti++) {
                            html += '<span style="background:white;color:#374151;padding:4px 10px;border-radius:4px;font-size:9px;border:1px solid #e5e7eb;">' + (travLabels[travArr[ti]] || travArr[ti]) + '</span>';
                        }
                        html += '</div>';
                    }
                    html += '</div>';
                }
                
                // Ã‰tat du bien - design Ã©purÃ©
                html += '<div style="padding:16px 24px;background:#fafafa;border-top:1px solid #e5e7eb;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
                html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Ã‰tat du bien</div>';
                html += '<div style="font-size:8px;color:#9ca3af;display:flex;gap:12px;">';
                html += '<span style="display:flex;align-items:center;gap:4px;">' + ico('sparkles', 12, '#3b82f6') + 'Neuf</span>';
                html += '<span style="display:flex;align-items:center;gap:4px;">' + ico('checkCircle', 12, '#10b981') + 'Bon</span>';
                html += '<span style="display:flex;align-items:center;gap:4px;">' + ico('refresh', 12, '#f59e0b') + 'Ã€ rafraÃ®chir</span>';
                html += '<span style="display:flex;align-items:center;gap:4px;">' + ico('xCircle', 12, '#ef4444') + 'Ã€ refaire</span>';
                html += '</div></div>';
                html += '<div style="display:flex;gap:6px;margin-bottom:12px;">';
                var etats = [{l:'Cuisine',v:analyse.etatCuisine},{l:'Salle de bain',v:analyse.etatSDB},{l:'Sols',v:analyse.etatSols},{l:'Murs',v:analyse.etatMurs},{l:'Menuiseries',v:analyse.etatMenuiseries},{l:'Ã‰lectricitÃ©',v:analyse.etatElectricite}];
                etats.forEach(function(e) {
                    var icoName = e.v === 'neuf' ? 'sparkles' : (e.v === 'bon' ? 'checkCircle' : (e.v === 'rafraichir' ? 'refresh' : (e.v === 'refaire' ? 'xCircle' : 'minus')));
                    var icoColor = e.v === 'neuf' ? '#3b82f6' : (e.v === 'bon' ? '#10b981' : (e.v === 'rafraichir' ? '#f59e0b' : (e.v === 'refaire' ? '#ef4444' : '#d1d5db')));
                    html += '<div style="flex:1;text-align:center;padding:10px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;">';
                    html += '<div style="margin-bottom:4px;">' + ico(icoName, 18, icoColor) + '</div>';
                    html += '<div style="font-size:8px;color:#6b7280;font-weight:500;">' + e.l + '</div>';
                    html += '</div>';
                });
                html += '</div>';
                
                // Ambiance - design Ã©purÃ©
                html += '<div style="display:flex;gap:10px;">';
                [{l:'LuminositÃ©',v:analyse.luminosite||0,icoName:'luminosite'},{l:'Calme',v:analyse.calme||0,icoName:'calme'},{l:'Volumes',v:analyse.volumes||0,icoName:'volumes'}].forEach(function(a) {
                    html += '<div style="flex:1;background:white;border-radius:6px;padding:10px;border:1px solid #e5e7eb;">';
                    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
                    html += '<span style="font-size:10px;color:#6b7280;font-weight:500;display:flex;align-items:center;gap:6px;">' + ico(a.icoName, 14, '#9ca3af') + a.l + '</span>';
                    html += '<span style="font-size:11px;font-weight:600;color:#111827;">' + a.v + '/5</span>';
                    html += '</div>';
                    html += '<div style="height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden;">';
                    html += '<div style="height:100%;width:' + (a.v*20) + '%;background:#111827;border-radius:2px;"></div>';
                    html += '</div></div>';
                });
                html += '</div></div>';
                
                // ProximitÃ©s - design Ã©purÃ©
                var proximites = identification?.proximites || [];
                var proxFilled = proximites.filter(function(p) { return p.libelle && p.distance; }).slice(0, 6);
                var proxIcons = {'ðŸšŒ': 'bus', 'ðŸšƒ': 'train', 'ðŸ«': 'ecole', 'ðŸ›’': 'commerce', 'ðŸ¥': 'sante', 'ðŸŒ³': 'nature'};
                
                html += '<div style="padding:16px 24px;background:white;border-top:1px solid #e5e7eb;">';
                html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;">ProximitÃ©s & CommoditÃ©s</div>';
                if (proxFilled.length > 0) {
                    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
                    proxFilled.forEach(function(p) {
                        var distStr = String(p.distance);
                        var distDisplay = distStr + (distStr && !distStr.endsWith('m') && !distStr.endsWith('km') ? 'm' : '');
                        var proxIcoName = proxIcons[p.icone] || 'mapPin';
                        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #e5e7eb;border-radius:6px;">';
                        html += '<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#f9fafb;border-radius:6px;">' + ico(proxIcoName, 18, '#6b7280') + '</div>';
                        html += '<div style="flex:1;min-width:0;">';
                        html += '<div style="font-size:10px;color:#374151;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.libelle + '</div>';
                        html += '<div style="font-size:12px;font-weight:700;color:#111827;">' + distDisplay + '</div>';
                        html += '</div></div>';
                    });
                    html += '</div>';
                } else {
                    html += '<div style="color:#9ca3af;font-style:italic;text-align:center;padding:12px;">Aucune proximitÃ© renseignÃ©e</div>';
                }
                html += '</div>';
                
                // Footer page 2
                html += '<div class="footer">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                html += '<div class="footer-ref">Page 1/' + totalPages + ' â€¢ ' + val(bien.adresse) + '</div>';
                html += '<div class="footer-slogan">On pilote, vous dÃ©cidez.</div>';
                html += '</div>';
                
                html += '</div>'; // page 1
                

                // ==================== PAGE 2 : TRAJECTOIRES DE VENTE ====================
                html += '<div class="page" style="page-break-before:always;">';
                
                // Header
                html += '<div class="header">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
                html += '<div class="header-date">' + copy.headerTitle + '</div>';
                html += '</div>';
                
                // Intro - compact
                html += '<div style="padding:12px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
                html += '<div style="font-size:10px;color:#4b5563;line-height:1.5;text-align:center;">' + copy.introPhrase + '</div>';
                
                // Phrase neutre si projet de transition dÃ©tectÃ© (JAMAIS exposer les contraintes)
                if (hasProjetAchatPDF && niveauContraintePDF > 0) {
                    var phraseTransition = '';
                    if (niveauContraintePDF >= 4) {
                        // Contrainte forte/critique
                        phraseTransition = 'Cette trajectoire a Ã©tÃ© calibrÃ©e pour s\'harmoniser avec vos projets personnels et vous garantir une transition sereine.';
                    } else if (niveauContraintePDF >= 2) {
                        // Contrainte moyenne/Ã©levÃ©e
                        phraseTransition = 'Le rythme proposÃ© vous laisse la maÃ®trise du calendrier tout en maximisant vos opportunitÃ©s.';
                    } else {
                        // Contrainte faible (recherche)
                        phraseTransition = 'Cette approche prÃ©serve votre flexibilitÃ© pour concrÃ©tiser sereinement vos projets.';
                    }
                    html += '<div style="font-size:9px;color:#0369a1;line-height:1.4;text-align:center;margin-top:8px;font-style:italic;">' + phraseTransition + '</div>';
                }
                
                html += '</div>';
                
                // Les 3 trajectoires (avec donnÃ©es luxMode)
                var trajectoires = [
                    {
                        id: 'offmarket',
                        nom: 'Off-Market',
                        icon: 'lock',
                        objectif: 'Tester la demande en toute discrÃ©tion, sans exposition publique',
                        objectifLux: 'Valider l\'intÃ©rÃªt sans crÃ©er de trace publique',
                        conditions: ['Cercle restreint d\'acheteurs qualifiÃ©s', 'Aucune trace publique', 'Retours confidentiels'],
                        typeExposition: 'Cercle restreint',
                        typePression: 'Aucun signal public',
                        priseEnCharge: 'GARY sÃ©lectionne et approche les acquÃ©reurs qualifiÃ©s',
                        pourc: pre.pourcOffmarket ?? 15
                    },
                    {
                        id: 'comingsoon',
                        nom: luxMode ? 'Lancement maÃ®trisÃ©' : 'Coming Soon',
                        icon: 'clock',
                        objectif: 'CrÃ©er l\'anticipation et gÃ©nÃ©rer une premiÃ¨re tension',
                        objectifLux: 'Orchestrer l\'anticipation avec un rÃ©cit maÃ®trisÃ©',
                        conditions: ['Communication maÃ®trisÃ©e', 'Liste d\'attente', 'Teasing ciblÃ©'],
                        typeExposition: 'Anticipation contrÃ´lÃ©e',
                        typePression: 'Pression relationnelle ciblÃ©e',
                        priseEnCharge: 'GARY construit le rÃ©cit et gÃ¨re le tempo de rÃ©vÃ©lation',
                        pourc: pre.pourcComingsoon ?? 10
                    },
                    {
                        id: 'public',
                        nom: 'MarchÃ© Public',
                        icon: 'globe',
                        objectif: luxMode ? 'Arbitrer le tempo et amplifier si nÃ©cessaire' : 'Maximiser l\'exposition et accÃ©lÃ©rer la transaction',
                        objectifLux: 'Amplification assumÃ©e selon les signaux observÃ©s',
                        conditions: luxMode ? ['PortÃ©e contrÃ´lÃ©e', 'Portails sÃ©lectifs', 'RaretÃ© maÃ®trisÃ©e'] : ['Diffusion large', 'Portails immobiliers', 'VisibilitÃ© maximale'],
                        typeExposition: 'Amplification assumÃ©e',
                        typePression: 'RaretÃ© maÃ®trisÃ©e',
                        priseEnCharge: 'GARY pilote l\'exposition et filtre les demandes',
                        pourc: pre.pourcPublic ?? 6
                    }
                ];
                
                // === TIMELINE AVEC DATES DANS LE PDF ===
                var phaseDureesBase = data.phaseDurees || { phase0: 1, phase1: 3, phase2: 2, phase3: 10 };
                
                // Calcul de la pause de recalibrage marchÃ©
                var pauseRecalibragePDF = 0;
                if (historique.dejaDiffuse) {
                    var dureeDiffusion = historique.duree || '';
                    if (dureeDiffusion === 'moins1mois') pauseRecalibragePDF = 1;
                    else if (dureeDiffusion === '1-3mois') pauseRecalibragePDF = 2;
                    else if (dureeDiffusion === '3-6mois') pauseRecalibragePDF = 3;
                    else if (dureeDiffusion === '6-12mois') pauseRecalibragePDF = 4;
                    else if (dureeDiffusion === 'plus12mois') pauseRecalibragePDF = 5;
                    else pauseRecalibragePDF = 2; // DÃ©faut
                }
                
                // === AJUSTEMENTS PROJET POST-VENTE ===
                // Note: hasProjetAchatPDF et niveauContraintePDF sont dÃ©jÃ  dÃ©finis au dÃ©but de downloadPDF
                var projetPV = identification?.projetPostVente || {};
                var avancementPDF = projetPV.avancement || '';
                var flexibilitePDF = projetPV.flexibilite || '';
                var toleranceVenteRapidePDF = projetPV.toleranceVenteRapide || false;
                var toleranceVenteLonguePDF = projetPV.toleranceVenteLongue || false;
                
                // Calculer les ajustements
                var ajustPhase0 = 0;
                var ajustPhase1 = 0;
                var ajustPhase2 = 0;
                var ajustPhase3 = 0;
                
                if (hasProjetAchatPDF && niveauContraintePDF > 0) {
                    // Contrainte CRITIQUE ou FORTE
                    if (niveauContraintePDF >= 4) {
                        if (flexibilitePDF === 'faible') {
                            ajustPhase1 = -2;
                            ajustPhase2 = -1;
                        } else {
                            ajustPhase1 = -1;
                        }
                    }
                    // Contrainte Ã‰LEVÃ‰E
                    else if (niveauContraintePDF === 3) {
                        if (toleranceVenteRapidePDF) {
                            ajustPhase1 = -1;
                        }
                    }
                    // Contrainte FAIBLE (recherche active)
                    else if (niveauContraintePDF === 1) {
                        if (toleranceVenteLonguePDF) {
                            ajustPhase1 = 1; // Off-market prolongÃ©
                        }
                    }
                }
                
                // Inclure la pause ET les ajustements dans les durÃ©es
                var phaseDurees = {
                    phase0: Math.max(1, (phaseDureesBase.phase0 || 1) + pauseRecalibragePDF + ajustPhase0),
                    phase1: Math.max(1, (phaseDureesBase.phase1 || 3) + ajustPhase1),
                    phase2: Math.max(1, (phaseDureesBase.phase2 || 2) + ajustPhase2),
                    phase3: Math.max(4, (phaseDureesBase.phase3 || 10) + ajustPhase3)
                };
                
                // Calculer le prochain lundi si pas de date
                var getNextMondayPDF = function(fromDate) {
                    var date = new Date(fromDate || new Date());
                    var day = date.getDay();
                    var daysUntilMonday = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
                    date.setDate(date.getDate() + daysUntilMonday);
                    return date;
                };
                
                var dateDebutPDF = data.dateDebut ? new Date(data.dateDebut) : getNextMondayPDF();
                
                // === DATE IDÃ‰ALE DE VENTE ===
                var dateVenteIdealePDF = data.dateVenteIdeale || '';
                var hasDateAchatFixePDF = hasProjetAchatPDF && niveauContraintePDF >= 4;
                var useAutoCalculPDF = dateVenteIdealePDF && !hasDateAchatFixePDF;
                
                // Fonction pour calculer la durÃ©e en semaines jusqu'Ã  la date idÃ©ale
                var getDureeTotalePDF = function() {
                    if (!dateVenteIdealePDF) return null;
                    // dateVenteIdealePDF est au format "YYYY-MM", on prend le dernier jour du mois
                    var parts = dateVenteIdealePDF.split('-');
                    var year = parseInt(parts[0]);
                    var month = parseInt(parts[1]);
                    var dateFinMois = new Date(year, month, 0); // Dernier jour du mois
                    var diffMs = dateFinMois - dateDebutPDF;
                    return Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
                };
                
                // Fonction pour calculer les phases automatiquement
                var calculerPhasesAutoPDF = function(dureeTotal) {
                    var MIN_TOTAL = 6;
                    var duree = Math.max(MIN_TOTAL, dureeTotal);
                    var MIN_PHASE0 = 1;
                    var MIN_PHASE1 = 1;
                    var MIN_PHASE2 = 1;
                    var MIN_PHASE3 = 4;
                    var MAX_PHASE1 = 26;
                    
                    var phase0 = MIN_PHASE0 + pauseRecalibragePDF;
                    var phase1, phase2, phase3;
                    var disponibleApresPrepa = duree - phase0;
                    
                    if (disponibleApresPrepa < 6) {
                        phase1 = MIN_PHASE1;
                        phase2 = MIN_PHASE2;
                        phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
                    } else if (disponibleApresPrepa <= 12) {
                        phase1 = 2;
                        phase2 = 2;
                        phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
                    } else if (disponibleApresPrepa <= 20) {
                        phase1 = Math.min(6, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 2) * 0.4));
                        phase2 = 2;
                        phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
                    } else if (disponibleApresPrepa <= 30) {
                        phase1 = Math.min(12, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 3) * 0.5));
                        phase2 = 3;
                        phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
                    } else if (disponibleApresPrepa <= 40) {
                        phase1 = Math.min(20, Math.floor((disponibleApresPrepa - MIN_PHASE3 - 3) * 0.55));
                        phase2 = 3;
                        phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
                    } else {
                        phase1 = MAX_PHASE1;
                        phase2 = 4;
                        phase3 = Math.max(MIN_PHASE3, disponibleApresPrepa - phase1 - phase2);
                    }
                    
                    return {
                        phase0: Math.max(MIN_PHASE0, phase0),
                        phase1: Math.max(MIN_PHASE1, Math.min(MAX_PHASE1, phase1)),
                        phase2: Math.max(MIN_PHASE2, phase2),
                        phase3: Math.max(MIN_PHASE3, phase3)
                    };
                };
                
                // Si dateVenteIdeale renseignÃ©e (et pas de date achat fixe), recalculer les phases
                var dureeTotalePDF = getDureeTotalePDF();
                if (useAutoCalculPDF && dureeTotalePDF !== null) {
                    var phasesAuto = calculerPhasesAutoPDF(dureeTotalePDF);
                    phaseDurees = phasesAuto; // Remplacer les durÃ©es par celles calculÃ©es automatiquement
                }
                
                var formatDatePDF = function(date) {
                    var mois = ['janvier', 'fÃ©vrier', 'mars', 'avril', 'mai', 'juin', 
                                'juillet', 'aoÃ»t', 'septembre', 'octobre', 'novembre', 'dÃ©cembre'];
                    return date.getDate() + ' ' + mois[date.getMonth()] + ' ' + date.getFullYear();
                };
                
                var addWeeksPDF = function(date, weeks) {
                    var result = new Date(date);
                    result.setDate(result.getDate() + weeks * 7);
                    return result;
                };
                
                // Calculer les dates
                var phase0Start = dateDebutPDF;
                var phase0End = addWeeksPDF(phase0Start, phaseDurees.phase0);
                var phase1Start = phase0End;
                var phase1End = addWeeksPDF(phase1Start, phaseDurees.phase1);
                var phase2Start = phase1End;
                var phase2End = addWeeksPDF(phase2Start, phaseDurees.phase2);
                var phase3Start = phase2End;
                var phase3End = addWeeksPDF(phase3Start, phaseDurees.phase3);
                
                // Calculer la date de vente estimÃ©e selon le point de dÃ©part choisi
                var dateVenteEstimee;
                
                // Si dateVenteIdeale renseignÃ©e (et pas de date achat fixe), utiliser cette date
                if (useAutoCalculPDF && dateVenteIdealePDF) {
                    var parts = dateVenteIdealePDF.split('-');
                    var year = parseInt(parts[0]);
                    var month = parseInt(parts[1]);
                    dateVenteEstimee = new Date(year, month, 0); // Dernier jour du mois
                } else if (typeMV === 'offmarket') {
                    // Toutes les phases : phase0 + phase1 + phase2 + phase3
                    dateVenteEstimee = phase3End;
                } else if (typeMV === 'comingsoon') {
                    // Skip phase1 : phase0 + phase2 + phase3
                    var dureeTotalCS = phaseDurees.phase0 + phaseDurees.phase2 + phaseDurees.phase3;
                    dateVenteEstimee = addWeeksPDF(phase0Start, dureeTotalCS);
                } else {
                    // public : phase0 + phase3 seulement
                    var dureeTotalPub = phaseDurees.phase0 + phaseDurees.phase3;
                    dateVenteEstimee = addWeeksPDF(phase0Start, dureeTotalPub);
                }
                
                // Timeline visuelle en haut
                html += '<div style="padding:16px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">';
                html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:600;display:flex;align-items:center;gap:5px;">' + ico('calendar', 12, '#9ca3af') + 'Planning prÃ©visionnel</div>';
                html += '<div style="display:flex;gap:6px;">';
                
                // DÃ©terminer quelles phases sont actives selon le point de dÃ©part
                var phase1Active = (typeMV === 'offmarket');
                var phase2Active = (typeMV === 'offmarket' || typeMV === 'comingsoon');
                
                // Recalculer les dates de dÃ©but selon les phases actives
                var phase2StartActif = phase1Active ? phase1End : phase0End;
                var phase3StartActif = phase2Active ? addWeeksPDF(phase2StartActif, phaseDurees.phase2) : phase0End;
                
                // Phase 0 - Toujours active
                var phase0Label = pauseRecalibragePDF > 0 ? 'PrÃ©pa. & Recalibrage' : 'PrÃ©paration';
                html += '<div style="flex:1;text-align:center;padding:8px 4px;background:linear-gradient(135deg,#fff5f4 0%,#ffffff 100%);border-radius:6px;border:2px solid #FF4539;">';
                html += '<div style="margin-bottom:2px;">' + ico('camera', 16, '#FF4539') + '</div>';
                html += '<div style="font-size:9px;font-weight:600;color:#1a2e35;">' + phase0Label + '</div>';
                html += '<div style="font-size:7px;color:#6b7280;margin-top:2px;">' + formatDatePDF(phase0Start).split(' ').slice(0,2).join(' ') + '</div>';
                html += '<div style="font-size:7px;color:#6b7280;">' + phaseDurees.phase0 + ' sem.</div>';
                html += '</div>';
                
                // Phase 1 - Off-market (grisÃ© si non actif)
                if (phase1Active) {
                    html += '<div style="flex:1;text-align:center;padding:8px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;">';
                    html += '<div style="margin-bottom:2px;">' + ico('key', 16, '#6b7280') + '</div>';
                    html += '<div style="font-size:9px;font-weight:600;color:#1a2e35;">Off-market</div>';
                    html += '<div style="font-size:7px;color:#6b7280;margin-top:2px;">' + formatDatePDF(phase1Start).split(' ').slice(0,2).join(' ') + '</div>';
                    html += '<div style="font-size:7px;color:#6b7280;">' + phaseDurees.phase1 + ' sem.</div>';
                    html += '</div>';
                } else {
                    html += '<div style="flex:1;text-align:center;padding:8px 4px;background:#f9fafb;border-radius:6px;border:1px dashed #e5e7eb;opacity:0.5;">';
                    html += '<div style="margin-bottom:2px;">' + ico('key', 16, '#d1d5db') + '</div>';
                    html += '<div style="font-size:9px;font-weight:600;color:#9ca3af;">Off-market</div>';
                    html += '<div style="font-size:7px;color:#d1d5db;margin-top:2px;">â€”</div>';
                    html += '<div style="font-size:7px;color:#d1d5db;">Optionnel</div>';
                    html += '</div>';
                }
                
                // Phase 2 - Coming soon (grisÃ© si non actif)
                if (phase2Active) {
                    html += '<div style="flex:1;text-align:center;padding:8px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;">';
                    html += '<div style="margin-bottom:2px;">' + ico('clock', 16, '#6b7280') + '</div>';
                    html += '<div style="font-size:9px;font-weight:600;color:#1a2e35;">Coming soon</div>';
                    html += '<div style="font-size:7px;color:#6b7280;margin-top:2px;">' + formatDatePDF(phase2StartActif).split(' ').slice(0,2).join(' ') + '</div>';
                    html += '<div style="font-size:7px;color:#6b7280;">' + phaseDurees.phase2 + ' sem.</div>';
                    html += '</div>';
                } else {
                    html += '<div style="flex:1;text-align:center;padding:8px 4px;background:#f9fafb;border-radius:6px;border:1px dashed #e5e7eb;opacity:0.5;">';
                    html += '<div style="margin-bottom:2px;">' + ico('clock', 16, '#d1d5db') + '</div>';
                    html += '<div style="font-size:9px;font-weight:600;color:#9ca3af;">Coming soon</div>';
                    html += '<div style="font-size:7px;color:#d1d5db;margin-top:2px;">â€”</div>';
                    html += '<div style="font-size:7px;color:#d1d5db;">Optionnel</div>';
                    html += '</div>';
                }
                
                // Phase 3 - Public (toujours active)
                html += '<div style="flex:1;text-align:center;padding:8px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;">';
                html += '<div style="margin-bottom:2px;">' + ico('globe', 16, '#6b7280') + '</div>';
                html += '<div style="font-size:9px;font-weight:600;color:#1a2e35;">Public</div>';
                html += '<div style="font-size:7px;color:#6b7280;margin-top:2px;">' + formatDatePDF(phase3StartActif).split(' ').slice(0,2).join(' ') + '</div>';
                html += '<div style="font-size:7px;color:#6b7280;">~' + phaseDurees.phase3 + ' sem.</div>';
                html += '</div>';
                
                html += '</div>'; // fin flex
                
                // Date de vente estimÃ©e
                html += '<div style="text-align:center;margin-top:10px;font-size:9px;color:#6b7280;">';
                html += '' + ico('calendar', 12, '#6b7280') + ' Vente estimÃ©e : <strong style="color:#1a2e35;">' + formatDatePDF(dateVenteEstimee) + '</strong>';
                html += '</div>';
                
                // Note de recalibrage si applicable
                if (pauseRecalibragePDF > 0) {
                    html += '<div style="text-align:center;margin-top:8px;padding:8px 12px;background:#fef3c7;border-radius:4px;font-size:8px;color:#92400e;">';
                    html += '' + ico('refresh', 12, '#92400e') + ' <strong>Phase de recalibrage marchÃ© (' + pauseRecalibragePDF + ' sem.)</strong> â€” Le bien ayant dÃ©jÃ  Ã©tÃ© exposÃ©, cette pÃ©riode permet au marchÃ© de se renouveler et de repartir avec un positionnement optimal.';
                    html += '</div>';
                }
                
                html += '</div>'; // fin padding
                
                // === B. PASSAGE ENTRE PHASES (si projet d'achat dÃ©tectÃ©) ===
                if (hasProjetAchatPDF && niveauContraintePDF > 0) {
                    html += '<div style="padding:10px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
                    html += '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-left:3px solid #0284c7;border-radius:6px;padding:10px 14px;">';
                    html += '<div style="font-size:8px;color:#0369a1;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:600;display:flex;align-items:center;gap:5px;">' + ico('refresh', 10, '#0284c7') + 'Passage entre phases</div>';
                    html += '<div style="font-size:9px;color:#1e40af;line-height:1.5;margin-bottom:6px;font-weight:500;">Chaque transition s\'active lorsque deux conditions sont rÃ©unies :</div>';
                    html += '<div style="display:flex;gap:12px;">';
                    html += '<div style="display:flex;align-items:center;gap:4px;font-size:8px;color:#475569;">' + ico('trendingUp', 10, '#0284c7') + 'Signaux marchÃ© suffisants</div>';
                    html += '<div style="display:flex;align-items:center;gap:4px;font-size:8px;color:#475569;">' + ico('checkCircle', 10, '#0284c7') + 'Contexte favorable</div>';
                    html += '</div>';
                    html += '<div style="font-size:8px;color:#64748b;font-style:italic;margin-top:6px;">Le rythme reste pilotÃ©, jamais subi.</div>';
                    html += '</div></div>';
                }
                
                // DÃ©terminer le statut de chaque trajectoire (adaptÃ© luxMode + bien dÃ©jÃ  exposÃ©)
                var getStatut = function(trajId) {
                    // Cas bien dÃ©jÃ  exposÃ© + luxMode : logique spÃ©ciale
                    if (luxMode && historique.dejaDiffuse) {
                        if (trajId === 'offmarket') return {label: 'Conditionnel', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
                        if (trajId === 'comingsoon' || trajId === typeMV) return {label: 'Point de dÃ©part stratÃ©gique', style: 'background:#1a2e35;color:white;'};
                        if (trajId === 'public') return {label: 'Activable', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
                    }
                    // Cas standard
                    if (trajId === typeMV) return {label: 'Point de dÃ©part stratÃ©gique', style: 'background:#1a2e35;color:white;'};
                    if (trajId === 'public' && typeMV === 'offmarket') return {label: 'Conditionnel', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
                    return {label: 'Activable', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
                };
                
                html += '<div style="padding:12px 24px;background:#f8fafc;">';
                html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;display:flex;align-items:center;gap:5px;">' + ico('compass', 12, '#9ca3af') + (luxMode ? 'Choisissez votre scÃ©nario' : 'Choisissez votre point de dÃ©part') + '</div>';
                
                // === A. PHRASE POINT DE DÃ‰PART STRATÃ‰GIQUE (si projet d'achat dÃ©tectÃ©) ===
                if (hasProjetAchatPDF && niveauContraintePDF > 0) {
                    var phrasePointDepart = '';
                    if (niveauContraintePDF >= 4) {
                        phrasePointDepart = 'La trajectoire recommandÃ©e privilÃ©gie la maÃ®trise du calendrier avant toute intensification de l\'exposition.';
                    } else if (niveauContraintePDF >= 2) {
                        phrasePointDepart = 'La sÃ©quence proposÃ©e prÃ©serve une marge d\'ajustement temporelle en dÃ©but de commercialisation.';
                    } else {
                        phrasePointDepart = 'Cette approche vous laisse le temps d\'observer les premiers signaux avant d\'Ã©largir la diffusion.';
                    }
                    html += '<div style="font-size:8px;color:#64748b;font-style:italic;text-align:center;margin-bottom:10px;line-height:1.4;">' + phrasePointDepart + '</div>';
                }
                
                html += '<div style="display:flex;gap:10px;">';
                
                trajectoires.forEach(function(traj) {
                    var statut = getStatut(traj.id);
                    var isPointDepart = statut.label === 'Point de dÃ©part stratÃ©gique';
                    var objectifValeur = Math.round(totalVenaleArrondi * (1 + traj.pourc / 100) / 5000) * 5000;
                    
                    html += '<div style="flex:1;background:white;border-radius:6px;border:' + (isPointDepart ? '2px solid #1a2e35' : '1px solid #e5e7eb') + ';overflow:hidden;">';
                    
                    // Header trajectoire - compact
                    html += '<div style="padding:10px;text-align:center;background:' + (isPointDepart ? '#1a2e35' : '#f9fafb') + ';border-bottom:1px solid #e5e7eb;">';
                    html += '<div style="margin-bottom:4px;">' + ico(traj.icon, 18, isPointDepart ? 'rgba(255,255,255,0.8)' : '#9ca3af') + '</div>';
                    html += '<div style="font-size:11px;font-weight:600;color:' + (isPointDepart ? 'white' : '#1a2e35') + ';">' + traj.nom + '</div>';
                    html += '<div style="margin-top:4px;display:inline-block;padding:2px 6px;border-radius:3px;font-size:7px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;' + statut.style + '">' + statut.label + '</div>';
                    html += '</div>';
                    
                    if (luxMode) {
                        // MODE LUXE : 5 lignes structurÃ©es - compact
                        // 1. Intention
                        html += '<div style="padding:6px 10px;background:white;border-bottom:1px solid #f3f4f6;">';
                        html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Intention</div>';
                        html += '<div style="font-size:8px;color:#4b5563;line-height:1.3;">' + (traj.objectifLux || traj.objectif) + '</div>';
                        html += '</div>';
                        
                        // 2. Type d'exposition
                        html += '<div style="padding:6px 10px;background:#fafafa;border-bottom:1px solid #f3f4f6;">';
                        html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Exposition</div>';
                        html += '<div style="font-size:8px;color:#4b5563;">' + traj.typeExposition + '</div>';
                        html += '</div>';
                        
                        // 3. Type de pression (pression inversÃ©e)
                        html += '<div style="padding:6px 10px;background:white;border-bottom:1px solid #f3f4f6;">';
                        html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Pression</div>';
                        html += '<div style="font-size:8px;color:#4b5563;font-style:italic;">' + traj.typePression + '</div>';
                        html += '</div>';
                        
                        // 4. Prise en charge GARY
                        html += '<div style="padding:6px 10px;background:#fafafa;border-bottom:1px solid #f3f4f6;">';
                        html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">GARY pilote</div>';
                        html += '<div style="font-size:8px;color:#4b5563;line-height:1.3;">' + traj.priseEnCharge + '</div>';
                        html += '</div>';
                        
                        // 5. Objectif de valeur + condition
                        html += '<div style="padding:8px 10px;background:white;text-align:center;">';
                        html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;font-weight:600;">Objectif de valeur</div>';
                        html += '<div style="font-size:14px;font-weight:400;color:' + (isPointDepart ? '#FF4539' : '#1a2e35') + ';">' + formatPrice(objectifValeur) + '</div>';
                        html += '<div style="font-size:6px;color:#9ca3af;margin-top:2px;line-height:1.2;">Atteignable si conditions respectÃ©es</div>';
                        html += '</div>';
                    } else {
                        // MODE STANDARD
                        // Objectif
                        html += '<div style="padding:10px 12px;background:white;border-bottom:1px solid #f3f4f6;">';
                        html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;margin-bottom:3px;font-weight:600;">Objectif</div>';
                        html += '<div style="font-size:9px;color:#4b5563;line-height:1.4;">' + traj.objectif + '</div>';
                        html += '</div>';
                        
                        // Conditions
                        html += '<div style="padding:10px 12px;background:#fafafa;border-bottom:1px solid #f3f4f6;">';
                        html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;margin-bottom:4px;font-weight:600;">Conditions</div>';
                        traj.conditions.forEach(function(c) {
                            html += '<div style="font-size:9px;color:#4b5563;padding:2px 0;display:flex;align-items:center;gap:4px;">' + ico('check', 10, '#9ca3af') + c + '</div>';
                        });
                        html += '</div>';
                        
                        // Objectif de valeur
                        html += '<div style="padding:12px;background:white;text-align:center;">';
                        html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;margin-bottom:4px;font-weight:600;">Objectif de valeur</div>';
                        html += '<div style="font-size:16px;font-weight:400;color:' + (isPointDepart ? '#FF4539' : '#1a2e35') + ';">' + formatPrice(objectifValeur) + '</div>';
                        html += '<div style="font-size:8px;color:#9ca3af;margin-top:2px;">VÃ©nale +' + traj.pourc + '%</div>';
                        html += '</div>';
                    }
                    
                    html += '</div>';
                });
                
                html += '</div></div>';
                
                // Capital-VisibilitÃ© (adaptÃ© luxMode) - compact
                var capColor = capitalPct >= 70 ? '#1a2e35' : (capitalPct >= 50 ? '#64748b' : '#94a3b8');
                var capDesc = capitalPct >= 70 ? 'Potentiel intact - Toutes les options sont ouvertes' : (capitalPct >= 50 ? 'Potentiel modÃ©rÃ© - StratÃ©gie ciblÃ©e recommandÃ©e' : 'Capital entamÃ© - Approche sÃ©lective nÃ©cessaire');
                html += '<div style="padding:10px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
                html += '<div style="display:flex;align-items:center;gap:12px;">';
                html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('eye', 14, '#9ca3af') + '<span style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:600;">' + copy.capitalLabel + '</span></div>';
                html += '<div style="flex:1;height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="width:' + capitalPct + '%;height:100%;background:' + capColor + ';border-radius:3px;"></div></div>';
                html += '<div style="font-size:11px;font-weight:500;color:' + capColor + ';">' + capitalPct + '%</div>';
                if (historique.dejaDiffuse) {
                    html += '<div style="display:flex;align-items:center;gap:3px;padding:3px 6px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;">' + ico('alertCircle', 10, '#6b7280') + '<span style="font-size:7px;color:#6b7280;">DÃ©jÃ  diffusÃ©</span></div>';
                }
                html += '</div></div>';
                
                // Alertes si bien dÃ©jÃ  diffusÃ© (adaptÃ© luxMode) - compact
                if (capitalAlerts.length > 0 || (luxMode && historique.dejaDiffuse)) {
                    html += '<div style="padding:10px 24px;background:white;border-top:1px solid #e5e7eb;">';
                    html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:6px;">' + ico('alertCircle', 12, '#9ca3af') + copy.recalibrageTitle + '</div>';
                    // Phrase spÃ©cifique luxMode bien dÃ©jÃ  exposÃ©
                    if (luxMode && historique.dejaDiffuse && copy.recalibragePhrase) {
                        html += '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin-bottom:6px;">';
                        html += '<span style="font-size:9px;color:#4b5563;line-height:1.4;font-style:italic;">' + copy.recalibragePhrase + '</span>';
                        html += '</div>';
                    }
                    capitalAlerts.forEach(function(alert) {
                        var alertIco = alert.type === 'critical' ? 'xCircle' : (alert.type === 'warning' ? 'alertCircle' : 'circle');
                        html += '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:6px 10px;margin-bottom:4px;display:flex;align-items:center;gap:6px;">';
                        html += ico(alertIco, 12, '#6b7280');
                        html += '<span style="font-size:9px;color:#4b5563;line-height:1.3;">' + alert.msg + '</span>';
                        html += '</div>';
                    });
                    html += '</div>';
                }
                
                // Bloc "Valeur Ã  prÃ©server" (luxMode uniquement) - compact
                if (luxMode) {
                    html += '<div style="padding:10px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;">';
                    html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;">';
                    html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:6px;">' + ico('shield', 12, '#9ca3af') + 'Valeur Ã  prÃ©server</div>';
                    var valeurItems = [
                        {icon: 'star', text: 'Image du bien'},
                        {icon: 'lock', text: 'DiscrÃ©tion et maÃ®trise de l\'information'},
                        {icon: 'users', text: 'SÃ©lectivitÃ© des visites'},
                        {icon: 'edit', text: 'CohÃ©rence du rÃ©cit'}
                    ];
                    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">';
                    valeurItems.forEach(function(item) {
                        html += '<div style="display:flex;align-items:center;gap:5px;padding:4px 8px;background:#f9fafb;border-radius:4px;">';
                        html += ico(item.icon, 10, '#9ca3af');
                        html += '<span style="font-size:8px;color:#4b5563;">' + item.text + '</span>';
                        html += '</div>';
                    });
                    html += '</div>';
                    html += '<div style="font-size:8px;color:#6b7280;font-style:italic;text-align:center;line-height:1.3;">Dans ce segment, la stratÃ©gie protÃ¨ge autant la valeur que la confidentialitÃ©.</div>';
                    html += '</div></div>';
                }
                
                // Disclaimer (adaptÃ© luxMode) - compact
                html += '<div style="padding:10px 24px;background:#f8fafc;">';
                html += '<div style="background:white;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px;">';
                html += ico('info', 14, '#9ca3af');
                html += '<div style="font-size:8px;color:#6b7280;line-height:1.4;font-style:italic;">' + copy.disclaimerPhrase + '</div>';
                html += '</div></div>';
                
                // === C. CADRE DE PILOTAGE (si projet d'achat dÃ©tectÃ©) ===
                if (hasProjetAchatPDF && niveauContraintePDF > 0) {
                    html += '<div style="padding:8px 24px;background:#f8fafc;">';
                    html += '<div style="background:#f8fafc;border-left:3px solid #FF4539;border-radius:4px;padding:10px 14px;">';
                    html += '<div style="font-size:8px;color:#FF4539;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-weight:600;">Cadre de pilotage</div>';
                    html += '<div style="font-size:8px;color:#4b5563;line-height:1.5;">La stratÃ©gie proposÃ©e est conÃ§ue pour rester <strong>rÃ©versible et ajustable</strong> dans le temps. Elle s\'adapte Ã  l\'Ã©volution du marchÃ© et de votre situation personnelle, sans jamais exposer vos contraintes.</div>';
                    html += '</div></div>';
                }
                
                // Footer page 2
                html += '<div class="footer">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                html += '<div class="footer-ref">Page 2/' + totalPages + ' â€¢ ' + copy.pageTitle + '</div>';
                html += '<div class="footer-slogan">On pilote, vous dÃ©cidez.</div>';
                html += '</div>';
                
                html += '</div>'; // page 2
                // ==================== PAGE 3 : PLAN D'ACTION & SIGNATURE ====================
                html += '<div class="page" style="page-break-before:always;">';
                
                // Header
                html += '<div class="header">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
                html += '<div class="header-date">Plan d\'action</div>';
                html += '</div>';
                
                // Section Pilotage coordonnÃ© vs Pilotage partagÃ© - design Ã©purÃ©
                html += '<div style="padding:20px 24px;background:white;">';
                html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;font-weight:600;text-align:center;">Vous restez dÃ©cideur, on s\'occupe du reste</div>';
                
                html += '<div style="display:flex;gap:16px;">';
                
                // Bloc Pilotage coordonnÃ© (gauche - recommandÃ©)
                html += '<div style="flex:1;border:1px solid #1a2e35;border-radius:8px;overflow:hidden;position:relative;">';
                html += '<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);background:#1a2e35;color:white;font-size:8px;font-weight:600;padding:3px 10px;border-radius:0 0 4px 4px;text-transform:uppercase;letter-spacing:0.5px;">RecommandÃ©</div>';
                html += '<div style="padding:20px 16px 12px;text-align:center;background:#f9fafb;">';
                html += '<div style="margin:0 auto 8px;">' + ico('checkCircle', 28, '#1a2e35') + '</div>';
                html += '<div style="font-size:13px;font-weight:600;color:#1a2e35;">GARY s\'occupe de tout</div>';
                html += '<div style="font-size:9px;color:#6b7280;margin-top:2px;">Pilotage coordonnÃ©</div>';
                html += '</div>';
                html += '<div style="padding:12px 16px;background:white;">';
                // Avantages coordonnÃ©
                var avantagesCoord = [
                    'Ajustements <strong>immÃ©diats</strong>',
                    'Message <strong>cohÃ©rent</strong> partout',
                    'SÃ©quence <strong>maÃ®trisÃ©e</strong>',
                    'RÃ©activitÃ© <strong>en temps rÃ©el</strong>',
                    'Repartir Ã  zÃ©ro <strong>possible</strong>'
                ];
                avantagesCoord.forEach(function(a) {
                    html += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f3f4f6;">';
                    html += ico('check', 12, '#1a2e35');
                    html += '<span style="font-size:10px;color:#1a2e35;">' + a + '</span>';
                    html += '</div>';
                });
                html += '</div></div>';
                
                // Bloc Pilotage partagÃ© (droite - moins mis en avant)
                html += '<div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;opacity:0.75;">';
                html += '<div style="padding:20px 16px 12px;text-align:center;background:#fafafa;">';
                html += '<div style="margin:0 auto 8px;">' + ico('share', 28, '#9ca3af') + '</div>';
                html += '<div style="font-size:13px;font-weight:600;color:#6b7280;">Pilotage partagÃ©</div>';
                html += '<div style="font-size:9px;color:#9ca3af;margin-top:2px;">Plusieurs intervenants</div>';
                html += '</div>';
                html += '<div style="padding:12px 16px;background:white;">';
                // Points partagÃ©
                var pointsPartage = [
                    {ok: true, text: 'Coordination <strong>plus longue</strong>'},
                    {ok: true, text: 'Messages <strong>parfois diffÃ©rents</strong>'},
                    {ok: true, text: 'SÃ©quence <strong>moins prÃ©visible</strong>'},
                    {ok: true, text: 'Ajustements <strong>plus lents</strong>'},
                    {ok: false, text: 'Repartir Ã  zÃ©ro <strong>difficile</strong>'}
                ];
                pointsPartage.forEach(function(p) {
                    html += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f3f4f6;">';
                    html += ico(p.ok ? 'circle' : 'x', 12, '#9ca3af');
                    html += '<span style="font-size:10px;color:#6b7280;">' + p.text + '</span>';
                    html += '</div>';
                });
                html += '</div></div>';
                
                html += '</div>'; // fin flex
                
                // Phrase dynamique selon contexte
                var phraseMandat = '';
                if (!historique.dejaDiffuse) {
                    phraseMandat = 'Pour votre situation : le pilotage coordonnÃ© vous permet de <strong>maximiser vos chances dÃ¨s le dÃ©part</strong> avec une stratÃ©gie cohÃ©rente.';
                } else if (capitalPct > 40) {
                    phraseMandat = 'Pour votre situation : le pilotage coordonnÃ© vous permet de <strong>corriger le tir efficacement</strong> et de relancer avec une approche maÃ®trisÃ©e.';
                } else {
                    phraseMandat = 'Pour votre situation : le pilotage coordonnÃ© vous permet de <strong>repartir proprement</strong>, sans hÃ©riter des erreurs passÃ©es.';
                }
                html += '<div style="margin-top:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;text-align:center;">';
                html += '<span style="font-size:10px;color:#4b5563;line-height:1.5;">' + phraseMandat + '</span>';
                html += '</div>';
                
                // LÃ©gende
                html += '<div style="margin-top:10px;display:flex;justify-content:center;gap:20px;">';
                html += '<div style="display:flex;align-items:center;gap:5px;">' + ico('check', 10, '#1a2e35') + '<span style="font-size:8px;color:#6b7280;">Optimal</span></div>';
                html += '<div style="display:flex;align-items:center;gap:5px;">' + ico('circle', 10, '#9ca3af') + '<span style="font-size:8px;color:#6b7280;">Possible</span></div>';
                html += '<div style="display:flex;align-items:center;gap:5px;">' + ico('x', 10, '#9ca3af') + '<span style="font-size:8px;color:#6b7280;">Difficile</span></div>';
                html += '</div>';
                
                html += '</div>'; // fin section pilotage
                
                // Plan d'action (compact) - design Ã©purÃ©
                html += '<div style="padding:16px 24px;background:#f8fafc;">';
                html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;display:flex;align-items:center;gap:6px;">' + ico('list', 14, '#9ca3af') + 'Prochaines Ã©tapes</div>';
                html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
                etapes.forEach(function(e, i) {
                    html += '<div style="display:flex;align-items:center;gap:10px;background:white;border-radius:6px;padding:10px;border:1px solid #e5e7eb;">';
                    html += '<div style="width:24px;height:24px;background:#1a2e35;border-radius:50%;color:white;font-size:11px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + (i + 1) + '</div>';
                    html += '<div style="font-size:9px;color:#4b5563;line-height:1.3;font-weight:500;">' + e.label + '</div>';
                    html += '</div>';
                });
                html += '</div></div>';
                
                // Notes si prÃ©sentes - design Ã©purÃ©
                if (analyse.notesLibres || strat.notesStrategie) {
                    html += '<div style="margin:0 24px 12px;background:#f9fafb;border:1px solid #e5e7eb;padding:12px 16px;border-radius:6px;">';
                    html += '<div style="font-size:9px;font-weight:600;color:#6b7280;margin-bottom:6px;display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:0.5px;">' + ico('edit', 12, '#9ca3af') + 'Notes</div>';
                    html += '<div style="font-size:10px;color:#4b5563;line-height:1.5;">';
                    if (analyse.notesLibres) html += analyse.notesLibres;
                    if (analyse.notesLibres && strat.notesStrategie) html += '<br><br>';
                    if (strat.notesStrategie) html += strat.notesStrategie;
                    html += '</div></div>';
                }
                
                // Section Signature - design Ã©purÃ©
                var courtierData = COURTIERS.find(function(c) { return c.id === identification.courtier; });
                var courtierNom = courtierData ? courtierData.nom : 'Votre courtier GARY';
                var courtierInitiales = courtierData ? courtierData.initiales : 'GA';
                var courtierEmail = courtierData ? courtierData.email : 'contact@gary.ch';
                
                html += '<div style="margin:12px 24px;padding:16px;background:white;border-radius:8px;border:1px solid #e5e7eb;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">';
                html += '<div style="display:flex;align-items:center;gap:12px;">';
                html += '<div style="width:40px;height:40px;border-radius:50%;background:#1a2e35;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:500;">' + courtierInitiales + '</div>';
                html += '<div>';
                html += '<div style="font-size:13px;font-weight:600;color:#1a2e35;">' + courtierNom + '</div>';
                html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Conseiller immobilier GARY</div>';
                html += '</div></div>';
                html += '<div style="text-align:right;">';
                html += '<div style="font-size:10px;color:#1a2e35;font-weight:500;">Fait Ã  GenÃ¨ve</div>';
                html += '<div style="font-size:9px;color:#6b7280;">Le ' + dateStr + '</div>';
                html += '</div></div>';
                
                // CoordonnÃ©es et signature sur une ligne
                html += '<div style="display:flex;gap:20px;align-items:flex-end;">';
                html += '<div style="flex:1;background:#f9fafb;border-radius:6px;padding:10px;">';
                html += '<div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;">';
                html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('phone', 14, '#9ca3af') + '<span style="font-size:10px;color:#4b5563;font-weight:500;">' + GARY_TEL + '</span></div>';
                html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('mail', 14, '#9ca3af') + '<span style="font-size:10px;color:#4b5563;font-weight:500;">' + courtierEmail + '</span></div>';
                html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('globe', 14, '#9ca3af') + '<span style="font-size:10px;color:#4b5563;font-weight:500;">gary.ch</span></div>';
                html += '</div></div>';
                html += '<div style="width:160px;">';
                html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600;">Signature</div>';
                html += '<div style="border-bottom:1px solid #1a2e35;height:36px;"></div>';
                html += '</div>';
                html += '</div></div>';
                
                // Footer page 4
                html += '<div class="footer">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                html += '<div class="footer-ref">Page 3/' + totalPages + ' â€¢ ' + dateStr + ' â€¢ ' + heureStr + '</div>';
                html += '<div class="footer-slogan">On pilote, vous dÃ©cidez.</div>';
                html += '</div>';
                
                html += '</div>'; // page 3
                
                // ==================== PAGE 4 : ANNEXE - MÃ‰THODOLOGIE D'ESTIMATION ====================
                html += '<div class="page" style="page-break-before:always;">';
                
                // Header
                html += '<div class="header">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
                html += '<div class="header-date">Annexe : MÃ©thodologie</div>';
                html += '</div>';
                
                // Fourchette de nÃ©gociation
                html += '<div style="background:#f8fafc;padding:12px 30px;display:flex;justify-content:center;align-items:center;gap:30px;border-bottom:1px solid #e5e7eb;">';
                html += '<div style="display:flex;align-items:center;gap:8px;">';
                html += '<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Fourchette</span>';
                html += '<span style="font-size:16px;font-weight:300;color:#1a2e35;">' + formatPrice(prixEntre) + '</span>';
                html += '<span style="color:#d1d5db;font-size:14px;">â†’</span>';
                html += '<span style="font-size:16px;font-weight:300;color:#1a2e35;">' + formatPrice(prixEt) + '</span>';
                html += '</div>';
                html += '</div>';
                
                // Les 3 valeurs - Grille compacte
                html += '<div style="padding:16px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
                html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">';
                
                // Valeur VÃ©nale
                html += '<div style="background:#f9fafb;border-radius:6px;padding:14px;border:1px solid #e5e7eb;text-align:center;">';
                html += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">' + ico('target', 14, '#9ca3af') + '<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">VÃ©nale</span></div>';
                html += '<div style="font-size:18px;font-weight:400;color:#1a2e35;">' + formatPrice(totalVenaleArrondi) + '</div>';
                html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">Base de calcul</div>';
                html += '</div>';
                
                // Valeur Rendement
                html += '<div style="background:#f9fafb;border-radius:6px;padding:14px;border:1px solid #e5e7eb;text-align:center;">';
                html += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">' + ico('trendingUp', 14, '#9ca3af') + '<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Rendement</span></div>';
                html += '<div style="font-size:18px;font-weight:400;color:#1a2e35;">' + formatPrice(valeurRendement) + '</div>';
                html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">Taux ' + (pre.tauxCapitalisation || 2.5).toFixed(1) + '% â€¢ ' + formatPrice(loyerMensuel) + '/mois</div>';
                html += '</div>';
                
                // Valeur de Gage
                html += '<div style="background:#f9fafb;border-radius:6px;padding:14px;border:1px solid #e5e7eb;text-align:center;">';
                html += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;">' + ico('lock', 14, '#9ca3af') + '<span style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Gage</span></div>';
                html += '<div style="font-size:18px;font-weight:400;color:#1a2e35;">' + formatPrice(valeurGageArrondi) + '</div>';
                html += '<div style="font-size:9px;color:#9ca3af;margin-top:4px;">RÃ©f. bancaire</div>';
                html += '</div>';
                
                html += '</div></div>';
                
                // DÃ©tail du calcul - Tableau compact
                html += '<div style="padding:12px 24px;background:#f8fafc;">';
                html += '<div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;">DÃ©tail du calcul</div>';
                html += '<div style="background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.04);">';
                html += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
                html += '<tr style="background:linear-gradient(135deg,#1a2e35 0%,#2c3e50 100%);color:white;">';
                html += '<th style="padding:10px 14px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Ã‰lÃ©ment</th>';
                html += '<th style="padding:10px 14px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">QuantitÃ©</th>';
                html += '<th style="padding:10px 14px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Prix unitaire</th>';
                html += '<th style="padding:10px 14px;text-align:right;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Montant</th>';
                html += '</tr>';
                
                if (isAppartement) {
                    html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Surface pondÃ©rÃ©e</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + surfacePonderee.toFixed(1) + ' mÂ²</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + formatPrice(prixM2) + '</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(valeurSurface) + '</td></tr>';
                    if (nbPlaceInt) html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Places intÃ©rieures</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + nbPlaceInt + '</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + formatPrice(prixPlaceInt) + '</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(valeurPlaceInt) + '</td></tr>';
                    if (nbPlaceExt) html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Places extÃ©rieures</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + nbPlaceExt + '</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + formatPrice(prixPlaceExt) + '</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(valeurPlaceExt) + '</td></tr>';
                    if (nbBox) html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Box fermÃ©</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + nbBox + '</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + formatPrice(prixBox) + '</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(valeurBox) + '</td></tr>';
                    if (hasCave) html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Cave</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">1</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + formatPrice(prixCave) + '</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(valeurCave) + '</td></tr>';
                    var lignesSuppList = pre.lignesSupp || [];
                    lignesSuppList.forEach(function(l) {
                        if (l.libelle && l.prix) {
                            html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">' + l.libelle + '</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">â€”</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">â€”</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(parseFloat(l.prix)) + '</td></tr>';
                        }
                    });
                } else {
                    html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Terrain</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + surfaceTerrain.toFixed(0) + ' mÂ²</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + formatPrice(prixM2Terrain) + '</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(valeurTerrain) + '</td></tr>';
                    html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">Cubage construction</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + cubage.toFixed(0) + ' mÂ³</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + formatPrice(prixM3) + '</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(valeurCubage) + '</td></tr>';
                    html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">AmÃ©nagements ext.</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + surfaceAmenagement.toFixed(0) + ' mÂ²</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">' + formatPrice(prixM2Amenagement) + '</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(valeurAmenagement) + '</td></tr>';
                    var annexesList = pre.annexes || [];
                    annexesList.forEach(function(a) {
                        if (a.libelle && a.prix) {
                            html += '<tr><td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;">' + a.libelle + '</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">â€”</td><td style="padding:10px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">â€”</td><td style="padding:10px 16px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:600;">' + formatPrice(parseFloat(a.prix)) + '</td></tr>';
                        }
                    });
                }
                html += '<tr style="background:#1a2e35;color:white;"><td colspan="3" style="padding:12px 14px;font-weight:600;font-size:11px;letter-spacing:0.5px;">VALEUR VÃ‰NALE TOTALE</td><td style="padding:12px 14px;text-align:right;font-weight:600;font-size:14px;color:#FF4539;">' + formatPrice(totalVenaleArrondi) + '</td></tr>';
                html += '</table></div></div>';
                
                // === SECTION COMPARABLES MARCHÃ‰ ===
                var comparablesVendus = pre.comparablesVendus || [];
                var comparablesEnVente = pre.comparablesEnVente || [];
                var hasComparables = comparablesVendus.length > 0 || comparablesEnVente.length > 0;
                
                if (hasComparables) {
                    html += '<div style="padding:16px 24px;background:white;">';
                    html += '<div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:600;display:flex;align-items:center;gap:5px;">' + ico('trendingUp', 12, '#9ca3af') + 'Positionnement marchÃ©</div>';
                    
                    // Collecter tous les prix pour l'Ã©chelle
                    var allPrices = [];
                    var prixEstimation = totalVenaleArrondi;
                    allPrices.push({ prix: prixEstimation, type: 'estimation' });
                    
                    comparablesVendus.forEach(function(c) {
                        var p = parseFloat((c.prix || '').replace(/[^\d]/g, ''));
                        if (p > 0) allPrices.push({ prix: p, type: 'vendu', data: c });
                    });
                    comparablesEnVente.forEach(function(c) {
                        var p = parseFloat((c.prix || '').replace(/[^\d]/g, ''));
                        if (p > 0) allPrices.push({ prix: p, type: 'envente', data: c });
                    });
                    
                    // Trier par prix
                    allPrices.sort(function(a, b) { return a.prix - b.prix; });
                    
                    // Ã‰chelle visuelle - mode adaptatif
                    if (allPrices.length > 1) {
                        var minPrix = allPrices[0].prix;
                        var maxPrix = allPrices[allPrices.length - 1].prix;
                        var range = maxPrix - minPrix || 1;
                        
                        html += '<div style="background:#f8fafc;border-radius:6px;padding:10px 12px;margin-bottom:8px;">';
                        
                        // Mode heatmap si >7 comparables au total
                        if (totalComparables > 7) {
                            // Afficher prix min/max rÃ©els
                            html += '<div style="display:flex;justify-content:space-between;font-size:7px;color:#6b7280;margin-bottom:6px;">';
                            html += '<span>' + (minPrix / 1000000).toFixed(2) + 'M</span><span>' + (maxPrix / 1000000).toFixed(2) + 'M</span>';
                            html += '</div>';
                            
                            // CrÃ©er 10 buckets
                            var buckets = [];
                            for (var b = 0; b < 10; b++) {
                                buckets.push({ vendus: 0, envente: 0, total: 0 });
                            }
                            var bucketSize = range / 10;
                            
                            // Remplir les buckets (sans l'estimation)
                            allPrices.forEach(function(item) {
                                if (item.type === 'estimation') return;
                                var bucketIdx = Math.min(9, Math.floor((item.prix - minPrix) / bucketSize));
                                buckets[bucketIdx].total++;
                                if (item.type === 'vendu') buckets[bucketIdx].vendus++;
                                else buckets[bucketIdx].envente++;
                            });
                            
                            var maxVendus = Math.max.apply(null, buckets.map(function(b) { return b.vendus; })) || 1;
                            var maxEnVente = Math.max.apply(null, buckets.map(function(b) { return b.envente; })) || 1;
                            
                            // Position estimation
                            var estPos = ((prixEstimation - minPrix) / range) * 100;
                            
                            // Container des deux barres avec l'Ã©toile au milieu
                            html += '<div style="position:relative;">';
                            
                            // Barre vendus (verte) - en haut
                            html += '<div style="display:flex;gap:2px;margin-bottom:2px;">';
                            buckets.forEach(function(bucket) {
                                var intensity = bucket.vendus / maxVendus;
                                var bgColor = bucket.vendus === 0 ? '#f0fdf4' : 'rgba(16,185,129,' + (0.2 + intensity * 0.6) + ')';
                                html += '<div style="flex:1;height:18px;background:' + bgColor + ';border-radius:3px;display:flex;align-items:center;justify-content:center;">';
                                if (bucket.vendus > 0) {
                                    html += '<span style="font-size:7px;color:#065f46;font-weight:600;">' + bucket.vendus + '</span>';
                                }
                                html += '</div>';
                            });
                            html += '</div>';
                            
                            // Barre en vente (grise) - en bas
                            html += '<div style="display:flex;gap:2px;">';
                            buckets.forEach(function(bucket) {
                                var intensity = bucket.envente / maxEnVente;
                                var bgColor = bucket.envente === 0 ? '#f9fafb' : 'rgba(107,114,128,' + (0.15 + intensity * 0.5) + ')';
                                html += '<div style="flex:1;height:18px;background:' + bgColor + ';border-radius:3px;display:flex;align-items:center;justify-content:center;">';
                                if (bucket.envente > 0) {
                                    html += '<span style="font-size:7px;color:#374151;font-weight:600;">' + bucket.envente + '</span>';
                                }
                                html += '</div>';
                            });
                            html += '</div>';
                            
                            // Ã‰toile estimation positionnÃ©e au milieu entre les deux barres
                            html += '<div style="position:absolute;left:' + estPos + '%;top:50%;transform:translate(-50%,-50%);z-index:10;">';
                            html += '<div style="width:22px;height:22px;background:#FA4238;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.2);">';
                            html += '<span style="color:white;font-size:11px;">â˜…</span>';
                            html += '</div>';
                            html += '</div>';
                            
                            html += '</div>'; // fin container
                            
                            // LÃ©gende
                            html += '<div style="display:flex;justify-content:center;gap:12px;font-size:7px;margin-top:6px;">';
                            html += '<span style="color:#10b981;">âœ“ Vendus</span>';
                            html += '<span style="color:#6b7280;">â—‹ En vente</span>';
                            html += '<span style="color:#FA4238;">â˜… Votre bien</span>';
                            html += '</div>';
                        } else {
                            // Mode points standard (â‰¤7 comparables)
                            html += '<div style="display:flex;justify-content:space-between;font-size:7px;color:#6b7280;margin-bottom:6px;">';
                            html += '<span>Prix bas</span><span>Prix haut</span>';
                            html += '</div>';
                            
                            html += '<div style="position:relative;height:36px;background:linear-gradient(90deg,#e5e7eb 0%,#f3f4f6 100%);border-radius:12px;margin-bottom:6px;">';
                            
                            allPrices.forEach(function(item) {
                                var pos = ((item.prix - minPrix) / range) * 85 + 7;
                                var color = item.type === 'estimation' ? '#FF4539' : (item.type === 'vendu' ? '#10b981' : '#6b7280');
                                var symbol = item.type === 'estimation' ? 'â˜…' : (item.type === 'vendu' ? 'âœ“' : 'â—‹');
                                var size = item.type === 'estimation' ? '12px' : '10px';
                                
                                html += '<div style="position:absolute;left:' + pos + '%;top:6px;transform:translateX(-50%);text-align:center;">';
                                html += '<div style="font-size:' + size + ';color:' + color + ';font-weight:bold;">' + symbol + '</div>';
                                html += '<div style="font-size:7px;color:' + color + ';margin-top:1px;white-space:nowrap;">' + (item.prix / 1000000).toFixed(2) + 'M</div>';
                                html += '</div>';
                            });
                            
                            html += '</div>';
                            
                            html += '<div style="display:flex;justify-content:center;gap:12px;font-size:7px;">';
                            html += '<span style="color:#10b981;">âœ“ Vendu</span>';
                            html += '<span style="color:#6b7280;">â—‹ En vente</span>';
                            html += '<span style="color:#FF4539;">â˜… Votre bien</span>';
                            html += '</div>';
                        }
                        html += '</div>';
                    }
                    
                    // Fonction pour formater le prix des comparables
                    var formatComparablePrix = function(prixStr) {
                        var p = parseFloat((prixStr || '').replace(/[^\d]/g, ''));
                        if (p > 0) return formatPrice(p);
                        return prixStr || '-';
                    };
                    
                    // DÃ©tails comparables OU message annexe
                    if (comparablesEnAnnexe) {
                        // Mode annexe - juste un message
                        html += '<div style="background:#f8fafc;border-radius:6px;padding:12px 16px;text-align:center;margin-top:8px;">';
                        html += '<div style="font-size:9px;color:#6b7280;">';
                        html += 'DÃ©tail des ' + totalComparables + ' comparables en annexe (page 5)';
                        html += '</div>';
                        html += '</div>';
                    } else {
                        // Mode normal - afficher les dÃ©tails
                        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
                        
                        // Colonne vendus
                        if (comparablesVendus.length > 0) {
                            html += '<div>';
                            html += '<div style="font-size:8px;font-weight:600;color:#10b981;margin-bottom:6px;display:flex;align-items:center;gap:3px;">âœ“ Transactions rÃ©centes</div>';
                            comparablesVendus.forEach(function(c) {
                                var garyBadge = c.isGary ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;background:#FA4238;color:white;border-radius:50%;font-size:8px;font-weight:700;margin-left:4px;">G</span>' : '';
                                var typeMaisonLabel = {'individuelle': 'Maison individuelle', 'jumelee': 'Maison jumelÃ©e', 'mitoyenne': 'Maison mitoyenne', 'contigue': 'Maison contiguÃ«'}[c.typeMaison] || '';
                                html += '<div style="background:' + (c.isGary ? '#fff5f4' : '#f0fdf4') + ';border-radius:4px;padding:6px 8px;margin-bottom:4px;border-left:2px solid ' + (c.isGary ? '#FA4238' : '#10b981') + ';">';
                                html += '<div style="font-size:8px;font-weight:600;color:#1a2e35;display:flex;align-items:center;">' + (c.adresse || '-') + garyBadge + '</div>';
                                html += '<div style="font-size:9px;color:' + (c.isGary ? '#FA4238' : '#10b981') + ';font-weight:600;">' + formatComparablePrix(c.prix) + '</div>';
                                var details = [];
                                if (c.surface) details.push(c.surface);
                                if (c.surfaceParcelle) details.push('Parcelle ' + c.surfaceParcelle);
                                if (typeMaisonLabel) details.push(typeMaisonLabel);
                                if (c.dateVente) details.push(c.dateVente);
                                if (c.commentaire) details.push(c.commentaire);
                                if (details.length > 0) {
                                    html += '<div style="font-size:7px;color:#6b7280;margin-top:1px;">' + details.join(' â€¢ ') + '</div>';
                                }
                                html += '</div>';
                            });
                            html += '</div>';
                        }
                        
                        // Colonne en vente
                        if (comparablesEnVente.length > 0) {
                            html += '<div>';
                            html += '<div style="font-size:8px;font-weight:600;color:#6b7280;margin-bottom:6px;display:flex;align-items:center;gap:3px;">â—‹ Actuellement en vente</div>';
                            comparablesEnVente.forEach(function(c) {
                                var garyBadge = c.isGary ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;background:#FA4238;color:white;border-radius:50%;font-size:8px;font-weight:700;margin-left:4px;">G</span>' : '';
                                var typeMaisonLabel = {'individuelle': 'Maison individuelle', 'jumelee': 'Maison jumelÃ©e', 'mitoyenne': 'Maison mitoyenne', 'contigue': 'Maison contiguÃ«'}[c.typeMaison] || '';
                                html += '<div style="background:' + (c.isGary ? '#fff5f4' : '#f9fafb') + ';border-radius:4px;padding:6px 8px;margin-bottom:4px;border-left:2px solid ' + (c.isGary ? '#FA4238' : '#9ca3af') + ';">';
                                html += '<div style="font-size:8px;font-weight:600;color:#1a2e35;display:flex;align-items:center;">' + (c.adresse || '-') + garyBadge + '</div>';
                                html += '<div style="font-size:9px;color:' + (c.isGary ? '#FA4238' : '#6b7280') + ';font-weight:600;">' + formatComparablePrix(c.prix) + '</div>';
                                var details = [];
                                if (c.surface) details.push(c.surface);
                                if (c.surfaceParcelle) details.push('Parcelle ' + c.surfaceParcelle);
                                if (typeMaisonLabel) details.push(typeMaisonLabel);
                                if (c.dureeEnVente) details.push('Depuis ' + c.dureeEnVente);
                                if (c.commentaire) details.push(c.commentaire);
                                if (details.length > 0) {
                                    html += '<div style="font-size:7px;color:#6b7280;margin-top:1px;">' + details.join(' â€¢ ') + '</div>';
                                }
                                html += '</div>';
                            });
                            html += '</div>';
                        }
                        
                        html += '</div>'; // grid
                    }
                    
                    // Positionnement du bien
                    html += '<div style="margin-top:8px;background:linear-gradient(135deg,#fff5f4 0%,#ffffff 100%);border:1px solid #FF4539;border-radius:6px;padding:8px 10px;text-align:center;">';
                    html += '<div style="font-size:7px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Votre bien</div>';
                    html += '<div style="font-size:9px;font-weight:600;color:#1a2e35;">' + val(bien.adresse) + '</div>';
                    html += '<div style="font-size:12px;font-weight:700;color:#FF4539;margin-top:2px;">' + formatPrice(totalVenaleArrondi) + '</div>';
                    html += '</div>';
                    
                    html += '</div>'; // section comparables
                }
                
                // Footer page 1
                html += '<div class="footer">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                html += '<div class="footer-ref">Page 4/' + totalPages + ' â€¢ RÃ©f: EST-' + dateNow.getTime().toString().slice(-8) + '</div>';
                html += '<div class="footer-slogan">On pilote, vous dÃ©cidez.</div>';
                html += '</div>';
                
                html += '</div>'; // page 4
                
                // ==================== PAGE 5 : ANNEXE COMPARABLES (conditionnelle) ====================
                var pageNumAnnexeTech1 = comparablesEnAnnexe ? 6 : 5;
                var pageNumAnnexeTech2 = comparablesEnAnnexe ? 7 : 6;
                
                if (comparablesEnAnnexe) {
                    html += '<div class="page" style="page-break-before:always;">';
                    
                    // Header
                    html += '<div class="header">';
                    html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
                    html += '<div class="header-date">Annexe Comparables</div>';
                    html += '</div>';
                    
                    html += '<div style="padding:16px 24px;">';
                    html += '<div style="font-size:12px;font-weight:700;color:#1a2e35;margin-bottom:16px;">DÃ©tail des ' + totalComparables + ' comparables de marchÃ©</div>';
                    
                    // Fonction pour formater le prix
                    var formatComparablePrixAnnexe = function(prixStr) {
                        var p = parseFloat((prixStr || '').replace(/[^\d]/g, ''));
                        if (p > 0) return formatPrice(p);
                        return prixStr || '-';
                    };
                    
                    // Section Vendus
                    if (comparablesVendus.length > 0) {
                        html += '<div style="margin-bottom:16px;">';
                        html += '<div style="font-size:10px;font-weight:600;color:#10b981;margin-bottom:8px;display:flex;align-items:center;gap:4px;">âœ“ Transactions rÃ©centes (' + comparablesVendus.length + ')</div>';
                        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
                        comparablesVendus.forEach(function(c) {
                            var garyBadge = c.isGary ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:12px;height:12px;background:#FA4238;color:white;border-radius:50%;font-size:7px;font-weight:700;margin-left:3px;">G</span>' : '';
                            var typeMaisonLabel = {'individuelle': 'Maison individuelle', 'jumelee': 'Maison jumelÃ©e', 'mitoyenne': 'Maison mitoyenne', 'contigue': 'Maison contiguÃ«'}[c.typeMaison] || '';
                            html += '<div style="background:' + (c.isGary ? '#fff5f4' : '#f0fdf4') + ';border-radius:4px;padding:5px 7px;border-left:2px solid ' + (c.isGary ? '#FA4238' : '#10b981') + ';">';
                            html += '<div style="font-size:7px;font-weight:600;color:#1a2e35;display:flex;align-items:center;">' + (c.adresse || '-') + garyBadge + '</div>';
                            html += '<div style="font-size:8px;color:' + (c.isGary ? '#FA4238' : '#10b981') + ';font-weight:600;">' + formatComparablePrixAnnexe(c.prix) + '</div>';
                            var details = [];
                            if (c.surface) details.push(c.surface);
                            if (c.surfaceParcelle) details.push('Parcelle ' + c.surfaceParcelle);
                            if (typeMaisonLabel) details.push(typeMaisonLabel);
                            if (c.dateVente) details.push(c.dateVente);
                            if (c.commentaire) details.push(c.commentaire);
                            if (details.length > 0) {
                                html += '<div style="font-size:6px;color:#6b7280;margin-top:1px;">' + details.join(' â€¢ ') + '</div>';
                            }
                            html += '</div>';
                        });
                        html += '</div>';
                        html += '</div>';
                    }
                    
                    // Section En vente
                    if (comparablesEnVente.length > 0) {
                        html += '<div style="margin-bottom:16px;">';
                        html += '<div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:8px;display:flex;align-items:center;gap:4px;">â—‹ Actuellement en vente (' + comparablesEnVente.length + ')</div>';
                        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
                        comparablesEnVente.forEach(function(c) {
                            var garyBadge = c.isGary ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:12px;height:12px;background:#FA4238;color:white;border-radius:50%;font-size:7px;font-weight:700;margin-left:3px;">G</span>' : '';
                            var typeMaisonLabel = {'individuelle': 'Maison individuelle', 'jumelee': 'Maison jumelÃ©e', 'mitoyenne': 'Maison mitoyenne', 'contigue': 'Maison contiguÃ«'}[c.typeMaison] || '';
                            html += '<div style="background:' + (c.isGary ? '#fff5f4' : '#f9fafb') + ';border-radius:4px;padding:5px 7px;border-left:2px solid ' + (c.isGary ? '#FA4238' : '#9ca3af') + ';">';
                            html += '<div style="font-size:7px;font-weight:600;color:#1a2e35;display:flex;align-items:center;">' + (c.adresse || '-') + garyBadge + '</div>';
                            html += '<div style="font-size:8px;color:' + (c.isGary ? '#FA4238' : '#6b7280') + ';font-weight:600;">' + formatComparablePrixAnnexe(c.prix) + '</div>';
                            var details = [];
                            if (c.surface) details.push(c.surface);
                            if (c.surfaceParcelle) details.push('Parcelle ' + c.surfaceParcelle);
                            if (typeMaisonLabel) details.push(typeMaisonLabel);
                            if (c.dureeEnVente) details.push('Depuis ' + c.dureeEnVente);
                            if (c.commentaire) details.push(c.commentaire);
                            if (details.length > 0) {
                                html += '<div style="font-size:6px;color:#6b7280;margin-top:1px;">' + details.join(' â€¢ ') + '</div>';
                            }
                            html += '</div>';
                        });
                        html += '</div>';
                        html += '</div>';
                    }
                    
                    // RÃ©cap votre bien
                    html += '<div style="background:linear-gradient(135deg,#fff5f4 0%,#ffffff 100%);border:1px solid #FF4539;border-radius:6px;padding:12px 16px;margin-top:16px;text-align:center;">';
                    html += '<div style="font-size:7px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Votre bien</div>';
                    html += '<div style="font-size:10px;font-weight:600;color:#1a2e35;">' + val(bien.adresse) + '</div>';
                    html += '<div style="font-size:14px;font-weight:700;color:#FF4539;margin-top:4px;">' + formatPrice(totalVenaleArrondi) + '</div>';
                    html += '</div>';
                    
                    html += '</div>';
                    
                    // Footer
                    html += '<div class="footer">';
                    html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                    html += '<div class="footer-ref">Page 5/' + totalPages + ' â€¢ Annexe Comparables</div>';
                    html += '<div class="footer-slogan">On pilote, vous dÃ©cidez.</div>';
                    html += '</div>';
                    
                    html += '</div>'; // page 5 annexe comparables
                }
                
                // ==================== PAGE 5/6 : ANNEXE TECHNIQUE ====================
                html += '<div class="page" style="page-break-before:always;">';
                
                // Header
                html += '<div class="header">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
                html += '<div class="header-date">Annexe Technique (1/2)</div>';
                html += '</div>';
                
                // Styles spÃ©cifiques annexe
                html += '<style>';
                html += '.annexe-section { padding: 10px 24px; border-bottom: 1px solid #e5e7eb; }';
                html += '.annexe-section:last-of-type { border-bottom: none; }';
                html += '.annexe-title { font-size: 10px; font-weight: 700; color: #FF4539; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }';
                html += '.annexe-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }';
                html += '.annexe-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }';
                html += '.annexe-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }';
                html += '.annexe-item { background: #f8fafc; border-radius: 4px; padding: 6px 8px; }';
                html += '.annexe-item-label { font-size: 7px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }';
                html += '.annexe-item-value { font-size: 10px; color: #1a2e35; font-weight: 600; }';
                html += '.annexe-row { display: flex; gap: 8px; flex-wrap: wrap; }';
                html += '.annexe-chip { background: #e5e7eb; color: #4b5563; padding: 3px 8px; border-radius: 10px; font-size: 8px; }';
                html += '.annexe-chip.positive { background: #d1fae5; color: #065f46; }';
                html += '.annexe-chip.negative { background: #fee2e2; color: #991b1b; }';
                html += '.etat-dots { display: flex; gap: 3px; align-items: center; }';
                html += '.etat-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb; }';
                html += '.etat-dot.filled { background: #1a2e35; }';
                html += '.annexe-prox { display: flex; align-items: center; gap: 6px; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }';
                html += '.annexe-prox:last-child { border-bottom: none; }';
                html += '</style>';
                
                // Fonction helper pour afficher une valeur ou tiret
                var annexeVal = function(v, suffix) {
                    if (v === undefined || v === null || v === '') return 'â€”';
                    return v + (suffix || '');
                };
                
                // Fonction helper pour les dots d'Ã©tat
                var renderEtatDots = function(value) {
                    // Mapping des Ã©tats texte vers nombres
                    var etatMapping = { 'neuf': 4, 'bon': 3, 'rafraichir': 2, 'refaire': 1 };
                    var numValue = typeof value === 'string' ? (etatMapping[value] || 0) : (value || 0);
                    var dots = '';
                    for (var i = 1; i <= 5; i++) {
                        dots += '<div class="etat-dot' + (i <= numValue ? ' filled' : '') + '"></div>';
                    }
                    return '<div class="etat-dots">' + dots + '</div>';
                };
                
                // Labels pour les sous-types
                var sousTypeLabels = {
                    'standard': 'Standard', 'standing': 'Standing', 'attique': 'Attique', 
                    'duplex': 'Duplex/Triplex', 'sousplex': 'Sousplex', 'loft': 'Loft', 
                    'studio': 'Studio', 'rez_jardin': 'Rez-jardin', 'hotel_particulier': 'HÃ´tel particulier',
                    'villa_individuelle': 'Villa individuelle', 'villa_mitoyenne': 'Villa mitoyenne',
                    'villa_jumelee': 'Villa jumelÃ©e', 'maison_village': 'Maison de village',
                    'chalet': 'Chalet', 'ferme_rustico': 'Ferme/Rustico', 'maison_architecte': "Maison d'architecte",
                    'chateau': 'ChÃ¢teau', 'pied_dans_eau': 'Pied dans l\'eau'
                };
                
                // Labels pour zones
                var zoneLabels = {
                    '5': 'Zone 5 (Villa)', '4BP': 'Zone 4B protÃ©gÃ©e', '4B': 'Zone 4B', 
                    '4A': 'Zone 4A', '3': 'Zone 3', '2': 'Zone 2', '1': 'Zone 1',
                    'ZD': 'Zone dÃ©veloppement', 'agricole': 'Agricole', 'industrielle': 'Industrielle', 'autre': 'Autre'
                };
                
                // Labels pour buanderie
                var buanderieLabels = { 'privee': 'PrivÃ©e', 'commune': 'Commune', 'aucune': 'Aucune' };
                
                // Labels pour motifs de vente
                var motifLabels = {
                    'succession': 'Succession', 'divorce': 'Divorce', 'demenagement': 'DÃ©mÃ©nagement',
                    'agrandissement': 'Agrandissement', 'reduction': 'RÃ©duction surface', 
                    'investissement': 'Investissement', 'financier': 'Raisons financiÃ¨res',
                    'travail': 'Mutation professionnelle', 'retraite': 'Retraite', 'autre': 'Autre'
                };
                
                // Labels pour prioritÃ©
                var prioriteLabels = {
                    'rapidite': 'RapiditÃ©', 'prixMax': 'Prix maximum', 'equilibre': 'Ã‰quilibre', 'discretion': 'DiscrÃ©tion'
                };
                
                // Labels pour confidentialitÃ©
                var confidentLabels = {
                    'normale': 'Normale', 'discrete': 'DiscrÃ¨te', 'confidentielle': 'Confidentielle'
                };
                
                // Labels pour espaces maison
                var espaceLabels = {
                    'cave': 'Cave', 'buanderie': 'Buanderie', 'local_tech': 'Local technique', 
                    'salle_jeux': 'Salle de jeux', 'home_cinema': 'Home cinÃ©ma', 'cellier': 'Cellier',
                    'abri_pc': 'Abri PC', 'chambre_ss': 'Chambre SS', 'sdb_ss': 'SDB SS', 'wc_ss': 'WC SS',
                    'bureau': 'Bureau', 'studio': 'Studio indÃ©p.', 'spa': 'Spa/Wellness', 'sauna': 'Sauna',
                    'hammam': 'Hammam', 'piscine_int': 'Piscine int.', 'piscine_ext': 'Piscine ext.',
                    'dressing': 'Dressing', 'bibliotheque': 'BibliothÃ¨que', 'atelier': 'Atelier',
                    'local_ski': 'Local ski', 'cabanon': 'Cabanon', 'pool_house': 'Pool house',
                    'dependance': 'DÃ©pendance', 'conciergerie': 'Conciergerie'
                };
                
                // Labels pour nuisances
                var nuisanceLabels = {
                    'bruit_route': 'Bruit route', 'bruit_train': 'Bruit train', 'bruit_avion': 'Bruit avion',
                    'bruit_voisins': 'Bruit voisins', 'vis_a_vis': 'Vis-Ã -vis', 'odeurs': 'Odeurs',
                    'antenne': 'Antenne/PylÃ´ne', 'ligne_ht': 'Ligne HT', 'zone_inondable': 'Zone inondable',
                    'servitude': 'Servitude', 'chantier': 'Chantier proche', 'autre': 'Autre'
                };
                
                // === SECTION VENDEUR ===
                html += '<div class="annexe-section">';
                html += '<div class="annexe-title">' + ico('user', 12, '#FF4539') + ' Contact Vendeur</div>';
                html += '<div class="annexe-grid-3">';
                html += '<div class="annexe-item"><div class="annexe-item-label">Nom</div><div class="annexe-item-value">' + annexeVal(vendeur.nom) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">TÃ©lÃ©phone</div><div class="annexe-item-value">' + annexeVal(vendeur.telephone) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Email</div><div class="annexe-item-value">' + annexeVal(vendeur.email) + '</div></div>';
                html += '</div></div>';
                
                // === SECTION ADRESSE ===
                html += '<div class="annexe-section">';
                html += '<div class="annexe-title">' + ico('mapPin', 12, '#FF4539') + ' Localisation</div>';
                html += '<div class="annexe-grid-3">';
                html += '<div class="annexe-item"><div class="annexe-item-label">Adresse</div><div class="annexe-item-value">' + annexeVal(bien.adresse) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Code postal</div><div class="annexe-item-value">' + annexeVal(bien.codePostal) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">LocalitÃ©</div><div class="annexe-item-value">' + annexeVal(bien.localite) + '</div></div>';
                html += '</div></div>';
                
                // === SECTION CONTEXTE ===
                html += '<div class="annexe-section">';
                html += '<div class="annexe-title">' + ico('info', 12, '#FF4539') + ' Contexte de vente</div>';
                html += '<div class="annexe-grid">';
                html += '<div class="annexe-item"><div class="annexe-item-label">Motif</div><div class="annexe-item-value">' + annexeVal(motifLabels[contexte.motifVente]) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Horizon</div><div class="annexe-item-value">' + annexeVal(contexte.horizon) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">PrioritÃ©</div><div class="annexe-item-value">' + annexeVal(prioriteLabels[contexte.prioriteVendeur]) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">ConfidentialitÃ©</div><div class="annexe-item-value">' + annexeVal(confidentLabels[contexte.confidentialite]) + '</div></div>';
                html += '</div>';
                // Occupation
                var occupationText = contexte.statutOccupation === 'libre' ? 'Libre' : 
                    (contexte.statutOccupation === 'loue' ? 'LouÃ©' + (contexte.finBailMois && contexte.finBailAnnee ? ' (fin: ' + contexte.finBailMois + '/' + contexte.finBailAnnee + ')' : '') : 'â€”');
                html += '<div class="annexe-grid-2" style="margin-top:6px;">';
                html += '<div class="annexe-item"><div class="annexe-item-label">Occupation</div><div class="annexe-item-value">' + occupationText + '</div></div>';
                html += '</div></div>';
                
                // === SECTION PROXIMITÃ‰S ===
                var proximites = identification.proximites || [];
                var proxFiltrees = proximites.filter(function(p) { return p.libelle; });
                if (proxFiltrees.length > 0) {
                    html += '<div class="annexe-section">';
                    html += '<div class="annexe-title">' + ico('mapPin', 12, '#FF4539') + ' ProximitÃ©s</div>';
                    proxFiltrees.forEach(function(p) {
                        html += '<div class="annexe-prox">';
                        html += '<span style="font-size:14px;">' + (p.icone || 'ðŸ“') + '</span>';
                        html += '<span style="font-size:9px;color:#1a2e35;flex:1;">' + p.libelle + '</span>';
                        if (p.distance) html += '<span style="font-size:9px;color:#6b7280;">' + p.distance + ' m</span>';
                        html += '</div>';
                    });
                    html += '</div>';
                }
                
                // === SECTION CARACTÃ‰RISTIQUES ===
                html += '<div class="annexe-section">';
                html += '<div class="annexe-title">' + ico('home', 12, '#FF4539') + ' CaractÃ©ristiques du bien</div>';
                
                // Type et sous-type
                html += '<div class="annexe-grid">';
                html += '<div class="annexe-item"><div class="annexe-item-label">Type</div><div class="annexe-item-value">' + (isAppartement ? 'Appartement' : (isMaison ? 'Maison' : 'â€”')) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Sous-type</div><div class="annexe-item-value">' + annexeVal(sousTypeLabels[carac.sousType]) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">AnnÃ©e construction</div><div class="annexe-item-value">' + annexeVal(carac.anneeConstruction) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">RÃ©novation</div><div class="annexe-item-value">' + annexeVal(carac.anneeRenovation) + '</div></div>';
                html += '</div>';
                
                // Surfaces selon type
                html += '<div class="annexe-grid" style="margin-top:6px;">';
                if (isAppartement) {
                    html += '<div class="annexe-item"><div class="annexe-item-label">Surface PPE</div><div class="annexe-item-value">' + annexeVal(carac.surfacePPE, ' mÂ²') + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Sous-sol hab.</div><div class="annexe-item-value">' + annexeVal(carac.surfaceNonHabitable, ' mÂ²') + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Balcon</div><div class="annexe-item-value">' + annexeVal(carac.surfaceBalcon, ' mÂ²') + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Terrasse</div><div class="annexe-item-value">' + annexeVal(carac.surfaceTerrasse, ' mÂ²') + '</div></div>';
                    html += '</div><div class="annexe-grid" style="margin-top:6px;">';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Jardin privatif</div><div class="annexe-item-value">' + annexeVal(carac.surfaceJardin, ' mÂ²') + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">NÂ° lot PPE</div><div class="annexe-item-value">' + annexeVal(carac.numeroLotPPE) + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Fonds rÃ©novation</div><div class="annexe-item-value">' + annexeVal(carac.fondRenovation, ' CHF') + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Surface pondÃ©rÃ©e</div><div class="annexe-item-value">' + surfacePonderee.toFixed(1) + ' mÂ²</div></div>';
                } else if (isMaison) {
                    html += '<div class="annexe-item"><div class="annexe-item-label">Surface habitable</div><div class="annexe-item-value">' + annexeVal(carac.surfaceHabitableMaison, ' mÂ²') + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Surface utile</div><div class="annexe-item-value">' + annexeVal(carac.surfaceUtile, ' mÂ²') + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Surface terrain</div><div class="annexe-item-value">' + annexeVal(carac.surfaceTerrain, ' mÂ²') + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">NÂ° parcelle</div><div class="annexe-item-value">' + annexeVal(carac.numeroParcelle) + '</div></div>';
                    html += '</div><div class="annexe-grid" style="margin-top:6px;">';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Zone</div><div class="annexe-item-value">' + annexeVal(zoneLabels[carac.zone]) + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Niveaux</div><div class="annexe-item-value">' + annexeVal(carac.nombreNiveaux) + '</div></div>';
                }
                html += '</div>';
                
                // Configuration
                html += '<div class="annexe-grid" style="margin-top:6px;">';
                html += '<div class="annexe-item"><div class="annexe-item-label">PiÃ¨ces</div><div class="annexe-item-value">' + annexeVal(carac.nombrePieces) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Chambres</div><div class="annexe-item-value">' + annexeVal(carac.nombreChambres) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Salles de bain</div><div class="annexe-item-value">' + annexeVal(carac.nombreSDB) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">WC sÃ©parÃ©s</div><div class="annexe-item-value">' + annexeVal(carac.nombreWC) + '</div></div>';
                html += '</div>';
                
                // Ã‰tage (appartement) ou niveaux (maison)
                if (isAppartement) {
                    var formatEtage = function(val) {
                        if (val === undefined || val === '') return 'â€”';
                        if (val == 0) return 'RDC';
                        if (val == -1) return 'Sous-sol';
                        if (val === 'rez-inf') return 'Rez-infÃ©rieur';
                        if (val === 'rez-sup') return 'Rez-supÃ©rieur';
                        return val + 'e';
                    };
                    var etageText = formatEtage(carac.etage);
                    if (carac.etageHaut) etageText += ' au ' + formatEtage(carac.etageHaut);
                    html += '<div class="annexe-grid" style="margin-top:6px;">';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Ã‰tage</div><div class="annexe-item-value">' + etageText + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Ã‰tages immeuble</div><div class="annexe-item-value">' + annexeVal(carac.nombreEtagesImmeuble) + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Ascenseur</div><div class="annexe-item-value">' + (carac.ascenseur === true ? 'Oui' : (carac.ascenseur === false ? 'Non' : 'â€”')) + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Dernier Ã©tage</div><div class="annexe-item-value">' + (carac.dernierEtage ? 'Oui' : 'Non') + '</div></div>';
                    html += '</div>';
                }
                
                // Exposition et vue
                var expositionText = (carac.exposition || []).length > 0 ? carac.exposition.join(', ') : 'â€”';
                html += '<div class="annexe-grid-2" style="margin-top:6px;">';
                html += '<div class="annexe-item"><div class="annexe-item-label">Exposition</div><div class="annexe-item-value">' + expositionText + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Vue</div><div class="annexe-item-value">' + annexeVal(carac.vue) + '</div></div>';
                html += '</div>';
                
                html += '</div>'; // fin section caractÃ©ristiques
                
                // === SECTION Ã‰NERGIE & CHARGES ===
                html += '<div class="annexe-section">';
                html += '<div class="annexe-title">' + ico('zap', 12, '#FF4539') + ' Ã‰nergie & Charges</div>';
                html += '<div class="annexe-grid">';
                html += '<div class="annexe-item"><div class="annexe-item-label">CECB</div><div class="annexe-item-value">' + annexeVal(carac.cecb) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Vitrage</div><div class="annexe-item-value">' + annexeVal(carac.vitrage) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Chauffage</div><div class="annexe-item-value">' + annexeVal(carac.chauffage) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Charges mensuelles</div><div class="annexe-item-value">' + annexeVal(carac.chargesMensuelles, ' CHF') + '</div></div>';
                html += '</div>';
                // Diffusion chaleur
                var diffusionArr = isAppartement ? (carac.diffusion || []) : (carac.diffusionMaison || []);
                if (diffusionArr.length > 0) {
                    html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Diffusion : </span>';
                    diffusionArr.forEach(function(d) { html += '<span class="annexe-chip">' + d + '</span> '; });
                    html += '</div>';
                }
                html += '</div>';
                
                // === SECTION ANNEXES & STATIONNEMENT ===
                html += '<div class="annexe-section">';
                html += '<div class="annexe-title">' + ico('parking', 12, '#FF4539') + ' Annexes & Stationnement</div>';
                html += '<div class="annexe-grid">';
                html += '<div class="annexe-item"><div class="annexe-item-label">Parking intÃ©rieur</div><div class="annexe-item-value">' + annexeVal(carac.parkingInterieur) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Parking extÃ©rieur</div><div class="annexe-item-value">' + annexeVal(carac.parkingExterieur) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Place couverte</div><div class="annexe-item-value">' + annexeVal(carac.parkingCouverte) + '</div></div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Box</div><div class="annexe-item-value">' + annexeVal(carac.box) + '</div></div>';
                html += '</div>';
                
                if (isAppartement) {
                    html += '<div class="annexe-grid" style="margin-top:6px;">';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Cave</div><div class="annexe-item-value">' + (carac.cave === true ? 'Oui' : (carac.cave === false ? 'Non' : 'â€”')) + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Buanderie</div><div class="annexe-item-value">' + annexeVal(buanderieLabels[carac.buanderie]) + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Piscine</div><div class="annexe-item-value">' + (carac.piscine ? 'Oui' : 'Non') + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Autres</div><div class="annexe-item-value">' + annexeVal(carac.autresAnnexes) + '</div></div>';
                    html += '</div>';
                }
                
                // Espaces maison
                if (isMaison && (carac.espacesMaison || []).length > 0) {
                    html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Espaces : </span>';
                    carac.espacesMaison.forEach(function(e) { 
                        html += '<span class="annexe-chip">' + (espaceLabels[e] || e) + '</span> '; 
                    });
                    html += '</div>';
                }
                html += '</div>';
                
                // Footer page 5 (Annexe Technique 1/2)
                html += '<div class="footer">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                html += '<div class="footer-ref">Page ' + pageNumAnnexeTech1 + '/' + totalPages + ' â€¢ Annexe Technique (1/2)</div>';
                html += '<div class="footer-slogan">On pilote, vous dÃ©cidez.</div>';
                html += '</div>';
                
                html += '</div>'; // fin page 5
                
                // ==================== PAGE 6 : ANNEXE TECHNIQUE (2/2) ====================
                html += '<div class="page" style="page-break-before:always;">';
                
                // Header page 6
                html += '<div class="header">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
                html += '<div class="header-date">Annexe Technique (2/2)</div>';
                html += '</div>';
                
                // === SECTION Ã‰TAT DU BIEN ===
                html += '<div class="annexe-section">';
                html += '<div class="annexe-title">' + ico('eye', 12, '#FF4539') + ' Ã‰tat du bien (observation visite)</div>';
                html += '<div class="annexe-grid-3">';
                html += '<div class="annexe-item"><div class="annexe-item-label">Cuisine</div>' + renderEtatDots(analyse.etatCuisine) + '</div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Salles d\'eau</div>' + renderEtatDots(analyse.etatSDB) + '</div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Sols</div>' + renderEtatDots(analyse.etatSols) + '</div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Murs/Peintures</div>' + renderEtatDots(analyse.etatMurs) + '</div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Menuiseries</div>' + renderEtatDots(analyse.etatMenuiseries) + '</div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Ã‰lectricitÃ©</div>' + renderEtatDots(analyse.etatElectricite) + '</div>';
                html += '</div>';
                html += '<div class="annexe-grid-3" style="margin-top:6px;">';
                html += '<div class="annexe-item"><div class="annexe-item-label">LuminositÃ©</div>' + renderEtatDots(analyse.luminosite) + '</div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Calme</div>' + renderEtatDots(analyse.calme) + '</div>';
                html += '<div class="annexe-item"><div class="annexe-item-label">Volumes</div>' + renderEtatDots(analyse.volumes) + '</div>';
                html += '</div>';
                html += '<div class="annexe-grid-3" style="margin-top:6px;">';
                html += '<div class="annexe-item"><div class="annexe-item-label">Impression gÃ©nÃ©rale</div>' + renderEtatDots(analyse.impressionGenerale) + '</div>';
                html += '</div>';
                html += '</div>';
                
                // === SECTION POINTS FORTS / FAIBLES ===
                var pf = analyse.pointsForts || [];
                var pfaibles = analyse.pointsFaibles || [];
                
                // Fonction pour retirer les emojis au dÃ©but des chaÃ®nes
                var cleanEmoji = function(str) {
                    if (!str) return str;
                    var idx = str.indexOf(' ');
                    if (idx > 0 && idx <= 6) {
                        return str.substring(idx + 1);
                    }
                    return str;
                };
                
                if (pf.length > 0 || pfaibles.length > 0) {
                    html += '<div class="annexe-section">';
                    html += '<div class="annexe-title">' + ico('list', 12, '#FF4539') + ' Points forts & faibles</div>';
                    if (pf.length > 0) {
                        html += '<div style="margin-bottom:6px;"><span style="font-size:8px;color:#065f46;font-weight:600;">POINTS FORTS : </span>';
                        pf.forEach(function(p) { html += '<span class="annexe-chip positive">' + cleanEmoji(p) + '</span> '; });
                        html += '</div>';
                    }
                    if (pfaibles.length > 0) {
                        html += '<div><span style="font-size:8px;color:#991b1b;font-weight:600;">POINTS FAIBLES : </span>';
                        pfaibles.forEach(function(p) { html += '<span class="annexe-chip negative">' + cleanEmoji(p) + '</span> '; });
                        html += '</div>';
                    }
                    html += '</div>';
                }
                
                // === SECTION NUISANCES ===
                var nuisances = analyse.nuisances || [];
                if (nuisances.length > 0) {
                    html += '<div class="annexe-section">';
                    html += '<div class="annexe-title">' + ico('alert', 12, '#FF4539') + ' Nuisances identifiÃ©es</div>';
                    html += '<div class="annexe-row">';
                    nuisances.forEach(function(n) { html += '<span class="annexe-chip negative">' + (nuisanceLabels[n] || n) + '</span> '; });
                    html += '</div></div>';
                }
                
                // === SECTION OBJECTIONS ACHETEURS ===
                if (analyse.objectionsAcheteurs) {
                    html += '<div class="annexe-section">';
                    html += '<div class="annexe-title">' + ico('alert', 12, '#FF4539') + ' Objections acheteurs anticipÃ©es</div>';
                    html += '<div style="font-size:9px;color:#4b5563;line-height:1.4;">' + analyse.objectionsAcheteurs + '</div>';
                    html += '</div>';
                }
                
                // === SECTION HISTORIQUE DIFFUSION ===
                if (historique.dejaDiffuse) {
                    html += '<div class="annexe-section">';
                    html += '<div class="annexe-title">' + ico('clock', 12, '#FF4539') + ' Historique de diffusion</div>';
                    var dureeLabels = {'moins1mois': '< 1 mois', '1-3mois': '1-3 mois', '3-6mois': '3-6 mois', '6-12mois': '6-12 mois', 'plus12mois': '> 12 mois'};
                    var typeDiffLabels = {'discrete': 'DiscrÃ¨te', 'moderee': 'ModÃ©rÃ©e', 'massive': 'Massive'};
                    html += '<div class="annexe-grid">';
                    html += '<div class="annexe-item"><div class="annexe-item-label">DurÃ©e</div><div class="annexe-item-value">' + annexeVal(dureeLabels[historique.duree]) + '</div></div>';
                    html += '<div class="annexe-item"><div class="annexe-item-label">Type diffusion</div><div class="annexe-item-value">' + annexeVal(typeDiffLabels[historique.typeDiffusion]) + '</div></div>';
                    html += '</div>';
                    // Portails utilisÃ©s
                    var portailsUtilises = historique.portails || [];
                    if (portailsUtilises.length > 0) {
                        var portailsLbl = {'immoscout': 'Immoscout', 'homegate': 'Homegate', 'acheterlouer': 'Acheter-Louer', 'anibis': 'Anibis', 'immostreet': 'ImmoStreet', 'autres': 'Autres'};
                        html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#6b7280;">Portails utilisÃ©s : </span>';
                        portailsUtilises.forEach(function(p) { html += '<span class="annexe-chip">' + (portailsLbl[p] || p) + '</span> '; });
                        html += '</div>';
                    }
                    // Raisons Ã©chec
                    var raisonsEchec = historique.raisonEchec || [];
                    if (raisonsEchec.length > 0) {
                        var raisonLbl = {'prix': 'Prix trop Ã©levÃ©', 'photos': 'Mauvaises photos', 'timing': 'Mauvais timing', 'etatbien': 'Ã‰tat du bien', 'vendeur': 'Vendeur pas prÃªt', 'agence': 'Mauvais suivi agence', 'marche': 'MarchÃ© difficile', 'autre': 'Autre'};
                        html += '<div style="margin-top:6px;"><span style="font-size:8px;color:#991b1b;">Raisons Ã©chec perÃ§ues : </span>';
                        raisonsEchec.forEach(function(r) { html += '<span class="annexe-chip negative">' + (raisonLbl[r] || r) + '</span> '; });
                        html += '</div>';
                    }
                    html += '</div>';
                }
                
                // Footer page 6 (Annexe Technique 2/2)
                html += '<div class="footer">';
                html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                html += '<div class="footer-ref">Page ' + pageNumAnnexeTech2 + '/' + totalPages + ' â€¢ Annexe Technique (2/2)</div>';
                html += '<div class="footer-slogan">On pilote, vous dÃ©cidez.</div>';
                html += '</div>';
                
                html += '</div>'; // page 6
                
                // ==================== PAGES PHOTOS (conditionnelles) ====================
                if (photosCount > 0) {
                    // Style grille photos
                    html += '<style>';
                    html += '.photos-grid-pdf { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 16px 24px; }';
                    html += '.photo-cell { aspect-ratio: 1; overflow: hidden; border-radius: 6px; background: #f3f4f6; }';
                    html += '.photo-cell img { width: 100%; height: 100%; object-fit: cover; }';
                    html += '</style>';
                    
                    // GÃ©nÃ©rer les pages photos (9 photos par page)
                    for (var pagePhotoIdx = 0; pagePhotoIdx < photoPagesCount; pagePhotoIdx++) {
                        var startIdx = pagePhotoIdx * 9;
                        var endIdx = Math.min(startIdx + 9, photosCount);
                        var pagePhotos = photoItems.slice(startIdx, endIdx);
                        var photoPageNum = pageNumAnnexeTech2 + 1 + pagePhotoIdx;
                        
                        html += '<div class="page" style="page-break-before:always;">';
                        
                        // Header
                        html += '<div class="header">';
                        html += '<div>' + logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox') + '</div>';
                        html += '<div class="header-date">Annexe photos' + (photoPagesCount > 1 ? ' (' + (pagePhotoIdx + 1) + '/' + photoPagesCount + ')' : '') + '</div>';
                        html += '</div>';
                        
                        // Grille de photos
                        html += '<div class="photos-grid-pdf">';
                        pagePhotos.forEach(function(photo) {
                            html += '<div class="photo-cell">';
                            html += '<img src="' + photo.dataUrl + '" alt="Photo" />';
                            html += '</div>';
                        });
                        // Remplir les cellules vides pour garder la grille alignÃ©e
                        var emptyCells = 9 - pagePhotos.length;
                        for (var ec = 0; ec < emptyCells; ec++) {
                            html += '<div class="photo-cell" style="background:#f8fafc;"></div>';
                        }
                        html += '</div>';
                        
                        // Footer
                        html += '<div class="footer">';
                        html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                        html += '<div class="footer-ref">Page ' + photoPageNum + '/' + totalPages + ' â€¢ Annexe photos</div>';
                        html += '<div class="footer-slogan">On pilote, vous dÃ©cidez.</div>';
                        html += '</div>';
                        
                        html += '</div>'; // page photo
                    }
                }
                
                // === PAGE ANNEXE CARTOGRAPHIE ===
                if (bien.mapLat && bien.mapLng) {
                    var mapZoomPdf = bien.mapZoom || 18;
                    var mapTypePdf = bien.mapType || 'hybrid';
                    var swissZoomPdf = bien.swisstopoZoom || 19;
                    var swissLatPdf = bien.swisstopoLat || bien.mapLat;
                    var swissLngPdf = bien.swisstopoLng || bien.mapLng;
                    
                    // URL Google Maps (format 4:3)
                    var googleMapUrl = 'https://maps.googleapis.com/maps/api/staticmap?center=' + bien.mapLat + ',' + bien.mapLng + '&zoom=' + mapZoomPdf + '&size=600x450&scale=2&maptype=' + mapTypePdf + '&markers=color:red%7C' + bien.mapLat + ',' + bien.mapLng + '&key=AIzaSyBthk0_ku_S3E3_0ItEqCNXtHW84ve_jmE';
                    
                    // Calcul BBOX pour Swisstopo (format 4:3)
                    var metersPerPx = 156543.03392 * Math.cos(swissLatPdf * Math.PI / 180) / Math.pow(2, swissZoomPdf);
                    var widthDeg = (600 * metersPerPx) / 111320;
                    var heightDeg = (450 * metersPerPx) / 110540;
                    var bboxMinLat = swissLatPdf - heightDeg / 2;
                    var bboxMaxLat = swissLatPdf + heightDeg / 2;
                    var bboxMinLng = swissLngPdf - widthDeg / 2;
                    var bboxMaxLng = swissLngPdf + widthDeg / 2;
                    
                    // URL Swisstopo
                    var swisstopoUrl = 'https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=false&LAYERS=ch.swisstopo.landeskarte-farbe-10,ch.kantone.cadastralwebmap-farbe&CRS=EPSG:4326&STYLES=&WIDTH=600&HEIGHT=450&BBOX=' + bboxMinLat + ',' + bboxMinLng + ',' + bboxMaxLat + ',' + bboxMaxLng;
                    
                    // RÃ©cupÃ©rer les donnÃ©es transports
                    var transports = bien.transports || {};
                    var arret = transports.arret;
                    var gare = transports.gare;
                    
                    // IcÃ´nes SVG trait fin
                    var iconGlobe = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                    var iconGrid = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>';
                    var iconBus = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a2e35" stroke-width="1.5"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/><path d="M5 4V2M19 4V2"/></svg>';
                    var iconTrain = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a2e35" stroke-width="1.5"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/><path d="M8 19l-2 2M16 19l2 2"/></svg>';
                    var iconClock = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FA4238" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
                    var iconPin = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FA4238" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
                    
                    html += '<div class="page" style="page-break-before: always;">';
                    
                    // Header
                    html += '<div class="header">';
                    html += logoWhite.replace('viewBox', 'style="height:28px;width:auto;" viewBox');
                    html += '<div class="header-date">' + dateStr + '</div>';
                    html += '</div>';
                    
                    // Titre
                    html += '<div style="padding: 12px 24px 8px;">';
                    html += '<h2 style="font-size: 16px; font-weight: 700; color: #1a2e35; margin: 0 0 3px; display: flex; align-items: center; gap: 6px;">' + iconPin + ' Localisation du bien</h2>';
                    html += '<p style="font-size: 10px; color: #64748b; margin: 0;">' + val(bien.adresse) + ', ' + val(bien.codePostal) + ' ' + val(bien.localite) + '</p>';
                    html += '</div>';
                    
                    // Cartes en vertical
                    html += '<div style="padding: 0 24px; display: flex; flex-direction: column; gap: 8px;">';
                    
                    // Carte Google Maps
                    html += '<div style="background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 360px; margin: 0 auto;">';
                    html += '<div style="font-size: 9px; font-weight: 600; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">' + iconGlobe + ' Vue satellite</div>';
                    html += '<div style="width: 100%; aspect-ratio: 4/3; border-radius: 6px; overflow: hidden;">';
                    html += '<img src="' + googleMapUrl + '" style="width: 100%; height: 100%; object-fit: cover; display: block;" />';
                    html += '</div>';
                    html += '</div>';
                    
                    // Carte Swisstopo
                    html += '<div style="background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 360px; margin: 0 auto;">';
                    html += '<div style="font-size: 9px; font-weight: 600; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">' + iconGrid + ' Plan cadastral officiel</div>';
                    html += '<div style="width: 100%; aspect-ratio: 4/3; border-radius: 6px; overflow: hidden;">';
                    html += '<img src="' + swisstopoUrl + '" style="width: 100%; height: 100%; object-fit: cover; display: block;" />';
                    html += '</div>';
                    html += '</div>';
                    
                    html += '</div>'; // fin cartes
                    
                    // Section Transports
                    if (arret || gare) {
                        html += '<div style="padding: 10px 24px 70px; margin-top: 6px;">';
                        html += '<div style="font-size: 9px; font-weight: 700; color: #FA4238; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">' + iconClock + ' Transports Ã  proximitÃ©</div>';
                        
                        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
                        
                        // ArrÃªt bus/tram
                        if (arret) {
                            var arretDistance = arret.distance >= 1000 ? (arret.distance / 1000).toFixed(1) + ' km' : arret.distance + ' m';
                            html += '<div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; display: flex; align-items: flex-start; gap: 8px;">';
                            html += '<div style="width: 28px; height: 28px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; flex-shrink: 0;">' + iconBus + '</div>';
                            html += '<div style="flex: 1; min-width: 0;">';
                            html += '<div style="font-size: 7px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px;">ArrÃªt bus / tram</div>';
                            html += '<div style="font-size: 10px; font-weight: 600; color: #1a2e35; margin-bottom: 3px; line-height: 1.2;">' + arret.nom + '</div>';
                            html += '<div style="font-size: 9px; color: #64748b; display: flex; align-items: center; gap: 4px;">' + arretDistance + ' <span style="background: #FA4238; color: white; padding: 1px 5px; border-radius: 8px; font-size: 8px; font-weight: 600;">~' + arret.tempsMarche + ' min Ã  pied</span></div>';
                            html += '</div>';
                            html += '</div>';
                        } else {
                            html += '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; color: #94a3b8; font-size: 9px;">Aucun arrÃªt Ã  proximitÃ©</div>';
                        }
                        
                        // Gare
                        if (gare) {
                            var gareDistance = gare.distance >= 1000 ? (gare.distance / 1000).toFixed(1) + ' km' : gare.distance + ' m';
                            var gareTemps = gare.temps || gare.tempsMarche;
                            var gareMode = gare.mode === 'voiture' ? 'en voiture' : 'Ã  pied';
                            html += '<div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; display: flex; align-items: flex-start; gap: 8px;">';
                            html += '<div style="width: 28px; height: 28px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; flex-shrink: 0;">' + iconTrain + '</div>';
                            html += '<div style="flex: 1; min-width: 0;">';
                            html += '<div style="font-size: 7px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px;">Gare ferroviaire</div>';
                            html += '<div style="font-size: 10px; font-weight: 600; color: #1a2e35; margin-bottom: 3px; line-height: 1.2;">' + gare.nom + '</div>';
                            html += '<div style="font-size: 9px; color: #64748b; display: flex; align-items: center; gap: 4px;">' + gareDistance + ' <span style="background: #FA4238; color: white; padding: 1px 5px; border-radius: 8px; font-size: 8px; font-weight: 600;">~' + gareTemps + ' min ' + gareMode + '</span></div>';
                            html += '</div>';
                            html += '</div>';
                        } else {
                            html += '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; color: #94a3b8; font-size: 9px;">Aucune gare Ã  proximitÃ©</div>';
                        }
                        
                        html += '</div>'; // fin grid
                        html += '</div>'; // fin section transports
                    }
                    
                    // Footer
                    html += '<div class="footer">';
                    html += '<div>' + logoWhite.replace('viewBox', 'style="height:18px;width:auto;" viewBox') + '</div>';
                    html += '<div class="footer-ref">Annexe cartographie</div>';
                    html += '<div class="footer-slogan">On pilote, vous dÃ©cidez.</div>';
                    html += '</div>';
                    
                    html += '</div>'; // fin page cartographie
                }
                
                html += '<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script>';
                html += '</body></html>';
                
                printWindow.document.write(html);
                printWindow.document.close();
                setGenerating(false);
            };
