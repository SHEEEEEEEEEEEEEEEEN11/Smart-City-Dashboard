import React from 'react';
import './CombinedActuations.css';

const CombinedActuations = ({ airQuality, trafficData }) => {
  const getRecommendations = () => {
    const recommendations = [];
    
    if (trafficData?.congestion > 0.7) {
      recommendations.push("extend green duration");
    }
    
    if (airQuality?.aqi > 150) {
      recommendations.push("activate ventilation");
    }
    
    if (recommendations.length === 0) {
      return "No actions required at this time. All systems are operating normally.";
    }
    
    return `Based on current data: ${recommendations.join(" and ")} is recommended.`;
  };

  return (
    <div className="combined-actuations">
      <h3>Combined Actuations</h3>
      <div className="actuation-summary">
        <p>{getRecommendations()}</p>
      </div>
    </div>
  );
};

export default CombinedActuations;
