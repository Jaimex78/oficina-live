/* Pone el tema antes de pintar, para que no parpadee el claro cuando la persona eligió luces apagadas. */
(function () {
  try {
    var guardado = localStorage.getItem('ol_tema');
    var oscuro = guardado === 'oscuro' || (guardado !== 'claro' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro';
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.dataset.tema = 'claro';
  }
})();
