import React, { useState } from 'react';

const KeysSimulator = () => {
  const [numElections, setNumElections] = useState(4);
  const [elections, setElections] = useState([]);
  
  const keyNames = [
    'Mandate',
    'Contest',
    'Incumbent',
    'No 3rd party',
    'ST economy',
    'LT economy',
    'Policy change',
    'No unrest',
    'No scandal',
    'No Military failure',
    'Military Success',
    'Incumbent rizz',
    'No challenger rizz'
  ];
  
  const keyDescriptions = {
    'Mandate': 'Incumbent party gained seats in midterms',
    'Contest': 'No serious primary contest for incumbent party',
    'Incumbent': 'Incumbent president is running',
    'No 3rd party': 'No significant third party challenger',
    'ST economy': 'Short-term economy is strong',
    'LT economy': 'Long-term economic growth during term',
    'Policy change': 'Major policy change enacted',
    'No unrest': 'No sustained social unrest',
    'No scandal': 'No major scandal involving incumbent',
    'No Military failure': 'No major military/foreign policy failure',
    'Military Success': 'Major military/foreign policy success',
    'Incumbent rizz': 'Incumbent is charismatic/national hero',
    'No challenger rizz': 'Challenger is not charismatic/national hero'
  };
  
  // Generate keys using empirical correlations from historical data
  const generateKeys = () => {
    // Empirical probabilities from keys_with_npv.csv (n=42 elections)
    const trueProbabilities = {
      'Mandate': 0.310,
      'Contest': 0.714,
      'Incumbent': 0.595,
      'No 3rd party': 0.810,
      'ST economy': 0.738,
      'LT economy': 0.548,
      'Policy change': 0.500,
      'No unrest': 0.738,
      'No scandal': 0.857,
      'No Military failure': 0.714,
      'Military Success': 0.548,
      'Incumbent rizz': 0.238,
      'No challenger rizz': 0.833
    };
    
    // Correlation matrix (top correlations from data)
    // ST economy ↔ LT economy: r=0.438
    // Mandate ↔ ST economy: r=0.399
    // Contest ↔ Incumbent: r=0.337
    // Mandate ↔ No 3rd party: r=0.325
    
    // Use Gaussian copula approach: generate correlated normals, then threshold
    const correlatedKeys = generateCorrelatedKeys(trueProbabilities);
    
    return correlatedKeys;
  };
  
  // Helper function to generate correlated binary keys
  const generateCorrelatedKeys = (trueProbabilities) => {
    // Generate base normal variables
    const z = {};
    keyNames.forEach(name => {
      z[name] = normalRandom();
    });
    
    // Apply key correlations via linear combinations
    // ST economy and LT economy are correlated
    const economyBase = normalRandom();
    z['ST economy'] = 0.66 * economyBase + 0.75 * z['ST economy']; // r ≈ 0.44
    z['LT economy'] = 0.66 * economyBase + 0.75 * z['LT economy'];
    
    // Mandate and ST economy correlation
    const mandateEconBase = normalRandom();
    z['Mandate'] = 0.63 * mandateEconBase + 0.77 * z['Mandate']; // r ≈ 0.40
    z['ST economy'] = 0.63 * mandateEconBase + 0.77 * z['ST economy'];
    
    // Contest and Incumbent correlation
    const contestIncBase = normalRandom();
    z['Contest'] = 0.58 * contestIncBase + 0.81 * z['Contest']; // r ≈ 0.34
    z['Incumbent'] = 0.58 * contestIncBase + 0.81 * z['Incumbent'];
    
    // Mandate and No 3rd party correlation
    const mandate3rdBase = normalRandom();
    z['Mandate'] = 0.57 * mandate3rdBase + 0.82 * z['Mandate']; // r ≈ 0.33
    z['No 3rd party'] = 0.57 * mandate3rdBase + 0.82 * z['No 3rd party'];
    
    // Incumbent and No 3rd party negative correlation
    z['No 3rd party'] = z['No 3rd party'] - 0.28 * z['Incumbent']; // r ≈ -0.28
    
    // Convert to binary via thresholds
    const keys = {};
    keyNames.forEach(name => {
      // Use inverse normal CDF approximation
      const threshold = normalQuantile(1 - trueProbabilities[name]);
      keys[name] = z[name] > threshold;
    });
    
    return keys;
  };
  
  // Box-Muller transform for normal random variables
  const normalRandom = () => {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  
  // Approximate inverse normal CDF
  const normalQuantile = (p) => {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;
    
    // Rational approximation (Beasley-Springer-Moro algorithm)
    const q = p - 0.5;
    if (Math.abs(q) <= 0.42) {
      const r = q * q;
      return q * ((((-25.44106049637 * r + 41.39119773534) * r - 18.61500062529) * r + 2.50662823884) * r + -0.0) /
        ((((3.13082909833 * r - 21.06224101826) * r + 23.08336743743) * r - 8.47351093090) * r + 1.0);
    } else {
      let r = q < 0 ? p : 1 - p;
      r = Math.sqrt(-Math.log(r));
      const sign = q < 0 ? -1 : 1;
      return sign * (((2.32121276858 * r + 4.85014127135) * r - 2.29796479134) * r - 2.78718931138) /
        ((1.63706781897 * r + 3.54388924762) * r + 1.0);
    }
  };
  
  // Calculate NPV from keys using empirical relationship
  const calculateNPV = (keys) => {
    const falseKeys = keyNames.filter(name => !keys[name]).length;
    
    // Empirical linear model from 42 elections:
    // NPV = 20.2% - 3.5% × false_keys + ε
    const intercept = 0.202;
    const slope = -0.035;
    const baseNPV = intercept + slope * falseKeys;
    
    // Residual variance: mixture model to capture both typical and landslide elections
    // 90% typical: σ = 8%
    // 10% landslide/realignment: σ = 20%
    const isLandslideElection = Math.random() < 0.10;
    const sigma = isLandslideElection ? 0.20 : 0.08;
    
    // Generate normally distributed noise
    const noise = normalRandom() * sigma;
    
    return baseNPV + noise;
  };
  
  const generateElections = () => {
    const newElections = [];
    let currentYear = 2028;
    let incumbentParty = 'R'; // Republicans won 2024
    
    for (let i = 0; i < numElections; i++) {
      const keys = generateKeys();
      const npv = calculateNPV(keys);
      const falseKeys = keyNames.filter(name => !keys[name]).length;
      
      // Positive NPV means incumbent wins, negative means challenger wins
      const incumbentWins = npv > 0;
      const winner = incumbentWins ? incumbentParty : (incumbentParty === 'R' ? 'D' : 'R');
      
      newElections.push({
        year: currentYear,
        keys,
        falseKeys,
        npv,
        incumbentParty,
        winner,
        predicted: falseKeys < 6 ? 'Incumbent' : 'Challenger'
      });
      
      // Update incumbent for next cycle
      incumbentParty = winner;
      currentYear += 4;
    }
    
    setElections(newElections);
  };
  
  const getNarrativeTone = (falseKeys, npv) => {
    // Based on NPV, not strict key threshold
    if (npv > 0.15) return { text: 'Landslide for incumbent - dominant fundamentals', color: 'text-blue-400' };
    if (npv > 0.08) return { text: 'Strong incumbent advantage', color: 'text-blue-300' };
    if (npv > 0.03) return { text: 'Incumbent favored', color: 'text-blue-200' };
    if (npv > -0.03) return { text: 'Toss-up - fundamentals mixed', color: 'text-yellow-400' };
    if (npv > -0.08) return { text: 'Challenger favored', color: 'text-red-200' };
    if (npv > -0.15) return { text: 'Strong challenger advantage', color: 'text-red-300' };
    return { text: 'Landslide for challenger - wave election', color: 'text-red-400' };
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-blue-400">Electoral Keys Simulator</h1>
        <p className="text-gray-400 mb-8">
          Generate plausible Keys to the White House scenarios with corresponding NPV predictions
        </p>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Elections</label>
              <select 
                value={numElections}
                onChange={(e) => setNumElections(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-4 py-2"
              >
                <option value={3}>3 elections</option>
                <option value={4}>4 elections</option>
                <option value={5}>5 elections</option>
              </select>
            </div>
            
            <button
              onClick={generateElections}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium mt-6"
            >
              Generate Elections
            </button>
          </div>
          
          {elections.length > 0 && (
            <div className="mt-6 text-sm text-gray-400">
              <p className="font-medium mb-1">Empirical Model (from n=42 elections, 1864-2024):</p>
              <p>• NPV = 20.2% - 3.5% × false_keys + ε</p>
              <p>• ε ~ 90% N(0,8%) + 10% N(0,20%) [mixture for landslides]</p>
              <p>• Correlation: r = -0.757, R² = 0.573</p>
              <p>• Each false key → -3.5% for incumbent (on average)</p>
              <p className="mt-2 font-medium">Most Important Keys (by individual correlation):</p>
              <p>• ST economy (r=0.56): Strong economy is the #1 predictor</p>
              <p>• Contest (r=0.56): No primary drama = major advantage</p>
              <p>• No challenger rizz (r=0.39): Weak opponents help significantly</p>
              <p>• Incumbent rizz (r=0.36): Charisma matters (when present)</p>
              <p className="mt-2 font-medium">Key Correlations:</p>
              <p>• ST ↔ LT economy: r=0.44 (economic persistence)</p>
              <p>• Mandate ↔ ST economy: r=0.40 (good economy → midterm gains)</p>
              <p>• Contest ↔ Incumbent: r=0.34 (incumbent → less primary drama)</p>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          {elections.map((election, idx) => {
            const narrative = getNarrativeTone(election.falseKeys, election.npv);
            
            return (
              <div key={idx} className="bg-gray-800 rounded-lg p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-300">{election.year} Election</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Incumbent: <span className={election.incumbentParty === 'R' ? 'text-red-400' : 'text-blue-400'}>
                        {election.incumbentParty === 'R' ? 'Republicans' : 'Democrats'}
                      </span>
                    </p>
                    <p className={`text-lg font-medium mt-1 ${narrative.color}`}>
                      {narrative.text}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      <span className={election.npv > 0 ? 'text-green-400' : 'text-orange-400'}>
                        {election.npv > 0 ? 'Inc+' : 'Chal+'}{Math.abs(election.npv * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {election.falseKeys} false keys
                    </div>
                    <div className={`text-sm font-medium mt-1 ${election.winner === 'R' ? 'text-red-400' : 'text-blue-400'}`}>
                      Winner: {election.winner === 'R' ? 'Republicans' : 'Democrats'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {keyNames.map((keyName, keyIdx) => {
                    const value = election.keys[keyName];
                    return (
                      <div 
                        key={keyIdx}
                        className={`p-3 rounded ${value ? 'bg-gray-700' : 'bg-red-900/30 border border-red-800'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{keyName}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            value ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                          }`}>
                            {value ? 'TRUE' : 'FALSE'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {keyDescriptions[keyName]}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 p-3 bg-gray-700 rounded">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold">Electoral Narrative: </span>
                    {Math.abs(election.npv) > 0.15 && "Overwhelming fundamentals create a landslide environment. Economic conditions, incumbent performance, and political dynamics all align to produce a decisive result."}
                    {Math.abs(election.npv) <= 0.15 && Math.abs(election.npv) > 0.08 && "Strong fundamentals favor one side. Multiple structural advantages create a clear, though not overwhelming, edge."}
                    {Math.abs(election.npv) <= 0.08 && Math.abs(election.npv) > 0.03 && "Fundamentals lean in one direction. The favored side has real advantages, but the race remains contestable."}
                    {Math.abs(election.npv) <= 0.03 && "Fundamentals are evenly balanced. This is a true toss-up where campaign dynamics, candidate quality, and late-breaking events could decide the outcome. The keys suggest no clear structural advantage."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {elections.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Series Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Avg False Keys</div>
                <div className="text-2xl font-bold text-blue-400">
                  {(elections.reduce((sum, e) => sum + e.falseKeys, 0) / elections.length).toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Avg NPV Magnitude</div>
                <div className="text-2xl font-bold text-blue-400">
                  {(elections.reduce((sum, e) => sum + Math.abs(e.npv), 0) / elections.length * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Democratic Wins</div>
                <div className="text-2xl font-bold text-blue-400">
                  {elections.filter(e => e.winner === 'D').length}/{elections.length}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Republican Wins</div>
                <div className="text-2xl font-bold text-red-400">
                  {elections.filter(e => e.winner === 'R').length}/{elections.length}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Incumbent party track record: {elections.filter(e => e.npv > 0).length} wins, {elections.filter(e => e.npv < 0).length} losses
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeysSimulator;
