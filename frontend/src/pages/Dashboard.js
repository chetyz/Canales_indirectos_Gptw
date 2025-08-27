import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, leadsResponse] = await Promise.all([
        api.get('/users/stats'),
        api.get(`/leads${isAdmin ? '?limit=5' : ''}`)
      ]);

      setStats(statsResponse.data);
      setRecentLeads(leadsResponse.data.leads || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { class: 'badge-pending', text: 'Pendiente' },
      APPROVED: { class: 'badge-approved', text: 'Aprobado' },
      REJECTED: { class: 'badge-rejected', text: 'Rechazado' }
    };
    return badges[status] || badges.PENDING;
  };

  const getStatIcon = (type) => {
    const icons = {
      total: TrendingUp,
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle
    };
    return icons[type] || FileText;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Hola, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          {isAdmin 
            ? 'Gestiona y aprueba leads desde tu panel de administración.'
            : 'Aquí tienes un resumen de tus leads enviados.'
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats && (
          <>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {isAdmin ? 'Total Leads' : 'Leads Enviados'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalSubmitted || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp size={20} className="text-blue-600" />
                </div>
              </div>
            </div>

            {stats.byStatus && (
              <>
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats.byStatus.pending || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Clock size={20} className="text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Aprobados</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.byStatus.approved || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rechazados</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.byStatus.rejected || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <XCircle size={20} className="text-red-600" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {isAdmin && stats.totalApproved !== undefined && (
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Procesados por ti</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.totalApproved}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users size={20} className="text-blue-600" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Leads */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {isAdmin ? 'Leads Recientes' : 'Tus Leads Recientes'}
          </h2>
        </div>
        
        {recentLeads.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No hay leads para mostrar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enviado por
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentLeads.map((lead) => {
                  const badge = getStatusBadge(lead.status);
                  return (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.firstName} {lead.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.company}</div>
                        {lead.position && (
                          <div className="text-sm text-gray-500">{lead.position}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${badge.class}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.submittedBy ? 
                            `${lead.submittedBy.firstName} ${lead.submittedBy.lastName}` :
                            'N/A'
                          }
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {isAdmin && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <a href="/admin" className="btn btn-primary inline-flex">
              Ver Panel de Administración
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;