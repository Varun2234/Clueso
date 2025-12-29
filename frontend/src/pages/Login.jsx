import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { loginSchema } from '../schemas/authSchema';
import { authApi } from '../api/authApi';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

const Login = () => {
  const navigate = useNavigate();
  
  // Zustand store actions
  const setAuth = useAuthStore((state) => state.setAuth);
  
  // Local state for form errors and loading
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  /**
   * Handles input changes and clears specific field errors
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing again
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  /**
   * Main form submission handler
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // 1. Validate with Zod
    const validation = loginSchema.safeParse(formData);
    
    if (!validation.success) {
      // Map Zod errors to our state
      const formattedErrors = validation.error.format();
      setErrors({
        email: formattedErrors.email?._errors[0],
        password: formattedErrors.password?._errors[0],
      });
      setIsLoading(false);
      return;
    }

    try {
      // 2. Call Auth API
      const response = await authApi.login(formData);
      
      // 3. Update Global Store (Zustand)
      setAuth(response.user, response.token);
      
      // 4. Redirect to Dashboard upon success
      navigate('/dashboard');
    } catch (err) {
      setErrors({ server: err.response?.data?.message || 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header Section */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Log in to your Clueso clone account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.server && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
              {errors.server}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="ml-2 text-gray-700">
                Remember me
              </label>
            </div>
            <Link to="/forgot-password" name="forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot password?
            </Link>
          </div>

          <div>
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Start your free trial
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;