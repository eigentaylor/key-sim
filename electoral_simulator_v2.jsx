import React, { useState } from 'react';

const ElectoralSimulator = () => {
  const [numStates, setNumStates] = useState(30);
  const [states, setStates] = useState(null);
  const [elections, setElections] = useState(null);
  const [selectedElection, setSelectedElection] = useState(0);
  const [selectedState, setSelectedState] = useState(null);
  const [stateHistory, setStateHistory] = useState(null);
  const [evHistory, setEvHistory] = useState(null);
  const [viewMode, setViewMode] = useState('raw'); // 'raw', 'lean', or 'keys'

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

  const keyNames = [
    'Mandate', 'Contest', 'Incumbent', 'No 3rd party',
    'ST economy', 'LT economy', 'Policy change', 'No unrest',
    'No scandal', 'No Military failure', 'Military Success',
    'Incumbent rizz', 'No challenger rizz'
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

  // ============================================================================
  // KEYS GENERATION (Gaussian Copula)
  // ============================================================================

  const normalRandom = (mean = 0, std = 1) => {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  };

  const normalQuantile = (p) => {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;

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

  const generateCorrelatedKeys = (trueProbabilities) => {
    const z = {};
    keyNames.forEach(name => {
      z[name] = normalRandom();
    });

    // Apply correlations
    const economyBase = normalRandom();
    z['ST economy'] = 0.66 * economyBase + 0.75 * z['ST economy'];
    z['LT economy'] = 0.66 * economyBase + 0.75 * z['LT economy'];

    const mandateEconBase = normalRandom();
    z['Mandate'] = 0.63 * mandateEconBase + 0.77 * z['Mandate'];
    z['ST economy'] = 0.63 * mandateEconBase + 0.77 * z['ST economy'];

    const contestIncBase = normalRandom();
    z['Contest'] = 0.58 * contestIncBase + 0.81 * z['Contest'];
    z['Incumbent'] = 0.58 * contestIncBase + 0.81 * z['Incumbent'];

    const mandate3rdBase = normalRandom();
    z['Mandate'] = 0.57 * mandate3rdBase + 0.82 * z['Mandate'];
    z['No 3rd party'] = 0.57 * mandate3rdBase + 0.82 * z['No 3rd party'];

    z['No 3rd party'] = z['No 3rd party'] - 0.28 * z['Incumbent'];

    const keys = {};
    keyNames.forEach(name => {
      const threshold = normalQuantile(1 - trueProbabilities[name]);
      keys[name] = z[name] > threshold;
    });

    return keys;
  };

  const generateKeys = () => {
    const trueProbabilities = {
      'Mandate': 0.310, 'Contest': 0.714, 'Incumbent': 0.595,
      'No 3rd party': 0.810, 'ST economy': 0.738, 'LT economy': 0.548,
      'Policy change': 0.500, 'No unrest': 0.738, 'No scandal': 0.857,
      'No Military failure': 0.714, 'Military Success': 0.548,
      'Incumbent rizz': 0.238, 'No challenger rizz': 0.833
    };
    return generateCorrelatedKeys(trueProbabilities);
  };

  const calculateNPV = (keys) => {
    const falseKeys = keyNames.filter(name => !keys[name]).length;
    const intercept = 0.202;
    const slope = -0.035;
    const baseNPV = intercept + slope * falseKeys;

    // Variance dampening: Keys are more predictive at extremes, less at threshold
    const distanceFromThreshold = Math.abs(falseKeys - 6);
    const baseSigma = 0.074;
    const minSigma = 0.030;
    const confidenceFactor = Math.exp(-distanceFromThreshold / 2.5);
    const sigma = minSigma + (baseSigma - minSigma) * confidenceFactor;

    let noise = normalRandom() * sigma;

    // Historical fact: NO incumbent has EVER won with 6+ false keys
    // Add slight bias to ensure challenger advantage at 6+ keys
    if (falseKeys >= 6 && baseNPV + noise > 0) {
      // If we rolled positive (incumbent win), pull it back slightly
      // This makes 6+ keys ~95% accurate for challenger instead of ~55%
      noise -= 0.02; // Small bias toward challenger
    }

    // Hard bounds at ±30% to prevent unrealistic landslides
    const unboundedNPV = baseNPV + noise;
    const npv = Math.max(-0.30, Math.min(0.30, unboundedNPV));

    return npv;
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const samplePowerLaw = (min, max, alpha = 2.0) => {
    const u = Math.random();
    return Math.floor(min * Math.pow(1 - u * (1 - Math.pow(min / max, alpha - 1)), 1 / (1 - alpha)));
  };

  const classifyPosition = (relMargin) => {
    if (relMargin > 0.15) return 'Safe D';
    if (relMargin > 0.05) return 'Likely D';
    if (relMargin >= -0.05) return 'Bellwether';
    if (relMargin >= -0.15) return 'Likely R';
    return 'Safe R';
  };

  const classifyRawMargin = (rawMargin) => {
    const abs = Math.abs(rawMargin);
    if (rawMargin > 0) {
      if (abs > 0.25) return 'Safe D';
      if (abs > 0.10) return 'Likely D';
      if (abs > 0.03) return 'Lean D';
      return 'Tilt D';
    } else {
      if (abs > 0.25) return 'Safe R';
      if (abs > 0.10) return 'Likely R';
      if (abs > 0.03) return 'Lean R';
      return 'Tilt R';
    }
  };

  const formatMargin = (margin) => {
    const pct = Math.abs(margin * 100);
    const party = margin >= 0 ? 'D' : 'R';
    return `${party}+${pct.toFixed(1)}`;
  };

  const formatNPV = (npv, incumbentParty) => {
    // NPV is incumbent-relative, so convert to actual party winner
    const pct = Math.abs(npv * 100);
    let winningParty;
    if (npv > 0) {
      // Incumbent wins
      winningParty = incumbentParty;
    } else {
      // Challenger wins
      winningParty = incumbentParty === 'D' ? 'R' : 'D';
    }
    return `${winningParty}+${pct.toFixed(1)}`;
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

  const getCategoryColor = (category) => {
    const colors = {
      'Safe D': '#1E40AF', 'Likely D': '#3B82F6', 'Bellwether': '#6B7280',
      'Likely R': '#DC2626', 'Safe R': '#991B1B'
    };
    return colors[category];
  };

  const getRawMarginColor = (category) => {
    const colors = {
      'Safe D': '#1E40AF', 'Likely D': '#3B82F6', 'Lean D': '#60A5FA', 'Tilt D': '#93C5FD',
      'Tilt R': '#FCA5A5', 'Lean R': '#F87171', 'Likely R': '#DC2626', 'Safe R': '#991B1B'
    };
    return colors[category];
  };

  const getArcColor = (arc) => arcTypes[arc]?.color || '#374151';
  const getArcTextColor = (arc) => arcTypes[arc]?.textColor || '#F3F4F6';

  // ============================================================================
  // ELECTORAL SYSTEM GENERATION
  // ============================================================================

  const generateElectoralSystem = () => {
    const n = numStates;
    const regionKeys = Object.keys(regions);
    const selectedNames = stateNames.slice(0, n);

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

    // Track state history
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

    let incumbentParty = Math.random() < 0.5 ? 'D' : 'R';

    const createSnapshot = (year, type, evChanges = null, keys = null, npv = null) => {
      const stateSnapshot = initialStates.map(s => ({
        name: s.name,
        ev: s.currentEV,
        relMargin: s.relMargin,
        // NPV is incumbent-relative! Must convert to D-R margin
        // If Dem incumbent: NPV > 0 means D wins, so add to relMargin
        // If Rep incumbent: NPV > 0 means R wins, so subtract from relMargin
        rawMargin: npv !== null
          ? (incumbentParty === 'D' ? s.relMargin + npv : s.relMargin - npv)
          : null,
        category: classifyPosition(s.relMargin),
        rawCategory: npv !== null
          ? classifyRawMargin(incumbentParty === 'D' ? s.relMargin + npv : s.relMargin - npv)
          : null,
        arc: s.arc,
        region: s.region
      }));

      // Calculate results if this is an election
      let electionResults = null;
      if (type === 'election' && npv !== null) {
        const sorted = [...stateSnapshot].sort((a, b) => b.rawMargin - a.rawMargin);

        let dEVs = 0, rEVs = 0;
        let tippingState = null;
        let cumulative = 0;

        for (const state of sorted) {
          if (state.rawMargin > 0) {
            dEVs += state.ev;
          } else {
            rEVs += state.ev;
          }

          cumulative += state.ev;
          if (cumulative >= 270 && !tippingState) {
            tippingState = state;
          }
        }

        const ecWinner = dEVs >= 270 ? 'D' : 'R';

        // NPV is INCUMBENT-RELATIVE, not D-R relative!
        // Positive NPV = incumbent wins PV, negative = challenger wins
        const pvWinner = incumbentParty === 'D'
          ? (npv > 0 ? 'D' : 'R')  // If Dems incumbent: positive NPV = Dem win
          : (npv > 0 ? 'R' : 'D'); // If Reps incumbent: positive NPV = Rep win

        const ecPvMismatch = ecWinner !== pvWinner;

        // Count close states (within 1%)
        const closeStates = stateSnapshot.filter(s => Math.abs(s.rawMargin) < 0.01);

        electionResults = {
          dEVs,
          rEVs,
          ecWinner,
          pvWinner,
          npv,
          ecPvMismatch,
          tippingState,
          closeStates,
          falseKeys: keys ? keyNames.filter(k => !keys[k]).length : null
        };
      }

      // Lean-based tipping point (for lean view)
      const leanSorted = [...stateSnapshot].sort((a, b) => b.relMargin - a.relMargin);
      let leanCumulative = 0;
      let leanTippingState = null;
      for (const state of leanSorted) {
        leanCumulative += state.ev;
        if (leanCumulative >= 270) {
          leanTippingState = state;
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
        leanTippingState,
        categoryTotals,
        leanDEVs: categoryTotals['Safe D'] + categoryTotals['Likely D'],
        leanREVs: categoryTotals['Safe R'] + categoryTotals['Likely R'],
        evChanges,
        keys,
        electionResults,
        incumbentParty: type === 'election' ? incumbentParty : null
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

      // Generate keys and NPV for this election
      const keys = generateKeys();
      const npv = calculateNPV(keys);

      const snapshot = createSnapshot(year, 'election', null, keys, npv);

      // Update incumbent based on EC winner
      if (snapshot.electionResults) {
        incumbentParty = snapshot.electionResults.ecWinner;
      }

      allEvents.push(snapshot);
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

      changes.forEach(({ idx, change, oldEV }) => {
        const state = initialStates[idx];
        state.currentEV += change;
        evChanges.push({ state: state.name, oldEV, newEV: state.currentEV, change });

        evHistory[state.name].push({
          year: censusYear,
          ev: state.currentEV,
          change: change
        });
      });

      allEvents.push(createSnapshot(censusYear, 'census', evChanges.length > 0 ? evChanges : null));
    });

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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-blue-400">Electoral System Simulator v2</h1>
        <p className="text-gray-400 mb-6">With integrated Keys-NPV model and election results</p>

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
                    className={`px-4 py-2 rounded font-medium ${selectedElection === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    {item.type === 'election' ? '🗳️' : '📊'} Year {item.year}
                  </button>
                ))}
              </div>
            </div>

            {elections[selectedElection] && elections[selectedElection].type === 'election' && elections[selectedElection].electionResults && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6 border-l-4 border-yellow-500">
                <h2 className="text-2xl font-bold mb-4 text-gray-200">
                  Year {elections[selectedElection].year} Election Results
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className={`p-4 rounded border-2 ${elections[selectedElection].electionResults.ecWinner === 'D' ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 bg-gray-700'
                    }`}>
                    <div className="text-sm font-medium text-gray-300">Democrats - EC</div>
                    <div className="text-3xl font-bold text-blue-400">
                      {elections[selectedElection].electionResults.dEVs}
                    </div>
                    {elections[selectedElection].electionResults.ecWinner === 'D' && (
                      <div className="text-xs text-green-400 mt-1">✓ WINNER</div>
                    )}
                  </div>

                  <div className={`p-4 rounded border-2 ${elections[selectedElection].electionResults.ecWinner === 'R' ? 'border-red-500 bg-red-900/30' : 'border-gray-600 bg-gray-700'
                    }`}>
                    <div className="text-sm font-medium text-gray-300">Republicans - EC</div>
                    <div className="text-3xl font-bold text-red-400">
                      {elections[selectedElection].electionResults.rEVs}
                    </div>
                    {elections[selectedElection].electionResults.ecWinner === 'R' && (
                      <div className="text-xs text-green-400 mt-1">✓ WINNER</div>
                    )}
                  </div>

                  <div className="p-4 rounded bg-gray-700">
                    <div className="text-sm font-medium text-gray-300">National PV</div>
                    <div className={`text-3xl font-bold ${elections[selectedElection].electionResults.pvWinner === 'D' ? 'text-blue-400' : 'text-red-400'
                      }`}>
                      {formatNPV(elections[selectedElection].electionResults.npv, elections[selectedElection].incumbentParty)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {elections[selectedElection].electionResults.pvWinner === 'D' ? 'Dem' : 'Rep'} wins PV
                    </div>
                  </div>

                  <div className="p-4 rounded bg-gray-700">
                    <div className="text-sm font-medium text-gray-300">False Keys</div>
                    <div className="text-3xl font-bold text-yellow-400">
                      {elections[selectedElection].electionResults.falseKeys}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {elections[selectedElection].electionResults.falseKeys >= 6
                        ? `Predicts loss for incumbent (${elections[selectedElection].incumbentParty === 'D' ? 'Democrats' : 'Republicans'})`
                        : `Predicts win for incumbent (${elections[selectedElection].incumbentParty === 'D' ? 'Democrats' : 'Republicans'})`
                      }
                    </div>
                  </div>
                </div>

                {elections[selectedElection].electionResults.ecPvMismatch && (
                  <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <div className="font-bold text-yellow-400">EC-PV MISMATCH</div>
                        <div className="text-sm text-gray-300">
                          {elections[selectedElection].electionResults.ecWinner === 'D' ? 'Democrats' : 'Republicans'} win EC,
                          but {elections[selectedElection].electionResults.pvWinner === 'D' ? 'Democrats' : 'Republicans'} win popular vote
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-700 p-4 rounded mb-4">
                  <div className="text-sm font-bold mb-2 text-gray-200">Incumbent Party</div>
                  <div className={`text-lg font-bold ${elections[selectedElection].incumbentParty === 'D' ? 'text-blue-400' : 'text-red-400'
                    }`}>
                    {elections[selectedElection].incumbentParty === 'D' ? 'Democrats' : 'Republicans'}
                  </div>
                </div>

                {elections[selectedElection].electionResults.closeStates.length > 0 && (
                  <div className="bg-gray-700 p-4 rounded">
                    <div className="text-sm font-bold mb-2 text-gray-200">
                      Close States (within 1%): {elections[selectedElection].electionResults.closeStates.length} states,{' '}
                      {elections[selectedElection].electionResults.closeStates.reduce((sum, s) => sum + s.ev, 0)} EVs
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {elections[selectedElection].electionResults.closeStates.map((state, i) => (
                        <div key={i} className="px-3 py-1 rounded bg-yellow-900/30 border border-yellow-600 text-sm">
                          <span className="font-bold">{state.name}</span> ({state.ev} EVs): {formatMargin(state.rawMargin)}
                          <span className="text-gray-400 ml-2">(Lean {formatMargin(state.relMargin)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {elections[selectedElection] && (
              <>
                {/* Lean Structure - Always Visible */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-200">
                    Year {elections[selectedElection].year} Lean Structure
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
                    style={{ borderColor: getCategoryColor(elections[selectedElection].leanTippingState?.category) }}>
                    <div className="text-lg font-bold mb-2 text-gray-200">Lean-Based Tipping Point State</div>
                    {elections[selectedElection].leanTippingState && (
                      <div className="flex items-center gap-4 flex-wrap">
                        <div
                          className="px-4 py-2 rounded font-bold"
                          style={{
                            backgroundColor: getCategoryColor(elections[selectedElection].leanTippingState.category),
                            color: '#FFFFFF'
                          }}
                        >
                          {elections[selectedElection].leanTippingState.name}
                        </div>
                        <div className="text-gray-200">
                          {elections[selectedElection].leanTippingState.ev} EVs •
                          <span className="font-bold ml-2" style={{ color: getCategoryColor(elections[selectedElection].leanTippingState.category) }}>
                            {elections[selectedElection].leanTippingState.category}
                          </span>
                          <span className="ml-2 font-mono">
                            {formatMargin(elections[selectedElection].leanTippingState.relMargin)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Mode Selector and Content */}
                {elections[selectedElection].type === 'election' && elections[selectedElection].keys && (
                  <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-200">View Election Data</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewMode('raw')}
                          className={`px-4 py-2 rounded font-medium ${viewMode === 'raw' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                          Raw Margin
                        </button>
                        <button
                          onClick={() => setViewMode('lean')}
                          className={`px-4 py-2 rounded font-medium ${viewMode === 'lean' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                          Lean
                        </button>
                        <button
                          onClick={() => setViewMode('keys')}
                          className={`px-4 py-2 rounded font-medium ${viewMode === 'keys' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                          Keys
                        </button>
                      </div>
                    </div>

                    {viewMode === 'keys' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {keyNames.map((keyName, keyIdx) => {
                          const value = elections[selectedElection].keys[keyName];
                          return (
                            <div
                              key={keyIdx}
                              className={`p-3 rounded ${value ? 'bg-gray-700' : 'bg-red-900/30 border border-red-800'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{keyName}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${value ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
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
                    )}
                  </div>
                )}

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
                    State Details - Click to see narrative arc
                    {elections[selectedElection].type === 'election' && (
                      <span className="text-sm font-normal text-gray-400 ml-4">
                        (View mode only affects coloring)
                      </span>
                    )}
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {elections[selectedElection].states
                      .sort((a, b) => {
                        if (viewMode === 'raw' && a.rawMargin !== null && b.rawMargin !== null) {
                          return b.rawMargin - a.rawMargin;
                        }
                        return b.relMargin - a.relMargin;
                      })
                      .map((state, idx) => {
                        const isClose = state.rawMargin !== null && Math.abs(state.rawMargin) < 0.01;

                        return (
                          <div key={idx}>
                            <div
                              className={`p-3 rounded flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity ${isClose && viewMode === 'raw' ? 'ring-2 ring-yellow-500' : ''
                                }`}
                              style={{
                                backgroundColor: viewMode === 'raw' && state.rawCategory
                                  ? getRawMarginColor(state.rawCategory)
                                  : getArcColor(state.arc),
                                color: viewMode === 'raw' && state.rawCategory
                                  ? '#F3F4F6'
                                  : getArcTextColor(state.arc)
                              }}
                              onClick={() => setSelectedState(selectedState === state.name ? null : state.name)}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="font-bold">{state.name}</div>
                                <div className="text-sm opacity-75">
                                  {viewMode === 'lean' ? state.arc.replace(/_/g, ' ') : state.rawCategory || state.category}
                                </div>
                                <div className="font-mono text-sm">
                                  <span className="font-bold">Lean:</span> {formatMargin(state.relMargin)}
                                  {state.rawMargin !== null && (
                                    <>
                                      <span className="mx-2 text-gray-400">•</span>
                                      <span className="font-bold">Raw:</span> {formatMargin(state.rawMargin)}
                                    </>
                                  )}
                                </div>
                                {isClose && viewMode === 'raw' && (
                                  <span className="text-yellow-400 text-xs font-bold">⚡ CLOSE</span>
                                )}
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
                        );
                      })}
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
