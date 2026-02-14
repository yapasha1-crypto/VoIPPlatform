import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Lock, AlertCircle, Check, Loader } from 'lucide-react';
import api from '../services/api';

// Initialize Stripe with publishable key from environment variable
// If not set, falls back to placeholder (won't work until you add your real key)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
const stripePromise = loadStripe(stripePublishableKey);

// Card Element styling to match luxurious design
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
      iconColor: '#3b82f6',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
};

// Payment Form Component (uses Stripe hooks)
const PaymentForm = ({ amount, onSuccess, onError, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  // Fetch payment intent when amount changes
  useEffect(() => {
    if (amount > 0) {
      fetchPaymentIntent();
    }
  }, [amount]);

  const fetchPaymentIntent = async () => {
    try {
      setError(null);
      const response = await api.post('/payments/stripe/create-intent', {
        amount: parseFloat(amount),
        currency: 'USD'
      });
      setPaymentDetails(response.data);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError('Failed to initialize payment. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !paymentDetails) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentDetails.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
      onError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Summary */}
      {paymentDetails && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Amount:</span>
              <span className="font-semibold text-gray-900">${paymentDetails.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({paymentDetails.taxType}):</span>
              <span className="font-semibold text-gray-900">${paymentDetails.taxAmount.toFixed(2)}</span>
            </div>
            <div className="h-px bg-blue-200"></div>
            <div className="flex justify-between text-base">
              <span className="font-bold text-gray-900">Total to Pay:</span>
              <span className="font-bold text-blue-600 text-lg">${paymentDetails.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Card Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Your payment is secure and encrypted
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || processing || !paymentDetails}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Pay ${paymentDetails ? paymentDetails.totalAmount.toFixed(2) : '0.00'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      {/* Test Card Info (only show in development) */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
        <strong>Test Mode:</strong> Use card <code className="bg-yellow-100 px-1.5 py-0.5 rounded font-mono">4242 4242 4242 4242</code>,
        any future exp date, any CVC
      </div>
    </form>
  );
};

// Main Modal Component
const StripePaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'payment', 'success'
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setStep('input');
      setError(null);
      setSuccessData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than $0');
      return;
    }

    if (numAmount > 10000) {
      setError('Maximum top-up amount is $10,000');
      return;
    }

    setError(null);
    setStep('payment');
  };

  const handlePaymentSuccess = (paymentIntent) => {
    setSuccessData(paymentIntent);
    setStep('success');

    // Auto-close and refresh after 3 seconds
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 3000);
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleBack = () => {
    setStep('input');
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Top Up Wallet</h2>
              <p className="text-blue-100 text-sm">Add funds securely with Stripe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={step === 'payment'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' && (
            <form onSubmit={handleAmountSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Amount to Top Up
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 text-lg font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Minimum: $0.01 • Maximum: $10,000
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Continue to Payment
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {step === 'payment' && (
            <Elements stripe={stripePromise}>
              <div className="space-y-4">
                <button
                  onClick={handleBack}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Change Amount
                </button>
                <PaymentForm
                  amount={amount}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onClose={onClose}
                />
              </div>
            </Elements>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
                <p className="text-gray-600 mt-2">
                  Your wallet has been topped up successfully.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Invoice will be generated shortly.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripePaymentModal;
