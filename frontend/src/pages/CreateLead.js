import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
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
  Plus
} from 'lucide-react';

const CreateLead = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      const submissionData = {
        ...data,
        submittedById: user.id
      };

      await api.post('/leads', submissionData);
      
      toast.success('¡Lead creado exitosamente!');
      setSubmitted(true);
      reset();
    } catch (error) {
      console.error('Error creando lead:', error);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err.msg);
        });
      } else {
        toast.error('Error creando el lead. Inténtalo nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="card p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={24} className="text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Lead creado con éxito!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Tu lead ha sido creado y está pendiente de aprobación por un administrador.
          </p>
          
          <button
            onClick={() => {
              setSubmitted(false);
              reset();
            }}
            className="btn btn-primary w-full"
          >
            Crear otro lead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* Header Section */}
      <div className="text-center mb-5">
        <h1 className="text-4xl font-bold mb-4" style={{color: 'var(--secondary-gray)'}}>
          Crear Nuevo Lead
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{color: 'var(--dark-gray)'}}>
          Completa la información para crear un nuevo lead. Todos los campos marcados con * son obligatorios.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-5">
          {/* Información Personal */}
          <div className="form-section slide-in">
            <div className="form-section-header">
              <div className="form-section-icon">
                <User size={20} color="white" />
              </div>
              <h3 className="form-section-title">
                Información Personal
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">
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
                  placeholder="Ingrese su nombre"
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
                  placeholder="Ingrese su apellido"
                />
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="form-section slide-in">
            <div className="form-section-header">
              <div className="form-section-icon">
                <Mail size={20} color="white" />
              </div>
              <h3 className="form-section-title">
                Información de Contacto
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">
                  Correo Electrónico *
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
                  placeholder="nombre@empresa.com"
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Teléfono
                </label>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^[+]?[0-9\s\-()]{10,}$/,
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
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Building size={20} className="mr-2 text-red-600" />
              Información Empresarial
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa / Organización *
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Nombre de la empresa"
                />
                {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo
                </label>
                <input
                  {...register('position')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Ej: Gerente de Recursos Humanos"
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText size={20} className="mr-2 text-red-600" />
              ¿Cómo podemos ayudarte?
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios
              </label>
              <textarea
                {...register('description')}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows="4"
                placeholder="Cuéntanos sobre tu organización y cómo Great Place to Work puede ayudarte a crear un mejor lugar para trabajar..."
              />
              <p className="mt-2 text-sm text-gray-500">
                *Servicios de encuesta y acompañamiento para evaluación y mejora de RRHH.
                **Servicios de entrenamiento y capacitación para líderes y colaboradores.
              </p>
            </div>
          </div>

          {/* Botón de Envío */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-4 px-6 rounded-md text-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Enviando...
                </div>
              ) : (
                <>
                  <Send size={20} className="inline mr-2" />
                  Enviar Solicitud
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              * Campos requeridos. Tu solicitud será revisada por nuestro equipo y nos pondremos en contacto contigo.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLead;