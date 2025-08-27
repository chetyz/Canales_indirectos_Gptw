import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building, 
  Mail, 
  Phone,
  Calendar,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingLeads, setPendingLeads] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingLead, setProcessingLead] = useState(null);
  const [filter, setFilter] = useState('PENDING');
  const [salesforceStatus, setSalesforceStatus] = useState(null);

  useEffect(() => {
    fetchLeads();
    testSalesforceConnection();
  }, [filter]);

  const fetchLeads = async () => {
    try {
      const response = await api.get(
        filter === 'PENDING' 
          ? '/leads/pending' 
          : `/leads?status=${filter}`
      );
      
      if (filter === 'PENDING') {
        setPendingLeads(response.data);
        setAllLeads([]);
      } else {
        setAllLeads(response.data.leads || []);
        setPendingLeads([]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Error cargando leads');
    } finally {
      setLoading(false);
    }
  };

  const testSalesforceConnection = async () => {
    try {
      const response = await api.get('/leads/test-salesforce');
      setSalesforceStatus(response.data);
    } catch (error) {
      setSalesforceStatus({ success: false, error: 'Error de conexión' });
    }
  };

  const handleApproveLead = async (leadId) => {
    setProcessingLead(leadId);
    try {
      await api.post(`/leads/${leadId}/approve`);
      toast.success('Lead aprobado y enviado a Salesforce');
      fetchLeads();
    } catch (error) {
      console.error('Error aprobando lead:', error);
      toast.error('Error aprobando lead');
    } finally {
      setProcessingLead(null);
    }
  };

  const handleRejectLead = async (leadId, reason) => {
    setProcessingLead(leadId);
    try {
      await api.post(`/leads/${leadId}/reject`, { reason });
      toast.success('Lead rechazado');
      fetchLeads();
    } catch (error) {
      console.error('Error rechazando lead:', error);
      toast.error('Error rechazando lead');
    } finally {
      setProcessingLead(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { class: 'badge-pending', text: 'Pendiente', icon: Clock },
      APPROVED: { class: 'badge-approved', text: 'Aprobado', icon: CheckCircle },
      REJECTED: { class: 'badge-rejected', text: 'Rechazado', icon: XCircle }
    };
    return badges[status] || badges.PENDING;
  };

  const leadsToShow = filter === 'PENDING' ? pendingLeads : allLeads;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona y aprueba leads para Salesforce
          </p>
        </div>
        
        {/* Salesforce Status */}
        <div className="mt-4 sm:mt-0">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            salesforceStatus?.success 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              salesforceStatus?.success ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            Salesforce {salesforceStatus?.success ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status === 'ALL' ? '' : status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === (status === 'ALL' ? '' : status)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' ? 'Todos' : 
               status === 'PENDING' ? 'Pendientes' :
               status === 'APPROVED' ? 'Aprobados' : 'Rechazados'}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      {leadsToShow.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay leads {filter === 'PENDING' ? 'pendientes' : 'para mostrar'}
          </h3>
          <p className="text-gray-500">
            {filter === 'PENDING' 
              ? 'Los nuevos leads aparecerán aquí para su aprobación.'
              : 'Prueba con un filtro diferente.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {leadsToShow.map((lead) => {
            const badge = getStatusBadge(lead.status);
            const StatusIcon = badge.icon;
            
            return (
              <div key={lead.id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  {/* Lead Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <div className="flex items-center mt-1">
                          <span className={`badge ${badge.class}`}>
                            <StatusIcon size={14} className="mr-1" />
                            {badge.text}
                          </span>
                          <span className="ml-3 text-sm text-gray-500">
                            <Calendar size={14} className="inline mr-1" />
                            {formatDate(lead.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={14} className="mr-2" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone size={14} className="mr-2" />
                            {lead.phone}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Building size={14} className="mr-2" />
                          {lead.company}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {lead.position && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User size={14} className="mr-2" />
                            {lead.position}
                          </div>
                        )}
                        {lead.submittedBy && (
                          <div className="text-sm text-gray-600">
                            <strong>Enviado por:</strong> {lead.submittedBy.firstName} {lead.submittedBy.lastName}
                          </div>
                        )}
                        {lead.salesforceId && (
                          <div className="flex items-center text-sm text-green-600">
                            <ExternalLink size={14} className="mr-2" />
                            ID Salesforce: {lead.salesforceId}
                          </div>
                        )}
                      </div>
                    </div>

                    {lead.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          <MessageSquare size={14} className="inline mr-2" />
                          Descripción:
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {lead.description}
                        </p>
                      </div>
                    )}

                    {lead.approvedBy && (
                      <div className="text-sm text-gray-600 border-t pt-3">
                        <strong>
                          {lead.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'} por:
                        </strong> {lead.approvedBy.firstName} {lead.approvedBy.lastName}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {lead.status === 'PENDING' && (
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row lg:flex-col gap-3">
                      <button
                        onClick={() => handleApproveLead(lead.id)}
                        disabled={processingLead === lead.id}
                        className="btn btn-success"
                      >
                        {processingLead === lead.id ? (
                          <div className="spinner w-4 h-4"></div>
                        ) : (
                          <>
                            <CheckCircle size={16} className="mr-2" />
                            Aprobar
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Razón del rechazo (opcional):');
                          if (reason !== null) {
                            handleRejectLead(lead.id, reason);
                          }
                        }}
                        disabled={processingLead === lead.id}
                        className="btn btn-danger"
                      >
                        <XCircle size={16} className="mr-2" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;