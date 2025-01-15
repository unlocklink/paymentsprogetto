'use client';
import { useEffect, useState, useRef } from "react";
import { Inter } from 'next/font/google';
import { isIOS, isSafari, isChrome, isAndroid } from 'react-device-detect';
import { motion, AnimatePresence } from 'framer-motion';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [isCardInputActive, setIsCardInputActive] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [activeField, setActiveField] = useState('number'); // 'number', 'expiry', 'cvv', 'holder'
  const [cardType, setCardType] = useState<{ type: string; image: string; height: string } | null>(null);
  const [isExpiryValid, setIsExpiryValid] = useState(true);

  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const holderRef = useRef<HTMLInputElement>(null);
  const cardFormRef = useRef<HTMLDivElement>(null);

  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isGoogleDevice, setIsGoogleDevice] = useState(false);

  const [itemToRemove, setItemToRemove] = useState<{id: number; name: string} | null>(null);
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Medium Backpack",
      price: 1099.00,
      quantity: 1,
      description: "High-quality, durable and stylish backpack, perfect for daily use and outdoor adventures. Made with waterproof material, multiple compartments and comfortable straps.",
      image: "/backpack.jpg"
    },
    {
      id: 2,
      name: "Aluminium Case for iPhone 14 Pro Max",
      price: 401.00,
      quantity: 1,
      image: "/iphone-case.jpg"
    },
    // ... altri items
  ]);

  const [totalAmount, setTotalAmount] = useState(150.99);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsAppleDevice(/iphone|ipad|ipod/.test(userAgent));
    setIsGoogleDevice(/android/.test(userAgent) || (userAgent.includes('chrome') && !/iphone|ipad|ipod/.test(userAgent)));
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      // In sviluppo, usa la larghezza dello schermo per determinare se è mobile
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return window.innerWidth <= 768;
      }
      
      // In produzione, controlla il user agent
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|android|mobile|ipad|phone/.test(userAgent);
    };

    // Aggiungi listener per il resize della finestra
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };

    handleResize(); // Check iniziale
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Gestisce il blocco dello scroll
  useEffect(() => {
    if (isSliderOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isSliderOpen]);

  const handleCloseSlider = () => {
    setIsSliderOpen(false);
    setSliderPosition(0);
    setShowConfirmDialog(false);
    setShowItems(false);
    setSelectedPayment(null);
    setIsCardInputActive(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardHolder('');
    setCardType(null);
    setActiveField('number');
    
    // Reset showItems dopo che lo slider è completamente chiuso
    setTimeout(() => {
      setShowItems(false);
    }, 300); // Stesso tempo della transizione dello slider
  };

  const handleOverlayClick = () => {
    setShowConfirmDialog(true);
  };

  const handleDragStart = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    let currentPosition = 0;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      requestAnimationFrame(() => {
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        
        if (diff > 0) { // Solo movimento verso il basso
          currentPosition = diff;
          setSliderPosition(diff);
        }
      });
    };

    const handleTouchEnd = () => {
      if (currentPosition > window.innerHeight * 0.25) { // Se trascinato oltre il 25% dell'altezza dello schermo
        handleCloseSlider();
      } else {
        // Animazione fluida per tornare su
        requestAnimationFrame(() => {
          setSliderPosition(0);
        });
      }
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener('touchmove', handleTouchMove as unknown as EventListener);
      document.removeEventListener('touchend', handleTouchEnd as unknown as EventListener);
    };

    document.addEventListener('touchmove', handleTouchMove as unknown as EventListener, { passive: false } as AddEventListenerOptions);
    document.addEventListener('touchend', handleTouchEnd as unknown as EventListener);
  };

  const isCardComplete = () => {
    const isCvvComplete = cardType?.type === 'amex' 
      ? cardCvv.length === 4  // 4 numeri richiesti per Amex
      : cardCvv.length === 3; // 3 numeri per le altre carte

    return (
      cardNumber.replace(/\s/g, '').length === (cardType?.type === 'amex' ? 15 : 16) && // 15/16 numeri senza spazi
      cardExpiry.length === 5 && // MM/YY formato
      isCvvComplete && // Usa la nuova logica per il CVV
      cardHolder.trim().length > 0 // Nome titolare non vuoto
    );
  };

  const getCardType = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    
    // Visa
    if (cleanNumber.startsWith('4')) {
      return {
        type: 'visa',
        image: '/visa.png',
        height: 'h-2'
      };
    }
    
    // Mastercard
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
      return {
        type: 'mastercard',
        image: '/mastercard.png',
        height: 'h-4'
      };
    }
    
    // American Express
    if (/^3[47]/.test(cleanNumber)) {
      return {
        type: 'amex',
        image: '/amex.png',
        height: 'h-4'
      };
    }

    return null;
  };

  const getMaxLength = (type: string | undefined) => {
    switch (type) {
      case 'amex':
        return 17; // 15 numeri + 2 spazi
      default:
        return 19; // 16 numeri + 3 spazi
    }
  };

  // Aggiungi useEffect per gestire i cambi di activeField
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

  // Aggiungi un handler per i click fuori dal form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCardInputActive && 
          cardFormRef.current && 
          !cardFormRef.current.contains(event.target as Node)) {
        setIsCardInputActive(false);
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setCardHolder('');
        setCardType(null);
        setActiveField('number');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCardInputActive]);

  const validateExpiry = (value: string) => {
    if (value.length < 5) return true; // Non validare finché non è completo

    const [month, year] = value.split('/');
    const expMonth = parseInt(month);
    const expYear = parseInt('20' + year);

    // Validazione del mese (01-12)
    if (expMonth < 1 || expMonth > 12) {
      return false;
    }

    // Validazione dell'anno
    // Accetta solo anni tra 2025 e 2060
    if (expYear < 2025 || expYear > 2060) {
      return false;
    }
    
    return true;
  };

  const CvvIcon = () => (
    <svg className="h-6 w-6" focusable="false" viewBox="0 0 32 21" role="img" aria-label="CVC">
      <g fill="none" fillRule="evenodd">
        <g className="fill-gray-500">
          <g transform="translate(0 2)">
            <path d="M21.68 0H2c-.92 0-2 1.06-2 2v15c0 .94 1.08 2 2 2h25c.92 0 2-1.06 2-2V9.47a5.98 5.98 0 0 1-3 1.45V11c0 .66-.36 1-1 1H3c-.64 0-1-.34-1-1v-1c0-.66.36-1 1-1h17.53a5.98 5.98 0 0 1 1.15-9z" opacity=".2"/>
            <path d="M19.34 3H0v3h19.08a6.04 6.04 0 0 1 .26-3z" opacity=".3"/>
          </g>
          <g transform="translate(18)">
            <path d="M7 14A7 7 0 1 1 7 0a7 7 0 0 1 0 14zM4.22 4.1h-.79l-1.93.98v1l1.53-.8V9.9h1.2V4.1zm2.3.8c.57 0 .97.32.97.78 0 .5-.47.85-1.15.85h-.3v.85h.36c.72 0 1.21.36 1.21.88 0 .5-.48.84-1.16.84-.5 0-1-.16-1.52-.47v1c.56.24 1.12.37 1.67.37 1.31 0 2.21-.67 2.21-1.64 0-.68-.42-1.23-1.12-1.45.6-.2.99-.73.99-1.33C8.68 4.64 7.85 4 6.65 4a4 4 0 0 0-1.57.34v.98c.48-.27.97-.42 1.44-.42zm4.32 2.18c.73 0 1.24.43 1.24.99 0 .59-.51 1-1.24 1-.44 0-.9-.14-1.37-.43v1.03c.49.22.99.33 1.48.33.26 0 .5-.04.73-.1.52-.85.82-1.83.82-2.88l-.02-.42a2.3 2.3 0 0 0-1.23-.32c-.18 0-.37.01-.57.04v-1.3h1.44a5.62 5.62 0 0 0-.46-.92H9.64v3.15c.4-.1.8-.17 1.2-.17z"/>
          </g>
        </g>
      </g>
    </svg>
  );

  const handleRemoveItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    if (totalAmount === 150.99) {
      setTotalAmount(40.99);
    } else if (totalAmount === 40.99) {
      setTotalAmount(0);
    }
    setItemToRemove(null);
  };

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-lg">
          Questa applicazione è supportata solo su dispositivi mobili.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative">
      {/* Blur Overlay */}
      <div 
        className={`fixed inset-0 backdrop-blur-sm bg-black/30 transition-opacity duration-300 ${
          isSliderOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleOverlayClick}
      />

      {/* Slider Panel */}
      <div 
        className={`fixed inset-x-0 bottom-0 h-[50vh] bg-white rounded-t-3xl will-change-transform ${
          isSliderOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          transform: isSliderOpen ? `translateY(${sliderPosition}px)` : 'translateY(100%)',
          transition: sliderPosition === 0 ? 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
        }}
      >
        {/* Drag Handle */}
        <div 
          className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={handleDragStart}
        >
          <div className="w-20 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Logo Container with Text */}
        <div className="absolute left-3 sm:left-4 top-4 flex items-center">
          <a 
            href="https://www.google.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center"
          >
            <svg 
              width="28" 
              height="28" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
              className="sm:w-8 sm:h-8"
            >
              <path d="M23.766 12.2764c0-.9175-.07-1.7935-.2036-2.6376H12.24v4.9875h6.4576c-.2779 1.4976-1.1238 2.7674-2.3943 3.6192v3.0073h3.8806c2.2719-2.0946 3.5856-5.1757 3.5856-8.9764Z" fill="#4285F4"/>
              <path d="M12.2401 24c3.2446 0 5.9627-1.0738 7.9547-2.9031l-3.8806-3.0073c-1.0762.7219-2.4537 1.1476-4.0741 1.1476-3.1338 0-5.7882-2.1168-6.7369-4.9577H1.5258v3.1062C3.5064 21.2922 7.5828 24 12.2401 24Z" fill="#34A853"/>
              <path d="M5.5032 14.2369c-.2415-.7219-.3794-1.4938-.3794-2.2869 0-.7932.1379-1.5651.3794-2.287v-3.1062H1.525C.555 8.0693 0 10.0693 0 12.25c0 2.1807.555 4.1807 1.5258 5.9681l3.9774-3.1062Z" fill="#FBBC05"/>
              <path d="M12.2401 4.75c1.7683 0 3.3592.6062 4.6097 1.7956l3.4424-3.4425C18.2187 1.1894 15.5006 0 12.2401 0 7.5828 0 3.5064 2.7078 1.5258 6.5568L5.5032 9.663c.9487-2.8408 3.6031-4.913 6.7369-4.913Z" fill="#EA4335"/>
            </svg>
          </a>
          <div className="ml-2 sm:ml-3 flex flex-col">
            <span className="text-black text-xs sm:text-sm font-medium opacity-20">PAYMENT FOR</span>
            <span className="text-black text-xs sm:text-sm font-bold">GOOGLE LLC</span>
          </div>
        </div>

        {/* Close button */}
        <button 
          onClick={() => setShowConfirmDialog(true)}
          className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 z-50"
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 14 14" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <path 
              d="M1 1L13 13M1 13L13 1" 
              stroke="#666666" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Separator */}
        <div className="absolute left-4 right-4 top-[4.9rem]">
          <div className="w-full h-[1px] bg-black opacity-5 rounded-full"></div>
        </div>

        {/* Price Display con animazione */}
        <div className={`absolute left-4 right-4 top-24 flex justify-between items-center ${inter.className}`}>
          <motion.span 
            className="text-black text-2xl"
            layout
          >
            <span className="font-light tracking-tighter">€</span>
            <motion.span
              key={totalAmount}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="font-semibold ml-1.5"
            >
              {totalAmount.toFixed(2)}
            </motion.span>
          </motion.span>
          
          <div className="flex items-center bg-gray-100/50 px-2 py-1 rounded-lg text-xs cursor-pointer"
               onClick={() => setShowItems(!showItems)}>
            <span className="text-gray-500 mr-1.5">
              {cartItems.length} {cartItems.length === 1 ? 'ITEM' : 'ITEMS'}
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-500 ml-1.5 flex items-center">
              EUR
              <svg 
                className={`w-3 h-3 ml-0.5 transform transition-transform ${showItems ? 'rotate-180' : ''}`} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>

        {/* Second Separator with Shadow */}
        <div className="absolute left-0 right-0 top-36">
          <div className="w-full h-[1px] bg-black opacity-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"></div>
        </div>

        {/* Gray Background Content Area */}
        <div className="absolute left-0 right-0 top-36 bottom-0 bg-gray-100/80 overflow-hidden">
          <div className="h-full relative touch-none">
            {showConfirmDialog ? (
              // Confirm Dialog
              <div className="absolute inset-0 bg-white flex items-center justify-center">
                <div className="w-full px-6 text-center">
                  <p className="mb-6 text-black">Sei sicuro di voler uscire dal checkout?</p>
                  <div className="flex justify-center space-x-4">
                    <button 
                      onClick={() => {
                        setShowConfirmDialog(false);
                      }}
                      className="px-4 py-2 text-gray-600"
                    >
                      Annulla
                    </button>
                    <button 
                      onClick={handleCloseSlider}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                      Conferma
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Vista Items con transizione */}
                <div 
                  className={`absolute inset-0 transform transition-transform duration-300 ease-out ${
                    showItems ? 'translate-x-0' : 'translate-x-full'
                  }`}
                >
                  {/* Area scrollabile per gli items */}
                  <div className="absolute inset-0 overflow-y-auto overscroll-contain pb-24">
                    <div className="p-4 space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                          <div className="flex items-start space-x-4">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className={`${inter.className} text-base font-semibold text-gray-900`}>
                                    {item.name}
                                  </h3>
                                  <p className={`${inter.className} text-sm text-gray-500 mt-1`}>
                                    SR {item.price.toFixed(2)} x {item.quantity}
                                  </p>
                                  {item.description && (
                                    <p className={`${inter.className} text-xs text-gray-400 mt-1 leading-relaxed`}>
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <button 
                                  className="text-gray-400 p-1 hover:text-gray-600 transition-colors" 
                                  onClick={() => setItemToRemove({ id: item.id, name: item.name })}
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popup di conferma rimozione */}
                  {itemToRemove && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                        <h3 className={`${inter.className} text-lg font-semibold text-gray-900 mb-2`}>
                          Remove Item
                        </h3>
                        <p className={`${inter.className} text-sm text-gray-600 mb-6`}>
                          Are you sure you want to remove "{itemToRemove.name}" from your cart?
                        </p>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setItemToRemove(null)}
                            className={`${inter.className} flex-1 py-2.5 rounded-lg border border-gray-200 
                              text-gray-600 font-medium hover:bg-gray-50 transition-colors`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRemoveItem(itemToRemove.id)}
                            className={`${inter.className} flex-1 py-2.5 rounded-lg bg-red-500 
                              text-white font-medium hover:bg-red-600 transition-colors`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Floating Pay Now Button */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button 
                      onClick={() => setShowItems(false)}
                      className={`${inter.className} w-full py-3.5 rounded-lg font-medium bg-black text-white 
                        hover:bg-gray-900 transition-colors active:scale-[0.99] transform duration-100`}
                    >
                      Pay Now • €
                      <motion.span
                        key={totalAmount}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {totalAmount.toFixed(2)}
                      </motion.span>
                    </button>
                  </div>
                </div>

                {/* Vista Pagamenti con transizione */}
                <div 
                  className={`absolute inset-0 transform transition-transform duration-300 ease-out ${
                    showItems ? '-translate-x-full' : 'translate-x-0'
                  }`}
                >
                  <div className="p-4">
                    <div className="mt-2">
                      {/* Payment Methods */}
                      <div className="space-y-4">
                        {/* Payment Options */}
                        <div className="relative">
                          <div className={`relative transition-opacity duration-300 ${
                            isCardInputActive ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
                          }`}>
                            <div className="flex space-x-4 overflow-x-auto pb-4 
                              snap-x snap-mandatory touch-pan-x 
                              scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] 
                              [&::-webkit-scrollbar]:hidden"
                              style={{ scrollPaddingLeft: '16px' }}
                            >
                              {/* Apple Pay - mostrato solo su dispositivi Apple */}
                              {isAppleDevice && (
                                <div className="snap-center shrink-0">
                                  <button 
                                    className={`p-3 border rounded-lg flex items-center justify-center w-32 h-10 hover:border-gray-400 ${
                                      selectedPayment === 'applepay' ? 'bg-black' : 'bg-white'
                                    } group`}
                                    onClick={() => setSelectedPayment('applepay')}
                                  >
                                    <img 
                                      src="/apple-pay (2).svg" 
                                      alt="Apple Pay" 
                                      className={`h-8 ${selectedPayment === 'applepay' ? 'invert' : ''}`}
                                    />
                                  </button>
                                </div>
                              )}

                              {/* Google Pay - mostrato solo su dispositivi Google/Android */}
                              {isGoogleDevice && (
                                <div className="snap-center shrink-0">
                                  <button 
                                    className="p-3 border rounded-lg flex items-center justify-center w-44 h-10 
                                      bg-white hover:border-gray-400"
                                    onClick={() => setSelectedPayment('googlepay')}
                                  >
                                    <img 
                                      src="/googlepay.svg" 
                                      alt="Google Pay" 
                                      className="h-10"
                                    />
                                  </button>
                                </div>
                              )}

                              {/* Altri metodi di pagamento sempre visibili */}
                              <div className="snap-center shrink-0">
                                <button 
                                  className={`p-3 border rounded-lg flex items-center justify-center w-44 h-10 hover:border-gray-400 
                                    ${selectedPayment === 'paypal' ? 'bg-black' : 'bg-white shadow-sm'} group`}
                                  onClick={() => setSelectedPayment('paypal')}
                                >
                                  <img 
                                    src="/paypal.webp" 
                                    alt="PayPal" 
                                    className={`h-10 ${selectedPayment === 'paypal' ? 'brightness-0 invert' : ''}`}
                                  />
                                </button>
                              </div>
                              
                              {/* ... altri metodi di pagamento ... */}
                            </div>
                          </div>
                        </div>

                        {/* Card Input */}
                        <div ref={cardFormRef} className="space-y-2">
                          <p className={`text-xs text-gray-500 ${selectedPayment ? 'opacity-50' : ''}`}>OR ENTER CARD</p>
                          
                          <div className="relative">
                            <input 
                              type="text" 
                              inputMode="numeric" 
                              pattern="[0-9]*"
                              maxLength={getMaxLength(cardType?.type)}
                              placeholder="Card number"
                              className={`w-full p-3 border rounded-lg text-sm focus:outline-none pr-12
                                ${selectedPayment 
                                  ? 'bg-gray-100 border-gray-200 text-gray-400' 
                                  : 'border-gray-200 text-black focus:border-gray-400'
                                } placeholder:text-gray-400`}
                              value={cardNumber}
                              onChange={(e) => {
                                if (selectedPayment) return;
                                
                                let value = e.target.value.replace(/[^\d]/g, '');
                                let formattedValue = '';
                                
                                // Formattazione specifica per Amex (4-6-5)
                                if (cardType?.type === 'amex') {
                                  for (let i = 0; i < value.length; i++) {
                                    if (i === 4 || i === 10) {
                                      formattedValue += ' ';
                                    }
                                    formattedValue += value[i];
                                  }
                                } else {
                                  // Formattazione standard (4-4-4-4)
                                  for (let i = 0; i < value.length; i++) {
                                    if (i > 0 && i % 4 === 0) {
                                      formattedValue += ' ';
                                    }
                                    formattedValue += value[i];
                                  }
                                }
                                
                                setCardNumber(formattedValue);
                                setCardType(getCardType(formattedValue));
                                
                                // Passa al campo successivo quando il numero è completo
                                if (value.length === (cardType?.type === 'amex' ? 15 : 16)) {
                                  setActiveField('expiry');
                                }
                              }}
                            />
                            {/* Card Type Icon */}
                            {cardType && !selectedPayment && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <img 
                                  src={cardType.image}
                                  alt={cardType.type}
                                  className={cardType.height}
                                />
                              </div>
                            )}
                          </div>

                          {/* Expiry & CVV - nascosti se c'è un altro metodo di pagamento selezionato */}
                          {!selectedPayment && cardNumber.replace(/\s/g, '').length === (cardType?.type === 'amex' ? 15 : 16) && (
                            <div className="flex space-x-2">
                              <div className="relative flex-1">
                                <input 
                                  ref={expiryRef}
                                  type="text" 
                                  inputMode="numeric" 
                                  pattern="[0-9]*"
                                  maxLength={5}
                                  placeholder="MM/YY"
                                  className={`w-full p-3 border rounded-lg text-sm focus:outline-none ${
                                    !isExpiryValid 
                                      ? 'border-red-500 text-red-500' 
                                      : 'border-gray-200 text-black focus:border-gray-400'
                                  } placeholder:text-gray-400`}
                                  value={cardExpiry}
                                  onFocus={() => setActiveField('expiry')}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/[^\d]/g, '');
                                    let formattedValue = '';
                                    
                                    if (value.length >= 1) {
                                      formattedValue += value.substring(0, 2);
                                    }
                                    if (value.length >= 2) {
                                      formattedValue += '/' + value.substring(2);
                                    }
                                    
                                    setCardExpiry(formattedValue);
                                    const isValid = validateExpiry(formattedValue);
                                    setIsExpiryValid(isValid);
                                    
                                    // Passa automaticamente al CVV solo se la data è completa E valida
                                    if (value.length === 4 && isValid) {
                                      setActiveField('cvv');
                                      cvvRef.current?.focus();
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Backspace') {
                                      e.preventDefault();
                                      const numbers = cardExpiry.replace('/', '');
                                      const newNumbers = numbers.slice(0, -1);
                                      
                                      let formattedValue = '';
                                      if (newNumbers.length >= 1) {
                                        formattedValue += newNumbers.substring(0, 2);
                                      }
                                      if (newNumbers.length >= 2) {
                                        formattedValue += '/' + newNumbers.substring(2);
                                      }
                                      
                                      setCardExpiry(formattedValue);
                                      setIsExpiryValid(validateExpiry(formattedValue));
                                    }
                                  }}
                                />
                              </div>
                              <div className="relative flex-1">
                                <input 
                                  ref={cvvRef}
                                  type="text" 
                                  inputMode="numeric" 
                                  pattern="[0-9]*"
                                  maxLength={cardType?.type === 'amex' ? 4 : 3}
                                  placeholder="CVV"
                                  disabled={!isExpiryValid || cardExpiry.length < 5}
                                  className={`w-full p-3 border rounded-lg text-sm focus:outline-none pr-12
                                    ${!isExpiryValid || cardExpiry.length < 5 
                                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                                      : 'border-gray-200 text-black focus:border-gray-400'
                                    } placeholder:text-gray-400`}
                                  value={cardCvv}
                                  onFocus={() => isExpiryValid && cardExpiry.length === 5 && setActiveField('cvv')}
                                  onChange={(e) => {
                                    if (!isExpiryValid || cardExpiry.length < 5) return;
                                    
                                    let value = e.target.value.replace(/[^\d]/g, '');
                                    setCardCvv(value);
                                    
                                    // Per Amex, passa al campo successivo solo con 4 cifre
                                    if (cardType?.type === 'amex' && value.length === 4) {
                                      setActiveField('holder');
                                    }
                                    // Per le altre carte, passa al campo successivo con 3 cifre
                                    else if (cardType?.type !== 'amex' && value.length === 3) {
                                      setActiveField('holder');
                                    }
                                  }}
                                />
                                {/* CVV Icon */}
                                {(activeField === 'cvv' || cardCvv.length > 0) && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <CvvIcon />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Card Holder - mostra solo quando il CVV è completo */}
                          {!selectedPayment && ((cardType?.type === 'amex' && cardCvv.length === 4) || 
                            (cardType?.type !== 'amex' && cardCvv.length === 3)) && (
                            <input 
                              ref={holderRef}
                              type="text" 
                              placeholder="Card Holder Name"
                              className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:border-gray-400 text-black placeholder:text-gray-400"
                              value={cardHolder}
                              onFocus={() => setActiveField('holder')}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                                value = value.toUpperCase();
                                setCardHolder(value);
                              }}
                            />
                          )}
                        </div>

                        {/* Accepted Cards */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-gray-500">ACCETTIAMO</p>
                            <div className="flex space-x-2">
                              <img src="/visa.png" alt="Visa" className="h-2" />
                              <img src="/mastercard.png" alt="Mastercard" className="h-2" />
                              <img src="/amex.png" alt="American Express" className="h-2" />
                              <img src="/sepa.png" alt="Sepa Bonifico Bancario" className="h-2" />
                            </div>
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button 
                          className={`w-full py-3 rounded-lg font-medium transition-colors ${
                            selectedPayment || isCardComplete()
                              ? selectedPayment === 'paypal'
                                ? 'bg-[#0070ba] text-white hover:bg-[#003087]'
                                : 'bg-black text-white hover:bg-gray-900'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-40'
                          }`}
                          disabled={!selectedPayment && !isCardComplete()}
                          onClick={() => {
                            if (selectedPayment) {
                              console.log(`Processing payment with ${selectedPayment}`);
                            } else if (isCardComplete()) {
                              console.log('Processing card payment', {
                                number: cardNumber,
                                expiry: cardExpiry,
                                cvv: cardCvv,
                                holder: cardHolder
                              });
                            }
                          }}
                        >
                          {selectedPayment === 'paypal' 
                            ? 'Paga con PayPal' 
                            : selectedPayment === 'applepay'
                              ? 'Paga con Apple Pay'
                              : 'Pay now'
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main button */}
      <div className="absolute top-1/3 transform -translate-y-1/2 z-10">
        <button 
          onClick={() => setIsSliderOpen(true)} 
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md active:scale-95 transition-transform"
        >
          Clicca Qui
        </button>
      </div>
    </div>
  );
}
