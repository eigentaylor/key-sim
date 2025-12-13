import React, { useState } from 'react';

const ElectoralSimulator = () => {
  const [numStates, setNumStates] = useState(30);
  const [states, setStates] = useState(null);
  const [elections, setElections] = useState(null);
  const [selectedElection, setSelectedElection] = useState(0);
  const [selectedState, setSelectedState] = useState(null);
  const [stateHistory, setStateHistory] = useState(null);
  const [evHistory, setEvHistory] = useState(null);

  const stateNames = [
    'Cascadia', 'Texoma', 'New Amsterdam', 'Heartland', 'Peachtree',
    'Superior', 'Allegheny', 'Sunshine', 'Prairie', 'Mountainview',
    'Lakeland', 'Riverdale', 'Coastland', 'Plainfield', 'Valleyforge',
    'Summitview', 'Bayshore', 'Forestland', 'Creekside', 'Ridgeway',
    'Meadowland', 'Stonegate', 'Pinewood', 'Oakmont', 'Maplegrove',
    'Cedarville', 'Willowbrook', 'Elmhurst', 'Ashland', 'Birchwood',
    'Cypress', 'Redwood', 'Sequoia', 'Magnolia', 'Dogwood',
    'Palmetto', 'Sycamore', 'Hickory', 'Juniper', 'Aspen',
    'Cottonwood', 'Spruce', 'Hemlock', 'Tamarack', 'Beechwood',
    'Chestnut', 'Walnut', 'Hazelwood', 'Ironwood', 'Rosewood',
    'Serenova', 'Tayloregon', 'Kenpxppet', 'Stankford', 'Bonebraska',
    'Waynesota', 'Taxachusetts', 'Aventadorado', 'Andiana', 'Owensylvania', 'Sbermuda', 'Nerevada',
    'New Patrick', 'Charleston III', 'agps', 'Ruoxippi', 'Lichtman Live', 'Prophet Republic', 'Ryawana', 
  ];
  STATES = [
    ("Serenova", "SN"), ("Redi Island", "RI"), ("Dantheland", "DL"), ("Ohio", "OH"), 
    ("Poxville", "PX"), ("Kenpxppet", "KP"), ("Tunafornia", "TF"), ("Tayloregon", "TO"), 
    ("Dissonysia", "DS"), ("Stankford", "SF"), ("Oppenhagen", "OP"), ("Elecctopia", "ET"), 
    ("Bonebraska", "BN"), ("Ianaheim", "IH"), ("Smokelahoma", "SO"), ("Atlaska", "AT"), 
    ("Waynesota", "WN"), ("Katzachusetts", "KS"), ("Andiana", "AD"), ("Gaussissippi", "GS"), 
    ("Jiggabama", "JB"), ("Owensylvania", "OS"), ("Taxachusetts", "TX"), ("Zachkota", "ZK"), 
    ("Aventadorado", "AV"), ("Skarizona", "SK"), ("Sbermuda", "SB"), ("Jonatucky", "JK"),
    ("Nerevada", "NV"), ("Mossouri", "MO"), ("New Patrick", "NP"), ("Ruoxippi", "RX"),
    ("Charleston III", "CI"), ("Ryawana", "RW"), ("Prophet Republic", "PR"), ("Lichtman Live", "LL"),
    ("agps", "AG"), 
]

  const arcTypes = {
    STABLE_BELLWETHER: { color: '#374151', textColor: '#F3F4F6', persistence: 0.92, trend: 0.001 },
    DIVERGING_TO_D: { color: '#60A5FA', textColor: '#1F2937', persistence: 0.88, trend: 0.025 },
    DIVERGING_TO_R: { color: '#F87171', textColor: '#1F2937', persistence: 0.88, trend: -0.025 },
    CONVERGING_FROM_D: { color: '#DBEAFE', textColor: '#1F2937', persistence: 0.85, trend: -0.020 },
    CONVERGING_FROM_R: { color: '#FEE2E2', textColor: '#1F2937', persistence: 0.85, trend: 0.020 },
    SAFE_D: { color: '#1E40AF', textColor: '#F3F4F6', persistence: 0.95, trend: 0.002 },
    SAFE_R: { color: '#991B1B', textColor: '#F3F4F6', persistence: 0.95, trend: -0.002 },
    RELIABLE_D: { color: '#3B82F6', textColor: '#F3F4F6', persistence: 0.90, trend: 0.005 },
    RELIABLE_R: { color: '#DC2626', textColor: '#F3F4F6', persistence: 0.90, trend: -0.005 },
    TRENDING_D: { color: '#2563EB', textColor: '#F3F4F6', persistence: 0.87, trend: 0.030 },
    TRENDING_R: { color: '#B91C1C', textColor: '#F3F4F6', persistence: 0.87, trend: -0.030 }
  };

  const regions = {
    NORTHEAST: { evShare: 0.17, dLean: 0.08, growth: -0.8 },
    MIDWEST: { evShare: 0.22, dLean: 0.02, growth: -0.6 },
    SOUTH: { evShare: 0.38, dLean: -0.05, growth: 0.8 },
    WEST: { evShare: 0.23, dLean: 0.04, growth: 0.6 }
  };

  const samplePowerLaw = (min, max, alpha = 2.0) => {
    const u = Math.random();
    return Math.floor(min * Math.pow(1 - u * (1 - Math.pow(min/max, alpha - 1)), 1/(1 - alpha)));
  };

  const normalRandom = (mean = 0, std = 1) => {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  };

  const classifyPosition = (relMargin) => {
    if (relMargin > 0.10) return 'Safe D';
    if (relMargin > 0.04) return 'Likely D';
    if (relMargin >= -0.04) return 'Bellwether';
    if (relMargin >= -0.10) return 'Likely R';
    return 'Safe R';
  };

  const formatMargin = (relMargin) => {
    const pct = Math.abs(relMargin * 100);
    const party = relMargin >= 0 ? 'D' : 'R';
    return `${party}+${pct.toFixed(1)}`;
  };

  const assignInitialArc = (relMargin, region) => {
    const abs = Math.abs(relMargin);
    
    if (abs < 0.04) {
      return Math.random() < 0.7 ? 'STABLE_BELLWETHER' : 'DIVERGING_TO_' + (Math.random() < 0.5 ? 'D' : 'R');
    } else if (abs < 0.10) {
      if (Math.abs(relMargin) > 0.07) {
        return relMargin > 0 ? 'RELIABLE_D' : 'RELIABLE_R';
      } else {
        return relMargin > 0 ? 'CONVERGING_FROM_D' : 'CONVERGING_FROM_R';
      }
    } else if (abs < 0.15) {
      return relMargin > 0 ? 'RELIABLE_D' : 'RELIABLE_R';
    } else {
      return relMargin > 0 ? 'SAFE_D' : 'SAFE_R';
    }
  };

  const updateArc = (currentArc, relMargin) => {
    const abs = Math.abs(relMargin);
    
    if (abs > 0.15) {
      return relMargin > 0 ? 'SAFE_D' : 'SAFE_R';
    } else if (abs > 0.10) {
      return relMargin > 0 ? 'RELIABLE_D' : 'RELIABLE_R';
    } else if (abs < 0.04) {
      if (currentArc.includes('DIVERGING')) {
        return currentArc;
      } else if (currentArc.includes('TRENDING')) {
        return 'STABLE_BELLWETHER';
      }
      return 'STABLE_BELLWETHER';
    } else if (abs < 0.10) {
      if (currentArc.includes('SAFE') || currentArc.includes('RELIABLE')) {
        return relMargin > 0 ? 'CONVERGING_FROM_D' : 'CONVERGING_FROM_R';
      } else if (currentArc === 'STABLE_BELLWETHER') {
        return relMargin > 0 ? 'DIVERGING_TO_D' : 'DIVERGING_TO_R';
      }
    }
    
    return currentArc;
  };

  const generateElectoralSystem = () => {
    const n = numStates;
    const regionKeys = Object.keys(regions);
    const selectedNames = stateNames.slice(0, n);
    
    // Initialize with balanced distribution
    const initialStates = selectedNames.map((name, i) => {
      const region = regionKeys[i % regionKeys.length];
      const regionData = regions[region];
      const baseEV = samplePowerLaw(3, 55, 2.0);
      
      return {
        name,
        region,
        baseEV,
        relMargin: 0,
        arc: 'STABLE_BELLWETHER',
        volatility: Math.abs(normalRandom(0, 0.03)) + 0.02,
        evGrowthRate: regionData.growth
      };
    });

    // Normalize EVs to 538
    const totalEV = initialStates.reduce((sum, s) => sum + s.baseEV, 0);
    initialStates.forEach(s => {
      s.currentEV = Math.round(s.baseEV * 538 / totalEV);
    });

    let currentTotal = initialStates.reduce((sum, s) => sum + s.currentEV, 0);
    while (currentTotal !== 538) {
      const idx = Math.floor(Math.random() * initialStates.length);
      if (currentTotal < 538 && initialStates[idx].currentEV < 50) {
        initialStates[idx].currentEV++;
        currentTotal++;
      } else if (currentTotal > 538 && initialStates[idx].currentEV > 3) {
        initialStates[idx].currentEV--;
        currentTotal--;
      }
    }

    // Balanced margin assignment
    initialStates.sort((a, b) => b.currentEV - a.currentEV);
    
    const targetBellwetherEVs = 538 * 0.20;
    const targetDEVs = 538 * 0.40;
    const targetREVs = 538 * 0.40;
    
    let currentDEVs = 0, currentREVs = 0, currentBellwetherEVs = 0;
    
    for (let state of initialStates) {
      const regionData = regions[state.region];
      let margin;
      
      const dNeed = targetDEVs - currentDEVs;
      const rNeed = targetREVs - currentREVs;
      const bNeed = targetBellwetherEVs - currentBellwetherEVs;
      
      if (bNeed > 0 && Math.random() < 0.25) {
        margin = normalRandom(0, 0.03);
        currentBellwetherEVs += state.currentEV;
      } else if (dNeed > rNeed) {
        margin = normalRandom(regionData.dLean + 0.08, 0.05);
        currentDEVs += state.currentEV;
      } else {
        margin = normalRandom(regionData.dLean - 0.08, 0.05);
        currentREVs += state.currentEV;
      }
      
      state.relMargin = margin;
      state.arc = assignInitialArc(margin, state.region);
    }

    // Track state history (arc changes and margins at key points)
    const history = {};
    const evHistory = {};
    selectedNames.forEach(name => {
      const state = initialStates.find(s => s.name === name);
      history[name] = [{ 
        year: 0, 
        arc: state.arc,
        margin: state.relMargin,
        category: classifyPosition(state.relMargin)
      }];
      evHistory[name] = [{ year: 0, ev: state.currentEV }];
    });

    // Generate timeline with all events
    const allEvents = [];
    const electionYears = [0, 4, 8, 12, 16, 20, 24, 28, 32];
    const censusYears = [0, 10, 20, 30];

    const createSnapshot = (year, type, evChanges = null) => {
      const stateSnapshot = initialStates.map(s => ({
        name: s.name,
        ev: s.currentEV,
        relMargin: s.relMargin,
        category: classifyPosition(s.relMargin),
        arc: s.arc,
        region: s.region
      }));

      const sorted = [...stateSnapshot].sort((a, b) => b.relMargin - a.relMargin);
      let cumulative = 0;
      let tippingState = null;
      for (const state of sorted) {
        cumulative += state.ev;
        if (cumulative >= 270) {
          tippingState = state;
          break;
        }
      }

      const categoryTotals = {
        'Safe D': 0, 'Likely D': 0, 'Bellwether': 0, 'Likely R': 0, 'Safe R': 0
      };
      stateSnapshot.forEach(s => categoryTotals[s.category] += s.ev);

      return {
        year,
        type,
        states: stateSnapshot,
        tippingState,
        categoryTotals,
        leanDEVs: categoryTotals['Safe D'] + categoryTotals['Likely D'],
        leanREVs: categoryTotals['Safe R'] + categoryTotals['Likely R'],
        evChanges
      };
    };

    // Process elections
    electionYears.forEach((year, idx) => {
      if (idx > 0) {
        initialStates.forEach(state => {
          const arcData = arcTypes[state.arc];
          const newMargin = arcData.persistence * state.relMargin + arcData.trend + normalRandom(0, state.volatility);
          const oldArc = state.arc;
          state.relMargin = newMargin;
          state.arc = updateArc(state.arc, newMargin);
          
          // Track arc changes
          if (oldArc !== state.arc) {
            history[state.name].push({ 
              year, 
              arc: state.arc,
              margin: state.relMargin,
              category: classifyPosition(state.relMargin)
            });
          }
        });
      }
      allEvents.push(createSnapshot(year, 'election'));
    });

    // Process censuses
    censusYears.forEach(censusYear => {
      const evChanges = [];
      const numToChange = Math.floor(n * (0.25 + Math.random() * 0.15));
      const statesToChange = new Set();
      
      while (statesToChange.size < numToChange) {
        statesToChange.add(Math.floor(Math.random() * n));
      }
      
      let totalChange = 0;
      const changes = [];
      
      initialStates.forEach((state, idx) => {
        if (statesToChange.has(idx)) {
          const growthFactor = 1 + (state.evGrowthRate / 100) * 10 + normalRandom(0, 0.5);
          let change = Math.max(-state.currentEV + 3, Math.min(Math.round(state.currentEV * growthFactor) - state.currentEV, 8));
          
          if (Math.abs(change) < 1 && Math.random() < 0.5) {
            change = Math.random() < 0.5 ? 1 : -1;
          }
          
          if (change !== 0) {
            changes.push({ idx, change, oldEV: state.currentEV });
            totalChange += change;
          }
        }
      });
      
      // Zero-sum balance
      if (totalChange !== 0) {
        const direction = totalChange > 0 ? -1 : 1;
        let remaining = Math.abs(totalChange);
        
        while (remaining > 0) {
          const idx = Math.floor(Math.random() * n);
          const state = initialStates[idx];
          const currentChange = changes.find(c => c.idx === idx)?.change || 0;
          const newEV = state.currentEV + currentChange + direction;
          
          if (newEV >= 3 && newEV <= 55) {
            const existing = changes.find(c => c.idx === idx);
            if (existing) {
              existing.change += direction;
            } else {
              changes.push({ idx, change: direction, oldEV: state.currentEV });
            }
            remaining--;
          }
        }
      }
      
      // Apply changes and track per state
      changes.forEach(({ idx, change, oldEV }) => {
        const state = initialStates[idx];
        state.currentEV += change;
        evChanges.push({ state: state.name, oldEV, newEV: state.currentEV, change });
        
        // Track in evHistory
        evHistory[state.name].push({ 
          year: censusYear, 
          ev: state.currentEV, 
          change: change 
        });
      });
      
      allEvents.push(createSnapshot(censusYear, 'census', evChanges.length > 0 ? evChanges : null));
    });

    // Sort by year and type
    allEvents.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.type === 'election' ? -1 : 1;
    });

    setStates(initialStates);
    setElections(allEvents);
    setStateHistory(history);
    setEvHistory(evHistory);
    setSelectedElection(0);
    setSelectedState(null);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Safe D': '#1E40AF', 'Likely D': '#3B82F6', 'Bellwether': '#6B7280',
      'Likely R': '#DC2626', 'Safe R': '#991B1B'
    };
    return colors[category];
  };

  const getArcColor = (arc) => arcTypes[arc]?.color || '#374151';
  const getArcTextColor = (arc) => arcTypes[arc]?.textColor || '#F3F4F6';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-blue-400">Electoral System Simulator</h1>
        <p className="text-gray-400 mb-6">Fictional US-like electoral systems with evolving state narratives</p>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Number of States</label>
              <input
                type="number"
                min="15"
                max="50"
                value={numStates}
                onChange={(e) => setNumStates(parseInt(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-4 py-2 w-32 text-gray-100"
              />
            </div>
            
            <button
              onClick={generateElectoralSystem}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium mt-6"
            >
              Generate System
            </button>
          </div>
        </div>

        {elections && (
          <>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-200">Timeline</h2>
              <div className="flex gap-2 flex-wrap">
                {elections.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedElection(idx)}
                    className={`px-4 py-2 rounded font-medium ${
                      selectedElection === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {item.type === 'election' ? '🗳️' : '📊'} Year {item.year}
                  </button>
                ))}
              </div>
            </div>

            {elections[selectedElection] && (
              <>
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-200">
                    Year {elections[selectedElection].year} - 
                    {elections[selectedElection].type === 'census' ? ' Post-Census' : ' Election'}
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-900/30 border border-blue-600 p-4 rounded">
                      <div className="text-sm font-medium text-gray-300">Total Lean D</div>
                      <div className="text-3xl font-bold text-blue-400">
                        {elections[selectedElection].leanDEVs} EVs
                      </div>
                      <div className="text-xs text-gray-400">Safe D + Likely D</div>
                    </div>
                    <div className="bg-red-900/30 border border-red-600 p-4 rounded">
                      <div className="text-sm font-medium text-gray-300">Total Lean R</div>
                      <div className="text-3xl font-bold text-red-400">
                        {elections[selectedElection].leanREVs} EVs
                      </div>
                      <div className="text-xs text-gray-400">Safe R + Likely R</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-4 mb-6">
                    {Object.entries(elections[selectedElection].categoryTotals).map(([cat, evs]) => (
                      <div
                        key={cat}
                        className="p-4 rounded border"
                        style={{ 
                          backgroundColor: getCategoryColor(cat) + '33',
                          borderColor: getCategoryColor(cat)
                        }}
                      >
                        <div className="text-sm font-medium text-gray-200">{cat}</div>
                        <div className="text-3xl font-bold" style={{ color: getCategoryColor(cat) }}>
                          {evs}
                        </div>
                        <div className="text-xs text-gray-400">electoral votes</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-700 p-4 rounded border-2" 
                       style={{ borderColor: getCategoryColor(elections[selectedElection].tippingState?.category) }}>
                    <div className="text-lg font-bold mb-2 text-gray-200">Tipping Point State</div>
                    {elections[selectedElection].tippingState && (
                      <div className="flex items-center gap-4 flex-wrap">
                        <div
                          className="px-4 py-2 rounded font-bold"
                          style={{ 
                            backgroundColor: getCategoryColor(elections[selectedElection].tippingState.category),
                            color: '#FFFFFF'
                          }}
                        >
                          {elections[selectedElection].tippingState.name}
                        </div>
                        <div className="text-gray-200">
                          {elections[selectedElection].tippingState.ev} EVs • 
                          <span className="font-bold ml-2" style={{ color: getCategoryColor(elections[selectedElection].tippingState.category) }}>
                            {elections[selectedElection].tippingState.category}
                          </span>
                          <span className="ml-2 font-mono">
                            {formatMargin(elections[selectedElection].tippingState.relMargin)}
                          </span>
                        </div>
                        {elections[selectedElection].tippingState.category !== 'Bellwether' && (
                          <div className="text-yellow-400 font-bold">⚠️ NOT IN BELLWETHER RANGE</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {elections[selectedElection].evChanges && (
                  <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-gray-200">
                      📊 Census Redistricting (Year {elections[selectedElection].year})
                    </h2>
                    <div className="mb-4 text-gray-300">
                      {elections[selectedElection].evChanges.length} states changed, 
                      {' '}{numStates - elections[selectedElection].evChanges.length} states unchanged
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-bold mb-2 text-green-400">Gaining EVs</h3>
                        {elections[selectedElection].evChanges
                          .filter(c => c.change > 0)
                          .sort((a, b) => b.change - a.change)
                          .map((change, idx) => (
                            <div key={idx} className="bg-gray-700 p-2 rounded mb-2 text-gray-200">
                              <span className="font-bold">{change.state}</span>: {change.oldEV} → {change.newEV} 
                              <span className="text-green-400 ml-2">+{change.change}</span>
                            </div>
                          ))}
                        {elections[selectedElection].evChanges.filter(c => c.change > 0).length === 0 && (
                          <div className="text-gray-500 italic">None</div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2 text-red-400">Losing EVs</h3>
                        {elections[selectedElection].evChanges
                          .filter(c => c.change < 0)
                          .sort((a, b) => a.change - b.change)
                          .map((change, idx) => (
                            <div key={idx} className="bg-gray-700 p-2 rounded mb-2 text-gray-200">
                              <span className="font-bold">{change.state}</span>: {change.oldEV} → {change.newEV} 
                              <span className="text-red-400 ml-2">{change.change}</span>
                            </div>
                          ))}
                        {elections[selectedElection].evChanges.filter(c => c.change < 0).length === 0 && (
                          <div className="text-gray-500 italic">None</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-200">
                    State Details (sorted by margin) - Click to see narrative arc
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {elections[selectedElection].states
                      .sort((a, b) => b.relMargin - a.relMargin)
                      .map((state, idx) => (
                        <div key={idx}>
                          <div
                            className="p-3 rounded flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ 
                              backgroundColor: getArcColor(state.arc),
                              color: getArcTextColor(state.arc)
                            }}
                            onClick={() => setSelectedState(selectedState === state.name ? null : state.name)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div
                                className="px-3 py-1 rounded font-bold text-sm"
                                style={{ backgroundColor: getCategoryColor(state.category), color: '#FFFFFF' }}
                              >
                                {state.category}
                              </div>
                              <div className="font-bold">{state.name}</div>
                              <div className="text-sm opacity-75">{state.arc.replace(/_/g, ' ')}</div>
                              <div className="font-mono text-sm font-bold">{formatMargin(state.relMargin)}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{state.ev} EVs</div>
                              <div className="text-xs opacity-75">{state.region}</div>
                            </div>
                          </div>
                          
                          {selectedState === state.name && stateHistory[state.name] && (
                            <div className="bg-gray-700 p-4 rounded-b border-t-2 border-blue-500">
                              <div className="mb-4">
                                <div className="text-sm font-bold mb-2 text-gray-200">Trajectory Arc Evolution:</div>
                                <div className="flex flex-wrap gap-2">
                                  {stateHistory[state.name].map((entry, i) => (
                                    <div key={i} className="flex items-center">
                                      <div className="px-3 py-2 rounded text-xs bg-gray-600 text-gray-100">
                                        <div className="font-bold">{entry.arc.replace(/_/g, ' ')}</div>
                                        <div className="text-gray-300 mt-1">
                                          Year {entry.year}: {formatMargin(entry.margin)}
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                          ({entry.category})
                                        </div>
                                      </div>
                                      {i < stateHistory[state.name].length - 1 && (
                                        <span className="mx-2 text-gray-400 text-lg">→</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {evHistory && evHistory[state.name] && evHistory[state.name].length > 1 && (
                                <div className="pt-4 border-t border-gray-600">
                                  <div className="text-sm font-bold mb-2 text-gray-200">Electoral Vote History:</div>
                                  <div className="flex flex-wrap gap-2">
                                    {evHistory[state.name].map((entry, i) => (
                                      <div key={i} className="flex items-center">
                                        <div className="px-3 py-2 rounded text-xs bg-gray-600 text-gray-100">
                                          <div className="font-bold">Year {entry.year}</div>
                                          <div className="text-gray-300 mt-1">
                                            {entry.ev} EVs
                                            {entry.change && (
                                              <span className={entry.change > 0 ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                                                {entry.change > 0 ? '+' : ''}{entry.change}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {i < evHistory[state.name].length - 1 && (
                                          <span className="mx-2 text-gray-400">→</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ElectoralSimulator;
