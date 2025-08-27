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
            <img 
              src="/logo_great.png" 
              alt="Great Place to Work" 
              className="h-16 w-auto mb-6"
            />
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
        <div className="max-w-sm w-full mx-auto">
          <div className="text-center mb-8 lg:hidden">
            <img 
              src="/logo_great.png" 
              alt="Great Place to Work" 
              className="h-14 w-auto mx-auto mb-4"
            />
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
            <div>
              <div className="form-group text-center">
                <label htmlFor="email" className="form-label">
                  <Mail size={16} className="inline mr-2" />
                  Email *
                </label>
                <input
                  {...register('email', {
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  className="form-input mx-auto"
                  placeholder="tu@email.com"
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div className="form-group text-center">
                <label htmlFor="password" className="form-label">
                  <Lock size={16} className="inline mr-2" />
                  Contraseña *
                </label>
                <input
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres'
                    }
                  })}
                  type="password"
                  className="form-input mx-auto"
                  placeholder="••••••••"
                />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
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