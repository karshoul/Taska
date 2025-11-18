import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const CustomEvent = ({ event }) => {
  const { status } = event.resource;

  const getIcon = () => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 mr-2 text-red-700 flex-shrink-0" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 mr-2 text-green-700 flex-shrink-0" />;
      default:
        return <Clock className="w-4 h-4 mr-2 text-indigo-700 flex-shrink-0" />;
    }
  };

  return (
    <div className="flex items-center w-full h-full" title={event.title}>
      {getIcon()}
      <span className="truncate text-sm font-medium">
        {event.title}
      </span>
    </div>
  );
};

export default CustomEvent;