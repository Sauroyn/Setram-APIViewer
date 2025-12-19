export const getLineInfo = (routeId?: string) => {
  if (!routeId) return { color: '#333333', text: '?' };
  
  // Normalisation de l'ID (suppression des zéros initiaux si nécessaire)
  const id = routeId.replace(/^0+/, '');
  
  // Couleurs officielles (approximatives)
  const colors: Record<string, string> = {
    'T1': '#e20613', // Rouge T1
    'T2': '#009ee0', // Bleu T2
    'T3': '#80c342', // Vert T3 (Tempo)
    '1': '#e20613',  // T1 (parfois juste 1)
    '2': '#009ee0',  // T2 (parfois juste 2)
    '3': '#80c342',  // T3 (parfois juste 3)
  };

  if (colors[id]) {
    return { color: colors[id], text: id.startsWith('T') ? id : `T${id}` }; // Ajouter T si c'est un tram
  }

  // Pour les bus ou autres lignes inconnues, on génère une couleur basée sur l'ID
  // ou on utilise une couleur par défaut pour les bus
  return { color: '#f59e0b', text: id }; // Orange par défaut pour les bus
};
