import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Search, BookOpen, TrendingUp, ArrowRight, Award, BarChart3, Shield, Zap } from 'lucide-react';
import {
  logo, heroImage, womanComputer, productivity, roi, frameImage,
  artboard1, artboard2, artboard3, artboard4, artboard5, artboard6,
  artboard7, artboard8, artboard9, artboard10, artboard11, artboard14,
  artboard15, artboard16, artboard18
} from '../assets/assets';

const LandingPage = () => {
  const navigate = useNavigate();

  const partnerLogos = [
    artboard1, artboard2, artboard3, artboard4, artboard5, artboard6,
    artboard7, artboard8, artboard9, artboard10, artboard11, artboard14,
    artboard15, artboard16, artboard18
  ];

  const features = [
    {
      icon: artboard1,
      title: 'Discover Clinical Trials',
      description: 'Find relevant clinical trials tailored to your medical condition and location',
    },
    {
      icon: artboard4,
      title: 'Connect with Experts',
      description: 'Connect with leading health experts and researchers in your field of interest',
    },
    {
      icon: artboard7,
      title: 'Access Publications',
      description: 'Stay informed with the latest medical research and publications',
    },
    {
      icon: artboard10,
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
            <img src={logo} alt="CuraLink Logo" className="h-12" />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-primary-600 transition-colors font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/director-management')}
              className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Director Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
              Connecting Patients & Researchers
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-slide-up">
              CuraLink is an AI-powered platform that simplifies the discovery of clinical trials,
              medical publications, and health experts. Join us in advancing healthcare together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/patient/onboarding')}
                className="group bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                I am a Patient or Caregiver
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/researcher/onboarding')}
                className="group bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                I am a Researcher
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative">
            <img
              src={frameImage}
              alt="Healthcare professionals collaborating"
              className="rounded-2xl  w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Partner/Feature Logos Marquee */}
      <section className="bg-white py-12 overflow-hidden border-y border-gray-100">
        <div className="container mx-auto px-6 mb-4">
          <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wide">
            Trusted by Healthcare Organizations Worldwide
          </p>
        </div>
        <div className="relative">
          <div className="marquee-container">
            <div className="marquee-content">
              {/* First set of logos */}
              {partnerLogos.map((logo, index) => (
                <div key={`logo-1-${index}`} className="marquee-item">
                  <img
                    src={logo}
                    alt={`Partner ${index + 1}`}
                    className="h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {partnerLogos.map((logo, index) => (
                <div key={`logo-2-${index}`} className="marquee-item">
                  <img
                    src={logo}
                    alt={`Partner ${index + 1}`}
                    className="h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">4,600+</div>
              <p className="text-gray-600">Healthcare Organizations</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">24/7</div>
              <p className="text-gray-600">Expert Access</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">10+</div>
              <p className="text-gray-600">Peer-Reviewed Studies</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary-600 mb-2">95%</div>
              <p className="text-gray-600">Patient Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Comprehensive Healthcare Connection Platform
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          CuraLink provides multiple pathways to connect patients with the right clinical trials,
          health experts, and research opportunities - all in one place.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
            >
              <div className="mb-4">
                <img src={feature.icon} alt={feature.title} className="w-16 h-16 object-contain" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img src={womanComputer} alt="Patient using platform" className="rounded-2xl shadow-xl" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Evidence-Based Results That Matter
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Improved Patient Outcomes</h3>
                    <p className="text-gray-600">Faster access to appropriate trials and expert care leads to better health outcomes</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Enhanced Productivity</h3>
                    <p className="text-gray-600">Streamlined processes for researchers to find collaborators and manage trials</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Cost-Effective Solutions</h3>
                    <p className="text-gray-600">Reduce time and resources spent on trial recruitment and patient matching</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-yellow-100 p-3 rounded-lg mr-4">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Rapid Connection</h3>
                    <p className="text-gray-600">AI-powered matching connects patients with relevant trials in minutes, not months</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Comprehensive Programs for Every Need
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Whether you're a patient seeking treatment options or a researcher advancing medical science,
            CuraLink provides the tools and connections you need.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow border-t-4 border-primary-600">
            <div className="text-primary-600 mb-4">
              <Users className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Patient Assistance Program</h3>
            <p className="text-gray-600 mb-4">
              Personalized support to find clinical trials, connect with specialists, and access the latest research relevant to your condition.
            </p>
            <button
              onClick={() => navigate('/patient/onboarding')}
              className="text-primary-600 font-medium hover:text-primary-700 flex items-center"
            >
              Learn More <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow border-t-4 border-green-600">
            <div className="text-green-600 mb-4">
              <BookOpen className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Researcher Collaboration</h3>
            <p className="text-gray-600 mb-4">
              Advanced tools for managing clinical trials, finding collaborators, and connecting with potential participants efficiently.
            </p>
            <button
              onClick={() => navigate('/researcher/onboarding')}
              className="text-green-600 font-medium hover:text-green-700 flex items-center"
            >
              Learn More <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow border-t-4 border-purple-600">
            <div className="text-purple-600 mb-4">
              <Award className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">CuraConnect Platform</h3>
            <p className="text-gray-600 mb-4">
              Our AI-powered platform matches patients with trials and connects researchers with peers, streamlining healthcare innovation.
            </p>
            <button
              onClick={() => navigate('/director-management')}
              className="text-purple-600 font-medium hover:text-purple-700 flex items-center"
            >
              View Analytics <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Healthcare Journey?
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of patients and researchers already using CuraLink to advance healthcare and improve lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/patient/onboarding')}
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 shadow-lg"
            >
              Get Started as Patient
            </button>
            <button
              onClick={() => navigate('/researcher/onboarding')}
              className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors duration-200 shadow-lg border-2 border-white"
            >
              Join as Researcher
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;