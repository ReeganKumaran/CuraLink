import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, User, MapPin, Activity, ArrowRight, ArrowLeft, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { logo } from '../assets/assets';
import authService from '../services/authService';

const PatientOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [theme, setTheme] = useState('light');
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    condition: '',
    symptoms: '',
    location: '',
    city: '',
    country: '',
  });

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleNext = async () => {
    setError('');

    if (step < 3) {
      setStep(step + 1);
    } else {
      // Register user with backend
      setLoading(true);
      try {
        await authService.register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'patient',
          condition: formData.condition,
          symptoms: formData.symptoms,
          city: formData.city,
          country: formData.country
        });

        // Navigate to dashboard after successful registration
        navigate('/patient/dashboard');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';

        // Check if user already exists
        if (errorMsg.includes('already exists')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(errorMsg);
        }
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const inputClasses = clsx(
    'w-full rounded-xl px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2',
    isDark
      ? 'border border-white/15 bg-white/10 text-white placeholder:text-white/50 focus:border-primary-300 focus:ring-primary-300/50'
      : 'border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:ring-primary-400/40'
  );

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.name &&
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          formData.password.length >= 6
        );
      case 2:
        return formData.condition || formData.symptoms;
      case 3:
        return formData.city && formData.country;
      default:
        return false;
    }
  };

  return (
    <div className={clsx(
      'min-h-screen transition-colors duration-500',
      isDark
        ? 'bg-[#0b0a1b] text-white'
        : 'bg-gradient-to-br from-primary-50 to-white'
    )}>
      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className={clsx(
          'fixed right-6 top-6 z-40 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition-colors duration-300',
          isDark
            ? 'border-white/20 bg-white/10 text-white/80 hover:bg-white/15'
            : 'border-slate-300 bg-white/80 text-slate-700 hover:bg-white'
        )}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-primary-200" />
        ) : (
          <Moon className="h-4 w-4 text-primary-500" />
        )}
        {isDark ? 'Light' : 'Dark'}
      </button>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <img src={logo} alt="CuraLink Logo" className="h-10" />
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={clsx('text-sm', isDark ? 'text-white/70' : 'text-gray-600')}>Step {step} of 3</span>
            <span className={clsx('text-sm', isDark ? 'text-white/70' : 'text-gray-600')}>{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <div className={clsx('w-full rounded-full h-2', isDark ? 'bg-white/10' : 'bg-gray-200')}>
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <div className={clsx(
          'max-w-2xl mx-auto rounded-xl shadow-lg p-8 transition-colors duration-300',
          isDark
            ? 'bg-white/10 border border-white/15 backdrop-blur-xl'
            : 'bg-white'
        )}>
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <User className={clsx('w-6 h-6 mr-3', isDark ? 'text-primary-300' : 'text-primary-600')} />
                <h2 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Personal Information</h2>
              </div>
              <p className={clsx('mb-6', isDark ? 'text-white/70' : 'text-gray-600')}>
                Let's start with some basic information about you
              </p>
              <div className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={clsx(
                      'w-full rounded-xl px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2',
                      isDark
                        ? 'border border-white/15 bg-white/10 text-white placeholder:text-white/50 focus:border-primary-300 focus:ring-primary-300/50'
                        : 'border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:ring-primary-400/40'
                    )}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={clsx(
                      'w-full rounded-xl px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2',
                      isDark
                        ? 'border border-white/15 bg-white/10 text-white placeholder:text-white/50 focus:border-primary-300 focus:ring-primary-300/50'
                        : 'border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:ring-primary-400/40'
                    )}
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`${inputClasses} pr-12`}
                      placeholder="Create a password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={clsx(
                        'absolute right-3 top-1/2 -translate-y-1/2 transition-colors',
                        isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password && formData.password.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
                  )}
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`${inputClasses} pr-12`}
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={clsx(
                        'absolute right-3 top-1/2 -translate-y-1/2 transition-colors',
                        isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                  {error.includes('already registered') && (
                    <div className="mt-2">
                      <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium underline">
                        Click here to sign in →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <Activity className={clsx('w-6 h-6 mr-3', isDark ? 'text-primary-300' : 'text-primary-600')} />
                <h2 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Medical Information</h2>
              </div>
              <p className={clsx('mb-6', isDark ? 'text-white/70' : 'text-gray-600')}>
                Help us understand your medical needs. You can describe in natural language.
              </p>
              <div className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Medical Condition
                  </label>
                  <input
                    type="text"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="e.g., Brain Cancer, Glioma, Lung Cancer"
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Describe Your Symptoms (Natural Language)
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    rows={4}
                    className={inputClasses}
                    placeholder="e.g., I have been experiencing headaches and dizziness for the past 3 months..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <MapPin className={clsx('w-6 h-6 mr-3', isDark ? 'text-primary-300' : 'text-primary-600')} />
                <h2 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Location Information</h2>
              </div>
              <p className={clsx('mb-6', isDark ? 'text-white/70' : 'text-gray-600')}>
                Your location helps us find nearby clinical trials and health experts
              </p>
              <div className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Enter your country"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              className={clsx(
                'flex items-center px-6 py-3 transition-colors',
                isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Back to Home' : 'Previous'}
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className={clsx(
                'flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200',
                isStepValid() && !loading
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
                  : isDark
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  {step === 3 ? 'Complete Setup' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>

          {/* Already have account link */}
          <div className="mt-6 text-center">
            <p className={clsx('text-sm', isDark ? 'text-white/70' : 'text-gray-600')}>
              Already have an account?{' '}
              <Link to="/login" className={clsx(
                'font-medium',
                isDark ? 'text-primary-300 hover:text-primary-200' : 'text-primary-600 hover:text-primary-700'
              )}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientOnboarding;