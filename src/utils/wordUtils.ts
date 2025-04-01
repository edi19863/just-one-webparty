
/**
 * Funzione per verificare se una parola condivide la stessa radice o desinenza
 * con una parola data
 */
export const checkWordSimilarity = (word1: string, word2: string): boolean => {
  // Converti in minuscolo per confronto case-insensitive
  const w1 = word1.toLowerCase();
  const w2 = word2.toLowerCase();
  
  // Se le parole sono identiche o una è vuota
  if (w1 === w2 || !w1 || !w2) {
    return true;
  }
  
  // Trova la lunghezza minima tra le due parole
  const minLength = Math.min(w1.length, w2.length);
  
  // Controllo radice (prefisso comune)
  // Consideriamo una radice comune se condividono almeno 4 caratteri iniziali
  const prefixLength = 4;
  if (minLength >= prefixLength) {
    const prefix1 = w1.substring(0, prefixLength);
    const prefix2 = w2.substring(0, prefixLength);
    if (prefix1 === prefix2) {
      return true;
    }
  }
  
  // Controllo desinenza (suffisso comune)
  // Consideriamo una desinenza comune se condividono almeno 3 caratteri finali
  const suffixLength = 3;
  if (minLength >= suffixLength) {
    const suffix1 = w1.substring(w1.length - suffixLength);
    const suffix2 = w2.substring(w2.length - suffixLength);
    if (suffix1 === suffix2) {
      return true;
    }
  }
  
  return false;
};

/**
 * Funzione per verificare se una parola condivide la stessa radice o desinenza
 * con qualsiasi parola in un array
 */
export const isWordSimilarToAny = (word: string, wordList: string[]): boolean => {
  return wordList.some(existingWord => checkWordSimilarity(word, existingWord));
};
