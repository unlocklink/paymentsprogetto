// Definizione dei tipi per i pagamenti
export interface SavedCard {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface PaymentFormData {
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardHolder: string;
  customerEmail: string;
}

export interface CardType {
  type: string;
  image: string;
} 