import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calculator, Activity, Heart, Target, Sparkles, BookOpen, ShieldCheck, CheckCircle2, ArrowRightLeft, Ruler, Scale } from 'lucide-react';
import { api } from '../services/api';

export const CalculatorTab: React.FC = () => {
  // Underlying Normalized Metric Biometric State (always in standard metric kg and cm)
  const [weightKg, setWeightKg] = useState<number>(78);
  const [heightCm, setHeightCm] = useState<number>(178);

  // Active Input Unit Modes for Direct Typing
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');

  // Direct Text/Number Input States for fluid editing
  const [weightInputStr, setWeightInputStr] = useState<string>('78');
  const [heightCmInputStr, setHeightCmInputStr] = useState<string>('178');
  const [heightFeetInputStr, setHeightFeetInputStr] = useState<string>('5');
  const [heightInchesInputStr, setHeightInchesInputStr] = useState<string>('10');

  // Demographic & Metabolic Parameters
  const [age, setAge] = useState<number>(27);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');

  // Calculator Result & State
  const [calculatorResult, setCalculatorResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [staticInfo, setStaticInfo] = useState<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // UNIT CONVERSION & FORMATTING HELPERS
  // ============================================================
  // Convert cm to feet and inches: 1 inch = 2.54 cm, 1 ft = 30.48 cm
  const getFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    let feet = Math.floor(totalInches / 12);
    let inches = Math.round(totalInches % 12);
    if (inches === 12) {
      feet += 1;
      inches = 0;
    }
    return { feet, inches, label: `${feet}'${inches}"` };
  };

  // Convert kg to lbs: 1 kg = 2.20462 lbs
  const getWeightInLbs = (kg: number) => {
    return Math.round(kg * 2.20462);
  };

  // Dual-Unit Display Strings (e.g. "85.5 kg (188 lbs)" and "178 cm (5'10")")
  const dualWeightDisplay = useMemo(() => {
    const lbs = Math.round(weightKg * 2.20462);
    return `${weightKg} kg (${lbs} lbs)`;
  }, [weightKg]);

  const dualHeightDisplay = useMemo(() => {
    const { label } = getFeetInches(heightCm);
    return `${heightCm} cm (${label})`;
  }, [heightCm]);

  // Synchronize string inputs when weightKg or heightCm changes from sliders or presets
  const syncWeightInputFromMetric = (kg: number, targetUnit = weightUnit) => {
    if (targetUnit === 'kg') {
      setWeightInputStr(String(kg));
    } else {
      setWeightInputStr(String(Math.round(kg * 2.20462)));
    }
  };

  const syncHeightInputFromMetric = (cm: number, targetUnit = heightUnit) => {
    if (targetUnit === 'cm') {
      setHeightCmInputStr(String(cm));
    } else {
      const { feet, inches } = getFeetInches(cm);
      setHeightFeetInputStr(String(feet));
      setHeightInchesInputStr(String(inches));
    }
  };

  // ============================================================
  // DIRECT USER INPUT HANDLERS
  // ============================================================
  // Direct typing handler for Weight
  const handleWeightInputChange = (rawVal: string) => {
    setWeightInputStr(rawVal);
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed > 0) {
      let normalizedKg = parsed;
      if (weightUnit === 'lbs') {
        // Convert lbs to kg: 1 lb = 0.45359237 kg
        normalizedKg = Math.round(parsed * 0.45359237 * 10) / 10;
      }
      // Keep within realistic physiological bounds for normalization
      const clampedKg = Math.min(300, Math.max(30, normalizedKg));
      setWeightKg(clampedKg);
    }
  };

  // Direct typing handler for Height in CM
  const handleHeightCmInputChange = (rawVal: string) => {
    setHeightCmInputStr(rawVal);
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed > 0) {
      const clampedCm = Math.min(250, Math.max(80, Math.round(parsed * 10) / 10));
      setHeightCm(clampedCm);
      const { feet, inches } = getFeetInches(clampedCm);
      setHeightFeetInputStr(String(feet));
      setHeightInchesInputStr(String(inches));
    }
  };

  // Direct typing handler for Height in Feet & Inches
  const handleHeightFtInChange = (newFeetStr: string, newInchesStr: string) => {
    setHeightFeetInputStr(newFeetStr);
    setHeightInchesInputStr(newInchesStr);

    const feet = parseFloat(newFeetStr) || 0;
    const inches = parseFloat(newInchesStr) || 0;
    const totalInches = (feet * 12) + inches;

    if (totalInches > 0) {
      // Convert inches to cm: 1 inch = 2.54 cm
      const convertedCm = Math.round(totalInches * 2.54);
      const clampedCm = Math.min(250, Math.max(80, convertedCm));
      setHeightCm(clampedCm);
      setHeightCmInputStr(String(clampedCm));
    }
  };

  // Weight Unit Toggle (KG <-> LBS)
  const handleWeightUnitSwitch = (newUnit: 'kg' | 'lbs') => {
    setWeightUnit(newUnit);
    syncWeightInputFromMetric(weightKg, newUnit);
  };

  // Height Unit Toggle (CM <-> FT/IN)
  const handleHeightUnitSwitch = (newUnit: 'cm' | 'ft_in') => {
    setHeightUnit(newUnit);
    syncHeightInputFromMetric(heightCm, newUnit);
  };

  // Slider change for Weight (slider always operates in normalized metric kg)
  const handleWeightSliderChange = (newKg: number) => {
    setWeightKg(newKg);
    syncWeightInputFromMetric(newKg, weightUnit);
  };

  // Slider change for Height (slider always operates in normalized metric cm)
  const handleHeightSliderChange = (newCm: number) => {
    setHeightCm(newCm);
    syncHeightInputFromMetric(newCm, heightUnit);
  };

  // Quick Presets
  const applyWeightPreset = (kg: number) => {
    setWeightKg(kg);
    syncWeightInputFromMetric(kg, weightUnit);
  };

  const applyHeightPreset = (cm: number) => {
    setHeightCm(cm);
    syncHeightInputFromMetric(cm, heightUnit);
  };

  // ============================================================
  // NORMALIZED CALCULATION ENGINE
  // ============================================================
  const calculateBmi = async (customWeight = weightKg, customHeight = heightCm) => {
    setLoading(true);

    // Normalize metric values: height in meters and centimeters, weight in kg
    const normalizedW = Number(customWeight);
    const normalizedH = Number(customHeight);

    try {
      const { response, status } = await api.request('POST', '/api/calculator/bmi', {
        weightKg: normalizedW,
        heightCm: normalizedH,
        age: Number(age),
        gender,
        activityLevel,
      });

      if (status === 200 && response.success) {
        setCalculatorResult(response.data);
      }
    } catch (err) {
      console.error('BMI Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformInfo = async () => {
    const { response, status } = await api.request('GET', '/api/info');
    if (status === 200 && response.success) {
      setStaticInfo(response);
    }
  };

  // Initial mount calculation
  useEffect(() => {
    calculateBmi(weightKg, heightCm);
    fetchPlatformInfo();
  }, []);

  // Debounced auto-recalculate as user types or adjusts biometrics
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (weightKg >= 30 && weightKg <= 300 && heightCm >= 80 && heightCm <= 250) {
        calculateBmi(weightKg, heightCm);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [weightKg, heightCm, age, gender, activityLevel]);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-2">
          PUBLIC ENDPOINT • ZERO AUTHENTICATION REQUIRED
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Calculator className="w-7 h-7 text-amber-500" />
          Public Physiological &amp; BMI Engine
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Open access endpoint (/api/calculator/bmi) executing WHO classification equations, Mifflin-St Jeor BMR, and energy expenditure baselines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Card */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Biometric Inputs
            </h3>
            <span className="text-[11px] text-zinc-400 font-medium">
              Live dual-unit conversion
            </span>
          </div>

          <div className="space-y-6">
            {/* ============================================================ */}
            {/* 1. BODY WEIGHT: DIRECT INPUT BOX + DUAL-UNIT + SLIDER        */}
            {/* ============================================================ */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              {/* Header with Dual-Unit Side-by-Side Live Display */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-400" />
                  Body Weight
                </label>
                {/* Dynamically shows equivalent values in both units side-by-side */}
                <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-black text-amber-400 font-mono tracking-tight shadow-sm">
                  {dualWeightDisplay}
                </div>
              </div>

              {/* Direct Input Box with Unit Toggle Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step={weightUnit === 'kg' ? '0.1' : '1'}
                    min={weightUnit === 'kg' ? '30' : '66'}
                    max={weightUnit === 'kg' ? '250' : '550'}
                    value={weightInputStr}
                    onChange={(e) => handleWeightInputChange(e.target.value)}
                    placeholder={weightUnit === 'kg' ? 'e.g. 85.5' : 'e.g. 188'}
                    className="w-full pl-3.5 pr-14 py-2 bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 focus:border-amber-500 rounded-xl text-base font-black text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 transition shadow-inner"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-400 uppercase pointer-events-none">
                    {weightUnit}
                  </span>
                </div>

                {/* Unit Switcher: KG vs LBS */}
                <div className="inline-flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => handleWeightUnitSwitch('kg')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      weightUnit === 'kg'
                        ? 'bg-amber-500 text-black shadow-md font-extrabold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    KG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWeightUnitSwitch('lbs')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      weightUnit === 'lbs'
                        ? 'bg-amber-500 text-black shadow-md font-extrabold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    LBS
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Presets:</span>
                {[65, 75, 85.5, 95, 105].map((presetKg) => {
                  const isSelected = Math.abs(weightKg - presetKg) < 0.3;
                  const label = weightUnit === 'kg' ? `${presetKg}kg` : `${Math.round(presetKg * 2.20462)}lbs`;
                  return (
                    <button
                      type="button"
                      key={presetKg}
                      onClick={() => applyWeightPreset(presetKg)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition border ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Supplemental Range Slider */}
              <div className="pt-2 border-t border-zinc-900">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                  <span>Slider Fine-Tune</span>
                  <span className="font-mono text-zinc-400">{weightKg} kg</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => handleWeightSliderChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                  <span>40 kg (88 lbs)</span>
                  <span>110 kg (243 lbs)</span>
                  <span>180 kg (397 lbs)</span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 2. STATURE / HEIGHT: DIRECT INPUT BOX + DUAL-UNIT + SLIDER   */}
            {/* ============================================================ */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              {/* Header with Dual-Unit Side-by-Side Live Display */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-amber-400" />
                  Stature / Height
                </label>
                {/* Dynamically shows equivalent values in both units side-by-side */}
                <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-black text-amber-400 font-mono tracking-tight shadow-sm">
                  {dualHeightDisplay}
                </div>
              </div>

              {/* Direct Input Box with Unit Toggle Buttons */}
              <div className="flex items-center gap-2">
                {heightUnit === 'cm' ? (
                  /* Single input box for Centimeters */
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.5"
                      min="100"
                      max="240"
                      value={heightCmInputStr}
                      onChange={(e) => handleHeightCmInputChange(e.target.value)}
                      placeholder="e.g. 178"
                      className="w-full pl-3.5 pr-14 py-2 bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 focus:border-amber-500 rounded-xl text-base font-black text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 transition shadow-inner"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-400 uppercase pointer-events-none">
                      CM
                    </span>
                  </div>
                ) : (
                  /* Dual input boxes for Feet & Inches */
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="3"
                        max="8"
                        value={heightFeetInputStr}
                        onChange={(e) => handleHeightFtInChange(e.target.value, heightInchesInputStr)}
                        placeholder="5"
                        className="w-full pl-3 pr-8 py-2 bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 focus:border-amber-500 rounded-xl text-base font-black text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-400 pointer-events-none">
                        ft
                      </span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max="11.9"
                        step="0.5"
                        value={heightInchesInputStr}
                        onChange={(e) => handleHeightFtInChange(heightFeetInputStr, e.target.value)}
                        placeholder="10"
                        className="w-full pl-3 pr-8 py-2 bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 focus:border-amber-500 rounded-xl text-base font-black text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-400 pointer-events-none">
                        in
                      </span>
                    </div>
                  </div>
                )}

                {/* Unit Switcher: CM vs FT / IN */}
                <div className="inline-flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => handleHeightUnitSwitch('cm')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      heightUnit === 'cm'
                        ? 'bg-amber-500 text-black shadow-md font-extrabold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHeightUnitSwitch('ft_in')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      heightUnit === 'ft_in'
                        ? 'bg-amber-500 text-black shadow-md font-extrabold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    FT/IN
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Presets:</span>
                {[
                  { cm: 165, label: "165cm (5'5\")" },
                  { cm: 175, label: "175cm (5'9\")" },
                  { cm: 178, label: "178cm (5'10\")" },
                  { cm: 183, label: "183cm (6'0\")" },
                  { cm: 190, label: "190cm (6'3\")" },
                ].map((preset) => {
                  const isSelected = Math.abs(heightCm - preset.cm) < 0.5;
                  return (
                    <button
                      type="button"
                      key={preset.cm}
                      onClick={() => applyHeightPreset(preset.cm)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition border ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Supplemental Range Slider */}
              <div className="pt-2 border-t border-zinc-900">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                  <span>Slider Fine-Tune</span>
                  <span className="font-mono text-zinc-400">{heightCm} cm ({getFeetInches(heightCm).label})</span>
                </div>
                <input
                  type="range"
                  min="130"
                  max="220"
                  step="1"
                  value={heightCm}
                  onChange={(e) => handleHeightSliderChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                  <span>130 cm (4'3")</span>
                  <span>175 cm (5'9")</span>
                  <span>220 cm (7'3")</span>
                </div>
              </div>
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Age (Years)</label>
                <input
                  type="number"
                  min="14"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Biological Sex</label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Physical Activity Multiplier</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="sedentary">Sedentary (Desk work, little exercise)</option>
                <option value="light">Lightly Active (1-3 workout days/wk)</option>
                <option value="moderate">Moderately Active (3-5 intense training days)</option>
                <option value="active">Very Active (6-7 intense days/wk)</option>
                <option value="athlete">Athlete / Extreme (2x per day)</option>
              </select>
            </div>

            <button
              onClick={() => calculateBmi(weightKg, heightCm)}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              {loading ? 'Evaluating Biometrics...' : 'Run Calculator Endpoint'}
            </button>
          </div>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          {calculatorResult ? (
            <div className="space-y-6">
              {/* BMI Big Number */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                    Body Mass Index (BMI)
                  </span>
                  <div className="text-4xl font-black text-amber-400 mt-1">
                    {calculatorResult.bmi} <span className="text-sm font-medium text-zinc-400">kg/m²</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 mt-1 inline-block">
                    Classification: <strong className="text-white">{calculatorResult.category}</strong>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                    Ideal Stature Weight Range
                  </span>
                  <div className="text-base font-black text-emerald-400 mt-1 font-mono">
                    {calculatorResult.metrics.healthyWeightRangeKg.min} - {calculatorResult.metrics.healthyWeightRangeKg.max} kg
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-1">
                    ({Math.round(calculatorResult.metrics.healthyWeightRangeKg.min * 2.20462)} - {Math.round(calculatorResult.metrics.healthyWeightRangeKg.max * 2.20462)} lbs)
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Risk index: {calculatorResult.riskLevel}
                  </span>
                </div>
              </div>

              {/* Energy Baselines */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Basal BMR</span>
                  <span className="text-lg font-black text-white font-mono">
                    {calculatorResult.metrics.estimatedBmrCalories} <span className="text-[10px] font-normal text-zinc-400">kcal</span>
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-1">At total physical rest (Mifflin-St Jeor)</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Daily TDEE</span>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {calculatorResult.metrics.estimatedTdeeCalories} <span className="text-[10px] font-normal text-zinc-400">kcal</span>
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-1">Maintenance expenditure</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 col-span-2 md:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Cutting Deficit</span>
                  <span className="text-lg font-black text-rose-400 font-mono">
                    {calculatorResult.caloricGuidelines.fatLossCutting} <span className="text-[10px] font-normal text-zinc-400">kcal</span>
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-1">-450 kcal fat loss deficit</p>
                </div>
              </div>

              {/* Clinical Guidelines */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <h4 className="font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Evidence-Based Recommendations for {calculatorResult.category}
                </h4>
                <ul className="space-y-1.5 text-zinc-400">
                  {calculatorResult.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-zinc-500">
              Run calculation to preview physiological model metrics.
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
            <span>Formulas: WHO BMI &amp; Mifflin-St Jeor Equation</span>
            <span>Public API: /api/calculator/bmi</span>
          </div>
        </div>
      </div>

      {/* Static Website Information (History, Vision, Goals) */}
      {staticInfo && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-base font-bold text-white">About Lift It Platform</h3>
              <p className="text-xs text-zinc-400">Public static metadata retrieved from /api/info</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                Founding History &amp; Vision
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">{staticInfo.history}</p>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2 pt-2 border-t border-zinc-900">
                <strong>Vision:</strong> {staticInfo.vision}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Core Engineering Goals
              </span>
              <div className="space-y-2">
                {staticInfo.coreGoals?.map((g: any, idx: number) => (
                  <div key={idx} className="text-xs">
                    <span className="font-semibold text-white block">• {g.title}</span>
                    <span className="text-zinc-400 text-[11px]">{g.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

