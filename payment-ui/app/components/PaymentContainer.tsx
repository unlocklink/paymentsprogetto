import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { getCookie, setCookie } from 'cookies-next';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CreditCardForm } from './CreditCardForm';
import { SavedCard, PaymentFormData } from '../types/payment';

// Inizializza Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const PaymentContainer = () => {
  // Stati per la gestione dei pagamenti
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stati per la detection del dispositivo
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false);

  // Carica le carte salvate all'avvio
  useEffect(() => {
    const loadSavedPaymentMethods = async () => {
      const customerId = getCookie('stripe_customer_id');
      if (!customerId) return;

      try {
        const response = await fetch('/api/get-payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId }),
        });
        
        const { paymentMethods } = await response.json();
        setSavedCards(paymentMethods);
      } catch (err) {
        console.error('Errore nel caricamento delle carte salvate:', err);
        setError('Impossibile caricare le carte salvate');
      }
    };

    loadSavedPaymentMethods();
    detectPaymentCapabilities();
  }, []);

  // Rileva le capacità di pagamento del dispositivo
  const detectPaymentCapabilities = async () => {
    // Detect Apple Pay
    const applePayAvailable = typeof window !== 'undefined' && 
      'ApplePaySession' in window && 
      ApplePaySession?.canMakePayments?.();
    setIsApplePayAvailable(!!applePayAvailable);

    // Detect Google Pay
    const googlePayAvailable = /Android/i.test(navigator.userAgent) && 
      /Chrome/i.test(navigator.userAgent);
    setIsGooglePayAvailable(googlePayAvailable);
  };

  // Gestione del pagamento con carta
  const handleCardPayment = async (formData: PaymentFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe non inizializzato');

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: {
          number: formData.cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(formData.cardExpiry.split('/')[0]),
          exp_year: parseInt('20' + formData.cardExpiry.split('/')[1]),
          cvc: formData.cardCvv,
        },
        billing_details: {
          name: formData.cardHolder,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Errore durante la creazione del payment method');
      }

      if (!paymentMethod) {
        throw new Error('Payment method non creato');
      }

      await processPayment(paymentMethod.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il pagamento');
      console.error('Errore pagamento:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Processo di pagamento generico
  const processPayment = async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentMethodId,
          amount: 1000, // €10.00
          currency: 'eur'
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Gestione successo
      console.log('Pagamento completato con successo!');
      
    } catch (err: any) {
      setError(err.message || 'Errore durante il pagamento');
    }
  };

  return (
    <div className="payment-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <PaymentMethodSelector
        savedCards={savedCards}
        isApplePayAvailable={isApplePayAvailable}
        isGooglePayAvailable={isGooglePayAvailable}
        onSelectPayment={setSelectedPaymentMethod}
      />

      {!selectedPaymentMethod && (
        <CreditCardForm
          onSubmit={handleCardPayment}
          onCancel={() => setSelectedPaymentMethod('')}
        />
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Elaborazione pagamento in corso...</p>
        </div>
      )}
    </div>
  );
}; 