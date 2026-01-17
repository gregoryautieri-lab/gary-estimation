/**
 * Page "Qui est GARY?" du PDF
 * Exactement comme le fichier source original
 */

import { ico, getLogo } from '../index';

interface GaryPageData {
  pageNumber: number;
  totalPages: number;
}

export function generateGaryPage(data: GaryPageData): string {
  let html = '';

  html += '<div class="page gary-page" style="page-break-before: always;">';

  // Header
  html += '<div class="gary-header">';
  html += getLogo('white', 28);
  html += '<div class="header-date">Qui sommes-nous ?</div>';
  html += '</div>';

  // Content
  html += '<div class="gary-content">';
  html += '<div class="gary-title">Qui est GARY ?</div>';
  html += '<div class="gary-intro">Une agence immobilière indépendante, basée à Genève, qui allie maîtrise du marché local, stratégie de diffusion moderne et accompagnement sur mesure.</div>';
  html += '<div class="gary-divider"></div>';

  // Section Vision
  html += '<div class="gary-section">';
  html += '<div class="gary-section-title">Notre vision</div>';
  html += '<div class="gary-text">';
  html += '<p><strong>GARY</strong> est né d\'un constat simple : le marché immobilier genevois mérite une approche plus transparente, plus stratégique et plus humaine. Nous ne sommes pas une franchise, mais une équipe soudée qui connaît chaque quartier, chaque spécificité du canton.</p>';
  html += '<p>Notre force ? <strong>Combiner expertise terrain et visibilité digitale</strong> pour maximiser vos chances de vendre au meilleur prix, dans les meilleurs délais.</p>';
  html += '</div>';
  html += '</div>';

  // Section Principes
  html += '<div class="gary-section">';
  html += '<div class="gary-section-title">Nos principes</div>';
  html += '<div class="gary-principles">';
  html += '<div class="gary-principle"><div class="gary-principle-title">' + ico('shield', 14, '#FF4539') + ' Transparence totale</div><div class="gary-principle-text">Vous savez toujours où en est votre dossier, quels sont les retours du marché, et pourquoi nous recommandons telle ou telle action.</div></div>';
  html += '<div class="gary-principle"><div class="gary-principle-title">' + ico('target', 14, '#FF4539') + ' Stratégie personnalisée</div><div class="gary-principle-text">Pas de formule toute faite. Chaque bien, chaque vendeur a ses particularités. Nous adaptons notre approche à votre situation.</div></div>';
  html += '<div class="gary-principle"><div class="gary-principle-title">' + ico('megaphone', 14, '#FF4539') + ' Visibilité maximale</div><div class="gary-principle-text">Avec plus de 6 millions de vues annuelles et une communauté de 40\'000 abonnés, nous donnons à votre bien l\'exposition qu\'il mérite.</div></div>';
  html += '</div>';
  html += '</div>';

  // Section Équipe
  html += '<div class="gary-section">';
  html += '<div class="gary-section-title">Notre équipe</div>';
  html += '<div class="gary-text">';
  html += '<p>Derrière GARY, il y a des <strong>professionnels passionnés</strong> : courtiers expérimentés, spécialistes en marketing digital, photographes, experts en négociation. Chacun apporte sa pierre à l\'édifice pour vous offrir un service complet.</p>';
  html += '</div>';
  html += '<div class="gary-roles">';
  html += '<div class="gary-role"><span class="gary-role-icon">' + ico('user', 12, '#FF4539') + '</span> Courtiers terrain</div>';
  html += '<div class="gary-role"><span class="gary-role-icon">' + ico('camera', 12, '#FF4539') + '</span> Photographes</div>';
  html += '<div class="gary-role"><span class="gary-role-icon">' + ico('share', 12, '#FF4539') + '</span> Marketing digital</div>';
  html += '<div class="gary-role"><span class="gary-role-icon">' + ico('file', 12, '#FF4539') + '</span> Administratif</div>';
  html += '</div>';
  html += '</div>';

  // Note
  html += '<div class="gary-note">';
  html += '<div class="gary-note-text">"Notre engagement est simple : vous accompagner de A à Z, avec honnêteté et professionnalisme. Pas de promesses irréalistes, mais des résultats concrets et un suivi rigoureux."</div>';
  html += '</div>';

  // Conclusion
  html += '<div class="gary-conclusion">';
  html += '<div class="gary-conclusion-text">Faire confiance à GARY, c\'est choisir une agence qui place votre intérêt au centre de chaque décision.</div>';
  html += '</div>';

  html += '</div>';

  // Footer
  html += '<div class="gary-footer">';
  html += getLogo('red', 18);
  html += '<div class="gary-footer-text">gary.immo • +41 22 518 77 77</div>';
  html += '</div>';

  html += '</div>';

  return html;
}
