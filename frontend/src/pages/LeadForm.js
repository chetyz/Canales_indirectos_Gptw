import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  FileText, 
  Send,
  ArrowLeft
} from 'lucide-react';

const LeadForm = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      // For public form, use a generic user ID or create a guest submission
      // You might want to create a "guest" user or handle this differently
      const submissionData = {
        ...data,
        submittedById: 'guest-user-id' // This should be handled differently in production
      };

      await api.post('/leads', submissionData);
      
      toast.success('¡Lead enviado exitosamente! Será revisado por un administrador.');
      setSubmitted(true);
      reset();
    } catch (error) {
      console.error('Error enviando lead:', error);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err.msg);
        });
      } else {
        toast.error('Error enviando el lead. Inténtalo nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={24} className="text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Enviado con éxito!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Tu lead ha sido enviado y está pendiente de aprobación. 
              Recibirás una notificación una vez que sea procesado.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  reset();
                }}
                className="btn btn-primary w-full"
              >
                Enviar otro lead
              </button>
              
              <Link to="/login" className="btn btn-outline w-full">
                Ir a Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            to="/login" 
            className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Volver al Login
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Formulario de Lead
          </h1>
          <p className="mt-2 text-gray-600">
            Completa la información para enviar tu lead. Será revisado por un administrador.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">
                    <User size={16} className="inline mr-2" />
                    Nombre *
                  </label>
                  <input
                    {...register('firstName', {
                      required: 'El nombre es requerido',
                      minLength: {
                        value: 2,
                        message: 'El nombre debe tener al menos 2 caracteres'
                      }
                    })}
                    type="text"
                    className="form-input"
                    placeholder="Juan"
                  />
                  {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Apellido *
                  </label>
                  <input
                    {...register('lastName', {
                      required: 'El apellido es requerido',
                      minLength: {
                        value: 2,
                        message: 'El apellido debe tener al menos 2 caracteres'
                      }
                    })}
                    type="text"
                    className="form-input"
                    placeholder="Pérez"
                  />
                  {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">
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
                    className="form-input"
                    placeholder="juan@empresa.com"
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Phone size={16} className="inline mr-2" />
                    Teléfono
                  </label>
                  <input
                    {...register('phone', {
                      pattern: {
                        value: /^[\+]?[0-9\s\-\(\)]{10,}$/,
                        message: 'Formato de teléfono inválido'
                      }
                    })}
                    type="tel"
                    className="form-input"
                    placeholder="+54 11 1234-5678"
                  />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            {/* Información Empresarial */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Información Empresarial
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">
                    <Building size={16} className="inline mr-2" />
                    Empresa *
                  </label>
                  <input
                    {...register('company', {
                      required: 'La empresa es requerida',
                      minLength: {
                        value: 2,
                        message: 'El nombre de la empresa debe tener al menos 2 caracteres'
                      }
                    })}
                    type="text"
                    className="form-input"
                    placeholder="Mi Empresa S.A."
                  />
                  {errors.company && <p className="form-error">{errors.company.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Briefcase size={16} className="inline mr-2" />
                    Cargo
                  </label>
                  <input
                    {...register('position')}
                    type="text"
                    className="form-input"
                    placeholder="Gerente de Ventas"
                  />
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="form-group">
              <label className="form-label">
                <FileText size={16} className="inline mr-2" />
                Descripción / Comentarios
              </label>
              <textarea
                {...register('description')}
                className="form-input form-textarea"
                rows="4"
                placeholder="Describe tu consulta o necesidades específicas..."
              />
            </div>

            {/* Botón de Envío */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <div className="spinner w-5 h-5"></div>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Enviar Lead
                  </>
                )}
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              * Campos requeridos. Tu información será tratada de forma confidencial.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;