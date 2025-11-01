import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, BookOpen, Link, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { logo } from '../assets/assets';

const ResearcherOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    specialties: '',
    researchInterests: '',
    orcid: '',
    researchGate: '',
    availableForMeetings: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save data and navigate to dashboard
      localStorage.setItem('researcherProfile', JSON.stringify(formData));
      navigate('/researcher/dashboard');
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
        return formData.name && formData.email && formData.institution;
      case 2:
        return formData.specialties && formData.researchInterests;
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          
          <img src={logo} alt="CuraLink Logo" className="h-10" />
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {step} of 3</span>
            <span className="text-sm text-gray-600">{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <User className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Professional Information</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Tell us about your professional background
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="john.smith@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution/Organization *
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Harvard Medical School"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Research Expertise</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Share your areas of expertise and research interests
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialties *
                  </label>
                  <input
                    type="text"
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="e.g., Oncology, Neurology, Immunology"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple specialties with commas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Interests *
                  </label>
                  <textarea
                    name="researchInterests"
                    value={formData.researchInterests}
                    onChange={handleInputChange}
                    rows={4}
                    className="input"
                    placeholder="e.g., Immunotherapy, Clinical AI, Gene Therapy, Cancer Research"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-6">
                <Link className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Professional Links</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Optional: Connect your professional profiles to auto-import publications
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ORCID ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="orcid"
                    value={formData.orcid}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="0000-0000-0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ResearchGate Profile (Optional)
                  </label>
                  <input
                    type="text"
                    name="researchGate"
                    value={formData.researchGate}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="https://www.researchgate.net/profile/..."
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="availableForMeetings"
                      checked={formData.availableForMeetings}
                      onChange={handleInputChange}
                      className="mr-3 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Available for Meetings
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Allow patients and other researchers to request meetings with you
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Back to Home' : 'Previous'}
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isStepValid()
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {step === 3 ? 'Complete Setup' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearcherOnboarding;