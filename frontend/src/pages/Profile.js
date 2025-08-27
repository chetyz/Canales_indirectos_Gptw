import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { User, Mail, Calendar, Shield, TrendingUp } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/users/stats');
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    return role === 'ADMIN' 
      ? { class: 'bg-blue-100 text-blue-800', text: 'Administrador' }
      : { class: 'bg-green-100 text-green-800', text: 'Usuario' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const roleBadge = getRoleBadge(user?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Mi Perfil
        </h1>
        <p className="text-gray-600">
          Información personal y estadísticas de actividad
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Información Personal
            </h2>
            
            <div className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={32} className="text-gray-500" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleBadge.class}`}>
                      <Shield size={12} className="inline mr-1" />
                      {roleBadge.text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="mt-1 flex items-center text-gray-900">
                    <Mail size={16} className="mr-2 text-gray-400" />
                    {user?.email}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Miembro desde</label>
                  <div className="mt-1 flex items-center text-gray-900">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    {formatDate(user?.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <TrendingUp size={20} className="inline mr-2" />
              Estadísticas
            </h3>
            
            {userStats ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {userStats.totalSubmitted || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user?.role === 'ADMIN' ? 'Total Leads' : 'Leads Enviados'}
                  </div>
                </div>
                
                {userStats.byStatus && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-semibold text-yellow-600">
                        {userStats.byStatus.pending || 0}
                      </div>
                      <div className="text-xs text-gray-600">Pendientes</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">
                        {userStats.byStatus.approved || 0}
                      </div>
                      <div className="text-xs text-gray-600">Aprobados</div>
                    </div>
                    
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-semibold text-red-600">
                        {userStats.byStatus.rejected || 0}
                      </div>
                      <div className="text-xs text-gray-600">Rechazados</div>
                    </div>
                    
                    {user?.role === 'ADMIN' && userStats.totalApproved !== undefined && (
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-semibold text-purple-600">
                          {userStats.totalApproved}
                        </div>
                        <div className="text-xs text-gray-600">Procesados</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="spinner w-6 h-6 mx-auto mb-2"></div>
                Cargando estadísticas...
              </div>
            )}
          </div>

          {/* Role Information */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Permisos y Acceso
            </h3>
            
            <div className="space-y-3">
              {user?.role === 'ADMIN' ? (
                <>
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    Aprobar/rechazar leads
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    Acceso al panel de administración
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    Ver todos los leads
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    Integración con Salesforce
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Enviar leads para aprobación
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Ver mis leads enviados
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Recibir notificaciones de estado
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;