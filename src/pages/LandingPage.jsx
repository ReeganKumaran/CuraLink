import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Search, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Discover Clinical Trials',
      description: 'Find relevant clinical trials tailored to your medical condition and location',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Connect with Experts',
      description: 'Connect with leading health experts and researchers in your field of interest',
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Access Publications',
      description: 'Stay informed with the latest medical research and publications',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Track Progress',
      description: 'Save favorites and track your journey through personalized dashboards',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-primary-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">CuraLink</span>
          </div>
          <button
            onClick={() => navigate('/director-management')}
            className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            Director Portal
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
          Connecting Patients & Researchers
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto animate-slide-up">
          CuraLink is an AI-powered platform that simplifies the discovery of clinical trials,
          medical publications, and health experts. Join us in advancing healthcare together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/patient/onboarding')}
            className="group bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
          >
            I am a Patient or Caregiver
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/researcher/onboarding')}
            className="group bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
          >
            I am a Researcher
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How CuraLink Helps You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="bg-primary-100 text-primary-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of patients and researchers already using CuraLink to advance healthcare
          </p>
          <button
            onClick={() => navigate('/patient/onboarding')}
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 shadow-lg"
          >
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;