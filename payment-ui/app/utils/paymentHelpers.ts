// Utility functions per i pagamenti
export const formatCardNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const groups = numbers.match(/.{1,4}/g) || [];
  return groups.join(' ');
};

export const validateExpiry = (value: string): boolean => {
  if (value.length < 5) return true;

  const [month, year] = value.split('/');
  const expMonth = parseInt(month);
  const expYear = parseInt('20' + year);

  // Validazione mese (01-12)
  if (expMonth < 1 || expMonth > 12) return false;

  // Validazione anno (2025-2035)
  if (expYear < 2025 || expYear > 2035) return false;

  return true;
};

export const getCardType = (number: string): { type: string; image: string } | null => {
  const cleanNumber = number.replace(/\s/g, '');
  
  if (cleanNumber.startsWith('4')) {
    return { type: 'visa', image: '/visa.png' };
  }
  
  if (/^5[1-5]/.test(cleanNumber)) {
    return { type: 'mastercard', image: '/mastercard.png' };
  }
  
  if (/^3[47]/.test(cleanNumber)) {
    return { type: 'amex', image: '/amex.png' };
  }

  return null;
}; 