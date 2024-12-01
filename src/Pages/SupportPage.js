import React, { useState } from 'react';
import { DollarSign, CreditCard, QrCode, Send, Copy } from 'lucide-react';
import Footer from '../Component/Footer';
import Navbar from '../Component/Navbar';

const SupportPage = () => {
  const [activeMethod, setActiveMethod] = useState('');
  const [copied, setCopied] = useState(false);

  const paymentMethods = [
    {
      name: 'PayPal',
      icon: <DollarSign className="w-6 h-6" />,
      link: 'https://paypal.me/yourUsername',
      description: 'Quick and secure online payments'
    },
    {
      name: 'Stripe',
      icon: <CreditCard className="w-6 h-6" />,
      link: 'https://buy.stripe.com/yourlink',
      description: 'Credit/Debit card payments'
    },
    {
      name: 'Crypto',
      icon: <QrCode className="w-6 h-6" />,
      wallets: {
        Bitcoin: 'bc1qexample123wallet',
        Ethereum: '0xExampleEthereumWallet',
        USDT: 'TExampleTetherWallet'
      },
      description: 'Cryptocurrencies accepted'
    }
  ];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
    <Navbar/>
     <div className="max-h-full bg-gray-100 pt-48  pb-16 flex flex-col items-center">
      <div className="w-full max-w-max bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Support Our Work
        </h1>
        
        <p className="text-center text-gray-600 mb-8">
          Your support helps us continue creating amazing content and services.
          Choose from multiple payment methods below.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {paymentMethods.map((method) => (
            <div 
              key={method.name}
              className={`
                border rounded-lg p-6 text-center cursor-pointer transition-all
                ${activeMethod === method.name 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-blue-300'}
              `}
              onClick={() => setActiveMethod(method.name)}
            >
              <div className="flex justify-center mb-4 text-blue-600">
                {method.icon}
              </div>
              <h2 className="font-semibold text-lg mb-2">{method.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{method.description}</p>
            </div>
          ))}
        </div>

        {activeMethod === 'Crypto' && (
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Cryptocurrency Wallets</h3>
            {Object.entries(paymentMethods.find(m => m.name === 'Crypto').wallets).map(([coin, address]) => (
              <div 
                key={coin} 
                className="flex items-center justify-between bg-white p-4 rounded-md mb-4 shadow-sm"
              >
                <div>
                  <p className="font-medium">{coin} Wallet</p>
                  <p className="text-sm text-gray-500 truncate max-w-md">{address}</p>
                </div>
                <button 
                  onClick={() => handleCopy(address)}
                  className="ml-4 p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                >
                  {copied ? 'Copied!' : <Copy className="w-5 h-5" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {(activeMethod === 'PayPal' || activeMethod === 'Stripe') && (
          <div className="mt-8 text-center">
            <a 
              href={paymentMethods.find(m => m.name === activeMethod).link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="mr-2 w-5 h-5" />
              Support via {activeMethod}
            </a>
          </div>
        )}
      </div>
    </div>
    <Footer/>
    </>
   
  );
};

export default SupportPage;