import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  HeartPulse,
  Users,
  Sun,
  Moon,
} from 'lucide-react';
import clsx from 'clsx';
import { logo } from '../assets/assets';
import authService from '../services/authService';

const roleOptions = [
  {
    id: 'patient',
    label: 'Patient',
    description: 'Find curated trials and care teams.',
    icon: HeartPulse,
  },
  {
    id: 'researcher',
    label: 'Researcher',
    description: 'Manage cohorts and share insights.',
    icon: Users,
  },
  {
    id: 'director',
    label: 'Director',
    description: 'Oversee programs and adoption.',
    icon: ShieldCheck,
  },
];

const roleMessaging = {
  patient: {
    headline: 'Welcome back. Continue your personalized care journey.',
    helper: 'Review fresh trial matches tailored to your profile.',
  },
  researcher: {
    headline: 'Ready to accelerate your research collaborations?',
    helper: 'Track study performance and engage with expert communities.',
  },
  director: {
    headline: 'Lead transformative experiences with clarity.',
    helper: 'Monitor utilization, outcomes, and compliance in one place.',
  },
};

const onboardingRoutes = {
  patient: '/patient/onboarding',
  researcher: '/researcher/onboarding',
  director: '/director-management',
};

const Login = () => {
  const navigate = useNavigate();

  const [theme, setTheme] = useState('dark');
  const isDark = theme === 'dark';

  const [selectedRole, setSelectedRole] = useState('patient');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCopy = useMemo(() => roleMessaging[selectedRole], [selectedRole]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await authService.login(formData.email, formData.password);

      if (rememberMe) {
        authService.remember?.(true);
      }

      const normalizedRole = user.role?.toLowerCase?.() || '';

      if (normalizedRole === 'patient') {
        navigate('/patient/dashboard');
      } else if (normalizedRole === 'researcher') {
        navigate('/researcher/dashboard');
      } else if (normalizedRole === 'director' || normalizedRole === 'admin') {
        navigate('/director-management');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in with those credentials.');
      setLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  const helperLabelClass = clsx(
    'text-xs font-semibold uppercase tracking-[0.35em]',
    isDark ? 'text-white/60' : 'text-slate-500'
  );
  const textSubtle = isDark ? 'text-white/70' : 'text-slate-600';
  const textFaint = isDark ? 'text-white/50' : 'text-slate-400';

  const inputClasses = clsx(
    'w-full rounded-2xl px-14 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2',
    isDark
      ? 'border border-white/15 bg-white/10 text-white placeholder:text-white/50 focus:border-primary-300 focus:ring-primary-300/50'
      : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:ring-primary-400/40'
  );

  const roleButtonClass = (isActive) =>
    clsx(
      'flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition-all duration-300',
      isDark
        ? isActive
          ? 'border-primary-200 bg-white/15 text-white shadow-glow-sm'
          : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
        : isActive
          ? 'border-primary-200 bg-white text-slate-900 shadow-lg'
          : 'border-slate-200 bg-white/80 text-slate-600 hover:border-primary-200 hover:bg-white'
    );

  return (
    <div
      className={clsx(
        'relative w-screen overflow-hidden transition-colors duration-500',
        isDark
          ? 'bg-[#0b0a1b] text-white'
          : 'bg-gradient-to-br from-white via-violet-50 to-slate-200 text-slate-900'
      )}
    >
      <div className="absolute inset-0 -z-10 opacity-40">
        <img
          src={logo}
          alt=""
          className="absolute -left-20 top-1/4 h-72 w-72 rounded-full border border-transparent blur-3xl"
          aria-hidden
        />
      </div>

      <div className="absolute right-6 top-6 z-20 flex items-center gap-3">
        <span className={helperLabelClass}>Theme</span>
        <button
          type="button"
          onClick={toggleTheme}
          className={clsx(
            'flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300',
            isDark
              ? 'border-white/20 bg-white/10 text-white/80 hover:bg-white/15'
              : 'border-slate-300 bg-white/80 text-slate-700 hover:bg-white'
          )}
          aria-pressed={isDark ? 'false' : 'true'}
        >
          {isDark ? (
            <>
              <Sun className="h-4 w-4 text-primary-200" />
              Light
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-primary-500" />
              Dark
            </>
          )}
        </button>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16 sm:px-10">
        <div className="flex w-full justify-center">
          <div
            className={clsx(
              'max-w-3/4 min-w-3/4 rounded-[2.25rem] border px-8 py-10 transition-all duration-500 backdrop-blur-2xl sm:min-w-[340px] md:px-10 md:py-12',
              isDark
                ? 'border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-black/40 shadow-glow-sm'
                : 'border-slate-200 bg-white/80 text-slate-900 shadow-xl'
            )}
          >
            <div className="mb-8 flex flex-col gap-3 text-center">
              <div
                className={clsx(
                  'mx-auto flex h-14 w-14 items-center justify-center rounded-full border',
                  isDark ? 'border-white/20 bg-white/10' : 'border-slate-200 bg-white'
                )}
              >
                <Sparkles
                  className={clsx('h-6 w-6', isDark ? 'text-primary-200' : 'text-primary-500')}
                />
              </div>
              <h1 className={clsx('text-3xl font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                Sign in to CuraLink
              </h1>
              <p className={clsx('text-sm', textSubtle)}>{selectedCopy.helper}</p>
            </div>

            <div
              className={clsx(
                'grid gap-2 rounded-3xl border px-3 py-3 backdrop-blur-xl sm:grid-cols-3',
                isDark
                  ? 'border-white/15 bg-white/5'
                  : 'border-slate-200 bg-white/90 text-slate-700 shadow-lg'
              )}
            >
              {roleOptions.map((role) => {
                const Icon = role.icon;
                const isActive = role.id === selectedRole;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={roleButtonClass(isActive)}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <Icon
                        className={clsx(
                          'h-4 w-4',
                          isDark ? 'text-primary-200' : 'text-primary-500'
                        )}
                      />
                      {role.label}
                    </span>
                    <span className={clsx('text-xs', textFaint)}>{role.description}</span>
                  </button>
                );
              })}
            </div>

            <div
              className={clsx(
                'mt-6 rounded-2xl border px-4 py-3 text-sm transition-colors duration-300',
                isDark
                  ? 'border-white/10 bg-white/5 text-white/80'
                  : 'border-slate-200 bg-white text-slate-600 shadow-sm'
              )}
            >
              {selectedCopy.headline}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label
                  className={clsx(
                    'mb-2 block text-sm font-semibold',
                    isDark ? 'text-white/80' : 'text-slate-700'
                  )}
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    className={clsx(
                      'absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors duration-300',
                      isDark ? 'text-white/40' : 'text-slate-400'
                    )}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="you@organization.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className={clsx(
                    'mb-2 block text-sm font-semibold',
                    isDark ? 'text-white/80' : 'text-slate-700'
                  )}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className={clsx(
                      'absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors duration-300',
                      isDark ? 'text-white/40' : 'text-slate-400'
                    )}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className={clsx(
                      'absolute right-5 top-1/2 -translate-y-1/2 transition-colors duration-300',
                      isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    )}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <label
                  className={clsx(
                    'inline-flex items-center gap-2',
                    isDark ? 'text-white/65' : 'text-slate-600'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe((prev) => !prev)}
                    className={clsx(
                      'h-4 w-4 rounded border focus:ring-2 focus:ring-offset-0',
                      isDark
                        ? 'border-white/25 bg-white/10 text-primary-300 focus:ring-primary-200'
                        : 'border-slate-300 text-primary-500 focus:ring-primary-300'
                    )}
                  />
                  Keep me signed in
                </label>
                <button
                  type="button"
                  className={clsx(
                    'flex items-center gap-2 font-semibold transition-colors duration-300',
                    isDark ? 'text-primary-200 hover:text-white' : 'text-primary-500 hover:text-primary-600'
                  )}
                >
                  Forgot password?
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div
                  className={clsx(
                    'rounded-2xl border px-4 py-3 text-sm transition-colors duration-300',
                    isDark
                      ? 'border-red-400/40 bg-red-500/10 text-red-200'
                      : 'border-red-200 bg-red-50 text-red-600'
                  )}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className={clsx(
                  'btn-primary flex h-12 w-full items-center justify-center rounded-full text-base transition-opacity duration-300',
                  (!isFormValid || loading) && 'opacity-60 grayscale'
                )}
              >
                {loading ? (
                  <>
                    <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className={clsx('mt-8 space-y-4 text-center text-sm', textSubtle)}>
              <p>
                Need an account?{' '}
                <Link
                  to={onboardingRoutes[selectedRole] || '/patient/onboarding'}
                  className={clsx(
                    'font-semibold transition-colors duration-300',
                    isDark ? 'text-primary-200 hover:text-white' : 'text-primary-500 hover:text-primary-600'
                  )}
                >
                  Start onboarding
                </Link>
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                <Link
                  to="/patient/onboarding"
                  className={clsx(
                    'rounded-full border px-4 py-2 transition-all duration-300',
                    isDark
                      ? 'border-white/15 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-600'
                  )}
                >
                  Patient onboarding
                </Link>
                <Link
                  to="/researcher/onboarding"
                  className={clsx(
                    'rounded-full border px-4 py-2 transition-all duration-300',
                    isDark
                      ? 'border-white/15 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-600'
                  )}
                >
                  Researcher onboarding
                </Link>
                <Link
                  to="/director-management"
                  className={clsx(
                    'rounded-full border px-4 py-2 transition-all duration-300',
                    isDark
                      ? 'border-white/15 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-600'
                  )}
                >
                  Director portal
                </Link>
              </div>
            </div>

            <div
              className={clsx(
                'mt-10 flex items-center justify-center gap-2 text-xs font-semibold transition-colors duration-300',
                isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <Link to="/">Back to landing</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
