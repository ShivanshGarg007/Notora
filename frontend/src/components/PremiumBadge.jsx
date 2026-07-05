import React from 'react';
import { Crown } from 'lucide-react';

const PremiumBadge = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-yellow-600 text-white ${className}`}>
      <Crown className="w-3 h-3 mr-1" />
      Premium
    </div>
  );
};

export default PremiumBadge; 