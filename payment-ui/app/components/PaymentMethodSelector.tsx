// Componente per la selezione del metodo di pagamento
import { useState } from 'react';
import { SavedCard } from '../types/payment';

interface PaymentMethodSelectorProps {
  savedCards: SavedCard[];
  isApplePayAvailable: boolean;
  isGooglePayAvailable: boolean;
  onSelectPayment: (method: string) => void;
}

export const PaymentMethodSelector = ({
  savedCards,
  isApplePayAvailable,
  isGooglePayAvailable,
  onSelectPayment
}: PaymentMethodSelectorProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    onSelectPayment(method);
  };

  return (
    <div className="payment-methods-container">
      {/* Carte salvate */}
      {savedCards.length > 0 && (
        <div className="saved-cards-section">
          <h3 className="text-sm font-medium mb-2">Le tue carte salvate</h3>
          {savedCards.map((card) => (
            <div 
              key={card.id}
              className={`saved-card-item ${selectedMethod === card.id ? 'selected' : ''}`}
              onClick={() => handleMethodSelect(card.id)}
            >
              <img 
                src={`/${card.card.brand}.png`}
                alt={card.card.brand}
                className="card-brand-icon"
              />
              <span>•••• {card.card.last4}</span>
            </div>
          ))}
        </div>
      )}

      {/* Digital Wallets */}
      <div className="digital-wallets-section">
        {isApplePayAvailable && (
          <button 
            className="wallet-button apple-pay"
            onClick={() => handleMethodSelect('apple_pay')}
          >
            <img src="/apple-pay.svg" alt="Apple Pay" />
          </button>
        )}

        {isGooglePayAvailable && (
          <button 
            className="wallet-button google-pay"
            onClick={() => handleMethodSelect('google_pay')}
          >
            <img src="/google-pay.svg" alt="Google Pay" />
          </button>
        )}

        <button 
          className="wallet-button paypal"
          onClick={() => handleMethodSelect('paypal')}
        >
          <img src="/paypal.svg" alt="PayPal" />
        </button>
      </div>
    </div>
  );
}; 