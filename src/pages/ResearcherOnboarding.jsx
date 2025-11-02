import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, BookOpen, Link, Calendar, ArrowRight, ArrowLeft, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { logo } from '../assets/assets';
import authService from '../services/authService';

const ResearcherOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState('light');
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    specialties: '',
    researchInterests: '',
    orcid: '',
    researchGate: '',
    availableForMeetings: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const inputClasses = clsx(
    'w-full rounded-xl px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2',
    isDark
      ? 'border border-white/15 bg-white/10 text-white placeholder:text-white/50 focus:border-primary-300 focus:ring-primary-300/50'
      : 'border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:ring-primary-400/40'
  );

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Register the user
      setLoading(true);
      setError('');

      try {
        const userData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'researcher',
          institution: formData.institution,
          specialties: formData.specialties,
          researchInterests: formData.researchInterests,
          orcid: formData.orcid,
          researchGate: formData.researchGate,
          availableForMeetings: formData.availableForMeetings,
        };

        await authService.register(userData);
        navigate('/researcher/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
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

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.name &&
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          formData.password.length >= 6 &&
          formData.institution
        );
      case 2:
        return formData.specialties && formData.researchInterests;
      case 3:
        return true; // Optional step
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
                <h2 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Professional Information</h2>
              </div>
              <p className={clsx('mb-6', isDark ? 'text-white/70' : 'text-gray-600')}>
                Tell us about your professional background
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
                    className={inputClasses}
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Professional Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="john.smith@university.edu"
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
                      placeholder="At least 6 characters"
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
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Institution/Organization *
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Harvard Medical School"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <BookOpen className={clsx('w-6 h-6 mr-3', isDark ? 'text-primary-300' : 'text-primary-600')} />
                <h2 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Research Expertise</h2>
              </div>
              <p className={clsx('mb-6', isDark ? 'text-white/70' : 'text-gray-600')}>
                Share your areas of expertise and research interests
              </p>
              <div className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Specialties *
                  </label>
                  <input
                    type="text"
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="e.g., Oncology, Neurology, Immunology"
                  />
                  <p className={clsx('text-xs mt-1', isDark ? 'text-white/50' : 'text-gray-500')}>Separate multiple specialties with commas</p>
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    Research Interests *
                  </label>
                  <textarea
                    name="researchInterests"
                    value={formData.researchInterests}
                    onChange={handleInputChange}
                    rows={4}
                    className={inputClasses}
                    placeholder="e.g., Immunotherapy, Clinical AI, Gene Therapy, Cancer Research"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <Link className={clsx('w-6 h-6 mr-3', isDark ? 'text-primary-300' : 'text-primary-600')} />
                <h2 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>Professional Links</h2>
              </div>
              <p className={clsx('mb-6', isDark ? 'text-white/70' : 'text-gray-600')}>
                Optional: Connect your professional profiles to auto-import publications
              </p>
              <div className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    ORCID ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="orcid"
                    value={formData.orcid}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="0000-0000-0000-0000"
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-white/80' : 'text-gray-700')}>
                    ResearchGate Profile (Optional)
                  </label>
                  <input
                    type="text"
                    name="researchGate"
                    value={formData.researchGate}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="https://www.researchgate.net/profile/..."
                  />
                </div>
                <div className={clsx('rounded-lg p-4 mt-6', isDark ? 'bg-white/5' : 'bg-gray-50')}>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="availableForMeetings"
                      checked={formData.availableForMeetings}
                      onChange={handleInputChange}
                      className="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className={clsx('text-sm font-medium', isDark ? 'text-white/80' : 'text-gray-700')}>
                        Available for Meetings
                      </span>
                      <p className={clsx('text-xs mt-1', isDark ? 'text-white/50' : 'text-gray-500')}>
                        Allow patients and other researchers to request meetings with you
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={clsx(
              'mt-6 px-4 py-3 rounded-lg text-sm border',
              isDark
                ? 'bg-red-500/10 border-red-400/40 text-red-200'
                : 'bg-red-50 border-red-200 text-red-700'
            )}>
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={loading}
              className={clsx(
                'flex items-center px-6 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
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
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
        </div>
      </div>
    </div>
  );
};

export default ResearcherOnboarding;