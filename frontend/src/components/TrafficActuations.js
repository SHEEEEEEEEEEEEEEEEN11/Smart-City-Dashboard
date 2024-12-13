import React from 'react';
import './TrafficActuations.css';

const TrafficActuations = ({ trafficData }) => {
  const handleSelect = (option) => {
    // TODO: Implement selection handling
    console.log(`Selected: ${option}`);
  };

  return (
    <div className="traffic-actuations">
      <h3>Traffic Actuations</h3>
      <div className="traffic-options">
        <div className="traffic-option green">
          <h4>Extend Green Duration</h4>
          <button onClick={() => handleSelect('extend')}>SELECT</button>
        </div>
        <div className="traffic-option blue">
          <h4>Keep Normal Settings</h4>
          <button onClick={() => handleSelect('normal')}>SELECT</button>
        </div>
        <div className="traffic-option orange">
          <h4>What's Best</h4>
          <p>
            {trafficData?.congestion > 0.7 
              ? "Extend Green Duration is recommended based on traffic congestion data."
              : "Normal settings are recommended based on current traffic conditions."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrafficActuations;
