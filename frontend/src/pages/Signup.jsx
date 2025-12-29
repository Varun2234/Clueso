import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { signupSchema } from '../schemas/authSchema';
import { authApi } from '../api/authApi';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

const Signup = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Local UI states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Generic handler for all inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the field being edited
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // 1. Validate form data with Zod
    const result = signupSchema.safeParse(formData);
    
    if (!result.success) {
      // Map Zod errors to UI state
      const formattedErrors = {};
      result.error.issues.forEach((issue) => {
        formattedErrors[issue.path[0]] = issue.message;
      });
      setErrors(formattedErrors);
      setIsLoading(false);
      return;
    }

    try {
      // 2. API Call (Passing only what the backend needs)
      const { fullName, email, password } = formData;
      const response = await authApi.signup({ fullName, email, password });

      // 3. Update Zustand Store
      setAuth(response.user, response.token);

      // 4. Redirect to Dashboard
      navigate('/dashboard');
    } catch (err) {
      setErrors({ 
        server: err.response?.data?.message || 'Something went wrong. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Branding/Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Join Clueso to start collecting better feedback.
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {errors.server && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 text-center">
              {errors.server}
            </div>
          )}

          <Input
            label="Full Name"
            name="fullName"
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />

          <Input
            label="Work Email"
            name="email"
            type="email"
            placeholder="john@company.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Input
              label="Confirm"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full py-3 text-base font-semibold transition-all hover:scale-[1.01]"
            >
              Get Started
            </Button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;