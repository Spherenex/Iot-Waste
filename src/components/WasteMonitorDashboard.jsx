import React, { useState, useEffect } from 'react';
import { Trash2, DollarSign, Scale, BarChart2, RefreshCw, IndianRupee, AlertTriangle } from 'lucide-react';
import './WasteMonitorDashboard.css';

const WasteMonitorDashboard = () => {
  // Main state to store waste monitoring data
  const [wasteData, setWasteData] = useState({
    price: 0,
    trash: null, // Initialize as null to detect first load
    weight: 0
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Define waste type: Trash = 1 means Wet Waste, Trash = 0 means Dry Waste
  const wasteType = wasteData.trash === 1 ? 'dry Waste' : 
                   wasteData.trash === 0 ? 'wet Waste' : 
                   'Unknown';
  
  // Calculate fill percentage (assuming max weight capacity is 100kg)
  const maxCapacity = 100;
  const fillPercentage = Math.min(Math.abs(wasteData.weight) / maxCapacity * 100, 100);
  
  // Determine fill level status
  const getFillStatus = () => {
    if (fillPercentage >= 80) return 'critical';
    if (fillPercentage >= 50) return 'warning';
    return 'normal';
  };

  // Function to fetch data from Firebase
  const fetchData = async () => {
    try {
      setRefreshing(true);
      // First, fetch the Container data
      const containerResponse = await fetch('https://iot-waste-06052025-default-rtdb.firebaseio.com/Container.json');
      
      if (!containerResponse.ok) {
        throw new Error(`Failed to fetch container data: ${containerResponse.status} ${containerResponse.statusText}`);
      }
      
      // Then, fetch the Trash data
      const trashResponse = await fetch('https://iot-waste-06052025-default-rtdb.firebaseio.com/Trash.json');
      
      if (!trashResponse.ok) {
        throw new Error(`Failed to fetch trash data: ${trashResponse.status} ${trashResponse.statusText}`);
      }

      const containerData = await containerResponse.json();
      const trashData = await trashResponse.json();
      
      console.log("Fetched container data:", containerData);
      console.log("Fetched trash data:", trashData);
      
      if (!containerData) {
        setError("No container data available from the server");
        setConnectionStatus('disconnected');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Extract the data (fields are capitalized in Firebase: Price, Weight)
      const newPrice = containerData.Price ?? 0;
      const newWeight = containerData.Weight ?? 0;
      
      // Get trash value (it's at the root level, not in Container)
      const newTrash = trashData !== null ? trashData : null;
      
      // Update the state with the new data
      setWasteData({
        price: newPrice,
        trash: newTrash,
        weight: newWeight
      });
      
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
      setConnectionStatus('connected');
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setConnectionStatus('disconnected');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and interval setup
  useEffect(() => {
    // Fetch immediately on mount
    fetchData();
    
    // Set up interval for periodic fetching (every 5 seconds)
    const intervalId = setInterval(fetchData, 5000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchData();
  };

  // Loading state display
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading waste monitoring data...</p>
      </div>
    );
  }

  // Error state display
  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={24} className="error-icon" />
        <p>Error: {error}</p>
        <button className="refresh-button" onClick={handleRefresh}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1><Trash2 className="header-icon" /> IoT Waste Monitoring Dashboard</h1>
        <div className="header-controls">
          <div className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '● Connected' : '● Disconnected'}
          </div>
          <button 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`} 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="dashboard-grid">
        {/* Waste Type Card */}
        <div className={`dashboard-card waste-type-card ${wasteData.trash === 1 ? 'dry-waste' : wasteData.trash === 0 ? 'wet-waste' : 'unknown-waste'}`}>
          <div className="card-header">
            <Trash2 className="card-icon" />
            <h2>Waste Type</h2>
          </div>
          <div className="card-content">
            <p className="waste-type-label">{wasteType}</p>
            <div className="waste-type-icon">
              {wasteData.trash === 1 ? 
                <div className="wet-waste-icon"></div> : 
                wasteData.trash === 0 ? 
                <div className="dry-waste-icon"></div> : 
                <div className="unknown-waste-icon"></div>
              }
            </div>
          </div>
        </div>
        
        {/* Weight Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <Scale className="card-icon" />
            <h2>Weight</h2>
          </div>
          <div className="card-content">
            <p className="weight-value">{Math.abs(wasteData.weight)} gm</p>
            <div className="fill-level-container">
              <div className="fill-level-label">
                <span>Fill Level: {fillPercentage.toFixed(0)}%</span>
              </div>
              <div className="fill-level-bar">
                <div 
                  className={`fill-level-progress ${getFillStatus()}`} 
                  style={{ width: `${fillPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Price Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <IndianRupee className="card-icon" />
            <h2>Price</h2>
          </div>
          <div className="card-content">
            <p className="price-value">Rs {Math.abs(wasteData.price)}</p>
            <div className="price-note">
              Current waste processing fee
            </div>
          </div>
        </div>
        
        {/* Stats Card */}
        <div className="dashboard-card stats-card">
          <div className="card-header">
            <BarChart2 className="card-icon" />
            <h2>Statistics</h2>
          </div>
          <div className="card-content">
            <div className="stat-row">
              <div className="stat-label">Container Status:</div>
              <div className={`stat-value status-${getFillStatus()}`}>
                {fillPercentage >= 80 ? 'Almost Full' : 
                 fillPercentage >= 50 ? 'Half Full' : 
                 'Normal'}
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-label">Capacity Remaining:</div>
              <div className="stat-value">
                {(maxCapacity - Math.abs(wasteData.weight)).toFixed(1)} kg
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-label">Collection Schedule:</div>
              <div className="stat-value">
                {fillPercentage >= 80 ? 'Immediate' : 
                 fillPercentage >= 50 ? 'Within 24 hours' : 
                 'Regular Schedule'}
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-label">Waste Type:</div>
              <div className={`stat-value waste-type-${wasteData.trash === 1 ? 'dry' : wasteData.trash === 0 ? 'wet' : 'unknown'}`}>
                {wasteType}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-footer">
        <p>Last updated: {lastUpdated.toLocaleTimeString()} on {lastUpdated.toLocaleDateString()}</p>
        <p>IoT Waste Management System v1.2</p>
      </div>
    </div>
  );
};

export default WasteMonitorDashboard;