import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Conectado al servidor Socket.IO');
        setConnected(true);
        
        // Join admin room if user is admin
        if (user.role === 'ADMIN') {
          newSocket.emit('join-admin', user.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Desconectado del servidor Socket.IO');
        setConnected(false);
      });

      // Listen for real-time notifications
      newSocket.on('new-lead', (data) => {
        if (user.role === 'ADMIN') {
          toast.success(`Nuevo lead: ${data.lead.firstName} ${data.lead.lastName}`);
          // You can dispatch events here to update UI components
        }
      });

      newSocket.on('lead-approved', (data) => {
        toast.success(`Lead aprobado: ${data.lead.company}`);
      });

      newSocket.on('lead-rejected', (data) => {
        toast.error(`Lead rechazado: ${data.lead.company}`);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  const value = {
    socket,
    connected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};