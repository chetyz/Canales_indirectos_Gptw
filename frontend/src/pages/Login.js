import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      const result = await login(data);
      
      if (result.success) {
        toast.success('Login exitoso');
        navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 to-red-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
              <span className="text-red-600 font-bold text-xl">GPW</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Great Place to Work
            </h1>
            <h2 className="text-xl font-light mb-6">
              Lead Manager
            </h2>
            <p className="text-lg opacity-90">
              Gestiona y aprueba leads de forma eficiente. 
              Conecta con los mejores candidatos para tu organización.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">GPW</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Great Place to Work
            </h1>
            <p className="text-gray-600">
              Lead Manager
            </p>
          </div>
          
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Iniciar Sesión
            </h3>
            <p className="text-gray-600">
              Accede a tu cuenta para gestionar leads
            </p>
          </div>
        
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="tu@email.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    {...register('password', {
                      required: 'La contraseña es requerida',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                      }
                    })}
                    type="password"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <LogIn size={16} className="inline mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="font-medium text-red-600 hover:text-red-500">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;