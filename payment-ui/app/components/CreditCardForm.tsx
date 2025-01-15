import { useState, useRef, useEffect } from 'react';
import { PaymentFormData, CardType } from '../types/payment';
import { formatCardNumber, validateExpiry, getCardType } from '../utils/paymentHelpers';

interface CreditCardFormProps {
  onSubmit: (formData: PaymentFormData) => void;
  onCancel: () => void;
}

export const CreditCardForm = ({ onSubmit, onCancel }: CreditCardFormProps) => {
  // Form state
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardHolder: '',
    customerEmail: ''
  });

  // UI state
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [isExpiryValid, setIsExpiryValid] = useState(true);
  const [activeField, setActiveField] = useState<'number' | 'expiry' | 'cvv' | 'holder'>('number');

  // Refs per focus management
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const holderRef = useRef<HTMLInputElement>(null);

  // Gestione del cambio campo attivo
  useEffect(() => {
    switch (activeField) {
      case 'expiry':
        expiryRef.current?.focus();
        break;
      case 'cvv':
        cvvRef.current?.focus();
        break;
      case 'holder':
        holderRef.current?.focus();
        break;
    }
  }, [activeField]);

  // Handlers
  const handleCardNumberChange = (value: string) => {
    const formattedNumber = formatCardNumber(value);
    setFormData(prev => ({ ...prev, cardNumber: formattedNumber }));
    setCardType(getCardType(formattedNumber));

    // Auto-advance to expiry when card number is complete
    if (formattedNumber.replace(/\s/g, '').length === 16) {
      setActiveField('expiry');
    }
  };

  const handleExpiryChange = (value: string) => {
    let formattedValue = value.replace(/\D/g, '');
    if (formattedValue.length >= 2) {
      formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
    }
    
    setFormData(prev => ({ ...prev, cardExpiry: formattedValue }));
    setIsExpiryValid(validateExpiry(formattedValue));

    // Auto-advance to CVV when expiry is complete and valid
    if (formattedValue.length === 5 && validateExpiry(formattedValue)) {
      setActiveField('cvv');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="credit-card-form">
      {/* Card Number Field */}
      <div className="form-field">
        <input
          type="text"
          inputMode="numeric"
          maxLength={19}
          placeholder="Numero carta"
          value={formData.cardNumber}
          onChange={(e) => handleCardNumberChange(e.target.value)}
          className="card-input"
        />
        {cardType && (
          <img
            src={cardType.image}
            alt={cardType.type}
            className="card-type-icon"
          />
        )}
      </div>

      {/* Expiry & CVV Row */}
      <div className="form-row">
        <div className="form-field half-width">
          <input
            ref={expiryRef}
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="MM/YY"
            value={formData.cardExpiry}
            onChange={(e) => handleExpiryChange(e.target.value)}
            className={`expiry-input ${!isExpiryValid ? 'invalid' : ''}`}
          />
        </div>
        <div className="form-field half-width">
          <input
            ref={cvvRef}
            type="text"
            inputMode="numeric"
            maxLength={3}
            placeholder="CVV"
            value={formData.cardCvv}
            onChange={(e) => setFormData(prev => ({ ...prev, cardCvv: e.target.value }))}
            className="cvv-input"
          />
        </div>
      </div>

      {/* Card Holder Field */}
      <div className="form-field">
        <input
          ref={holderRef}
          type="text"
          placeholder="Titolare carta"
          value={formData.cardHolder}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            cardHolder: e.target.value.toUpperCase() 
          }))}
          className="holder-input"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isExpiryValid || !formData.cardNumber || !formData.cardCvv || !formData.cardHolder}
        className="submit-button"
      >
        Conferma pagamento
      </button>
    </form>
  );
}; 