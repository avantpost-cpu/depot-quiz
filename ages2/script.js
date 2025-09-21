<script>
document.getElementsByTagName("h1")[0].style.fontSize = "6vw";

const pieces = document.querySelectorAll('.piece');
const texteDiv = document.getElementById('texteAffiche');

pieces.forEach(piece => {
  piece.addEventListener('mouseenter', () => {
    // Masquer les autres pièces
    pieces.forEach(p => { if(p!==piece) p.style.opacity = '0'; });
    // Afficher le texte
    texteDiv.innerHTML = piece.getAttribute('data-text');
    const rect = piece.getBoundingClientRect();

    // Si c'est la pièce "Petite enfance", placer le texte à droite
    if(piece.textContent.trim() === "Petite enfance") {
      texteDiv.style.left = (rect.right + 10) + 'px';
    } else {
      // Pour les autres pièces, texte à gauche
      texteDiv.style.left = (rect.left - 320) + 'px';
    }

    texteDiv.style.top = rect.top + 'px';
    texteDiv.style.display = 'block';
  });

  piece.addEventListener('mouseleave', () => {
    pieces.forEach(p => p.style.opacity = '1');
    texteDiv.style.display = 'none';
  });
});
</script>
