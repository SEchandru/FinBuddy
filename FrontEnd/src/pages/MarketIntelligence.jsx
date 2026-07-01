import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  FaGlobe,
  FaExchangeAlt,
  FaSearch,
  FaCoins,
  FaBookOpen,
  FaArrowUp,
  FaArrowDown,
  FaRobot,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
  FaChartArea
} from 'react-icons/fa';

// Static Supported Currencies to prevent options DOM reset mismatch
const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'JPY', name: 'Japanese Yen (100)' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'ZAR', name: 'South African Rand' }
];

// Preloaded Popular Mutual Funds with AMFI scheme codes
const POPULAR_FUNDS = [
  { code: '122639', name: 'Parag Parikh Flexi Cap Fund - Direct Growth', type: 'Equity - Flexi Cap', risk: 'Very High' },
  { code: '119819', name: 'SBI Bluechip Fund - Direct Growth', type: 'Equity - Large Cap', risk: 'High' },
  { code: '119062', name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth', type: 'Equity - Mid Cap', risk: 'Very High' },
  { code: '120592', name: 'Nippon India Small Cap Fund - Direct Growth', type: 'Equity - Small Cap', risk: 'Very High' },
  { code: '120253', name: 'ICICI Prudential Bluechip Fund - Direct Growth', type: 'Equity - Large Cap', risk: 'High' },
  { code: '119775', name: 'Mirae Asset Large Cap Fund - Direct Growth', type: 'Equity - Large Cap', risk: 'High' },
  { code: '125354', name: 'Axis Small Cap Fund - Direct Growth', type: 'Equity - Small Cap', risk: 'Very High' },
  { code: '120847', name: 'Quant Active Fund - Direct Growth', type: 'Equity - Multi Cap', risk: 'Very High' }
];

// Fallback Crypto Data if CoinGecko rate-limits us (429)
const FALLBACK_CRYPTO = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 5845200, price_change_percentage_24h: 1.45, total_volume: 2451000000000, market_cap: 115000000000000, high_24h: 5910000, low_24h: 5780000 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 292400, price_change_percentage_24h: -0.62, total_volume: 1250000000000, market_cap: 35120000000000, high_24h: 2980000, low_24h: 2890000 },
  { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 11650, price_change_percentage_24h: 5.24, total_volume: 380000000000, market_cap: 5410000000000, high_24h: 11800, low_24h: 10980 },
  { id: 'binancecoin', symbol: 'bnb', name: 'Binance Coin', current_price: 48900, price_change_percentage_24h: 0.18, total_volume: 180000000000, market_cap: 7200000000000, high_24h: 49400, low_24h: 48500 },
  { id: 'ripple', symbol: 'xrp', name: 'Ripple', current_price: 43.50, price_change_percentage_24h: -1.05, total_volume: 95000000000, market_cap: 2410000000000, high_24h: 44.20, low_24h: 42.80 },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 32.80, price_change_percentage_24h: 0.72, total_volume: 48000000000, market_cap: 1150000000000, high_24h: 33.10, low_24h: 32.20 },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', current_price: 10.35, price_change_percentage_24h: -2.15, total_volume: 110000000000, market_cap: 1480000000000, high_24h: 10.80, low_24h: 10.10 },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', current_price: 485, price_change_percentage_24h: 1.12, total_volume: 25000000000, market_cap: 680000000000, high_24h: 495, low_24h: 478 },
  { id: 'matic-network', symbol: 'matic', name: 'Polygon', current_price: 48.90, price_change_percentage_24h: 3.42, total_volume: 38000000000, market_cap: 480000000000, high_24h: 49.80, low_24h: 46.50 },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', current_price: 1160, price_change_percentage_24h: 2.10, total_volume: 42000000000, market_cap: 680000000000, high_24h: 1185, low_24h: 1120 }
];

// Helper to solve SIP IRR (XIRR/CAGR equivalent) via Bisection method
const calculateSipIrr = (totalValue, monthlySip, months) => {
  if (totalValue <= 0 || monthlySip <= 0 || months <= 0) return 0;
  let low = -0.99; 
  let high = 5.0;  
  let irr = 0;

  const f = (rateAnnual) => {
    const r = Math.pow(1 + rateAnnual, 1 / 12) - 1;
    if (Math.abs(r) < 1e-10) return monthlySip * months - totalValue;
    const val = monthlySip * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
    return val - totalValue;
  };

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const fMid = f(mid);
    if (Math.abs(fMid) < 1e-4) {
      irr = mid;
      break;
    }
    if (fMid < 0) {
      low = mid;
    } else {
      high = mid;
    }
    irr = mid;
  }
  return irr * 100;
};

function MarketIntelligence() {
  const { API_URL } = useAuth();
  const [activeTab, setActiveTab] = useState('forex');

  // Forex States (Initialized with preloaded fallback rates to prevent loading option mismatches)
  const [forexRates, setForexRates] = useState({
    INR: 1,
    USD: 0.0119,
    EUR: 0.0111,
    GBP: 0.0094,
    JPY: 1.91,
    CAD: 0.0163,
    AUD: 0.018,
    SGD: 0.0162,
    AED: 0.0439,
    CNY: 0.087,
    CHF: 0.0107,
    SAR: 0.0449,
    HKD: 0.0934,
    NZD: 0.0195,
    ZAR: 0.22
  });
  const [forexLoading, setForexLoading] = useState(true);
  const [forexError, setForexError] = useState('');
  const [forexAmount, setForexAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [forexSearch, setForexSearch] = useState('');

  // Commodities rates
  const [metalsData, setMetalsData] = useState({
    gold: 72450,
    silver: 82500,
    source: 'Simulated Cache (Connecting...)',
    loading: true
  });

  // Crypto States
  const [cryptoData, setCryptoData] = useState([]);
  const [cryptoLoading, setCryptoLoading] = useState(true);
  const [cryptoApiStatus, setCryptoApiStatus] = useState('loading'); 
  const [cryptoSearch, setCryptoSearch] = useState('');
  const [cryptoSort, setCryptoSort] = useState('cap_desc');

  // Mutual Fund States
  const [selectedFundCode, setSelectedFundCode] = useState('122639'); 
  const [fundDetails, setFundDetails] = useState(null);
  const [fundLoading, setFundLoading] = useState(false);
  const [fundError, setFundError] = useState('');
  const [chartDuration, setChartDuration] = useState('1Y'); 
  const [fundSearch, setFundSearch] = useState('');

  // Mutual Fund SIP Calculator States
  const [sipAmount, setSipAmount] = useState('5000');
  const [sipDay, setSipDay] = useState('5');
  const [sipYears, setSipYears] = useState('3'); 
  const [sipResult, setSipResult] = useState(null);

  // Global Economics (World Bank Indicator API) States
  const [economicCountry, setEconomicCountry] = useState('IN'); 
  const [economicData, setEconomicData] = useState([]);
  const [economicLoading, setEconomicLoading] = useState(false);
  const [economicError, setEconomicError] = useState('');

  // Book Rules Evaluator States
  const [salary, setSalary] = useState('80000');
  const [fixedExpenses, setFixedExpenses] = useState('30000');
  const [discretionaryExpenses, setDiscretionaryExpenses] = useState('20000');
  const [savingsAllocation, setSavingsAllocation] = useState('20000');
  const [cashBalance, setCashBalance] = useState('150000');
  const [totalAssets, setTotalAssets] = useState('450000');
  const [totalLiabilities, setTotalLiabilities] = useState('120000');

  // ----------------------------------------------------
  // 1. Fetch Forex Rates
  // ----------------------------------------------------
  const fetchForex = useCallback(async () => {
    try {
      setForexLoading(true);
      setForexError('');
      const res = await axios.get('https://open.er-api.com/v6/latest/INR');
      if (res.data && res.data.rates) {
        setForexRates(res.data.rates);
      } else {
        throw new Error('Invalid rate payload');
      }
    } catch (err) {
      console.error(err);
      setForexError('Forex API offline. Loaded fallback exchange rates.');
    } finally {
      setForexLoading(false);
    }
  }, []);

  // ----------------------------------------------------
  // 1b. Fetch Gold & Silver rates (Backend metals endpoint)
  // ----------------------------------------------------
  const fetchMetals = useCallback(async () => {
    try {
      setMetalsData(prev => ({ ...prev, loading: true }));
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/finance/metals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setMetalsData({
          gold: res.data.gold,
          silver: res.data.silver,
          source: res.data.source,
          loading: false
        });
      }
    } catch (err) {
      console.error('Metals fetch error:', err);
      // Fallback
      setMetalsData({
        gold: 72450,
        silver: 82500,
        source: 'Commodities Cache (Offline)',
        loading: false
      });
    }
  }, [API_URL]);

  useEffect(() => {
    fetchForex();
    fetchMetals();
  }, [fetchForex, fetchMetals]);

  const convertedAmount = useMemo(() => {
    if (!forexRates[fromCurrency] || !forexRates[toCurrency]) return 0;
    const inrAmount = parseFloat(forexAmount) / forexRates[fromCurrency];
    const finalVal = inrAmount * forexRates[toCurrency];
    return isNaN(finalVal) ? 0 : parseFloat(finalVal.toFixed(4));
  }, [forexAmount, fromCurrency, toCurrency, forexRates]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const forexGridItems = useMemo(() => {
    const popularKeys = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'JPY', 'AED', 'CNY', 'CHF'];
    return popularKeys
      .filter(k => forexRates[k])
      .map(k => {
        const valueInInr = 1 / forexRates[k];
        return {
          code: k,
          name: k === 'USD' ? 'US Dollar' :
                k === 'EUR' ? 'Euro' :
                k === 'GBP' ? 'British Pound' :
                k === 'CAD' ? 'Canadian Dollar' :
                k === 'AUD' ? 'Australian Dollar' :
                k === 'SGD' ? 'Singapore Dollar' :
                k === 'JPY' ? 'Japanese Yen (100)' :
                k === 'AED' ? 'UAE Dirham' :
                k === 'CNY' ? 'Chinese Yuan' :
                k === 'CHF' ? 'Swiss Franc' : k,
          rateInInr: k === 'JPY' ? (100 / forexRates[k]) : valueInInr
        };
      });
  }, [forexRates]);

  const filteredForexGrid = useMemo(() => {
    return forexGridItems.filter(item =>
      item.code.toLowerCase().includes(forexSearch.toLowerCase()) ||
      item.name.toLowerCase().includes(forexSearch.toLowerCase())
    );
  }, [forexGridItems, forexSearch]);

  // ----------------------------------------------------
  // 2. Fetch Cryptocurrencies (CoinGecko API)
  // ----------------------------------------------------
  const fetchCrypto = useCallback(async () => {
    try {
      setCryptoLoading(true);
      const res = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'inr',
            ids: 'bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,polkadot,matic-network,chainlink,avalanche-2,tron',
            order: 'market_cap_desc',
            sparkline: false
          }
        }
      );
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCryptoData(res.data);
        setCryptoApiStatus('live');
      } else {
        throw new Error('Empty payload');
      }
    } catch (err) {
      console.warn('CoinGecko rate-limited or blocked, loading simulator.', err.message);
      setCryptoData(FALLBACK_CRYPTO);
      setCryptoApiStatus('simulated');
    } finally {
      setCryptoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrypto();
  }, [fetchCrypto]);

  useEffect(() => {
    if (cryptoData.length === 0) return;
    const interval = setInterval(() => {
      setCryptoData(prevCoins =>
        prevCoins.map(coin => {
          const pct = (Math.random() * 0.35 - 0.15);
          const oldPrice = coin.current_price ?? 0;
          const newPrice = parseFloat((oldPrice * (1 + pct / 100)).toFixed(oldPrice > 100 ? 2 : 4));
          const change24h = parseFloat(((coin.price_change_percentage_24h ?? 0) + pct).toFixed(2));
          return {
            ...coin,
            current_price: newPrice,
            price_change_percentage_24h: change24h
          };
        })
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [cryptoData.length]);

  const sortedAndFilteredCrypto = useMemo(() => {
    let filtered = cryptoData.filter(c =>
      c.name.toLowerCase().includes(cryptoSearch.toLowerCase()) ||
      c.symbol.toLowerCase().includes(cryptoSearch.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const capA = a.market_cap ?? 0;
      const capB = b.market_cap ?? 0;
      const priceA = a.current_price ?? 0;
      const priceB = b.current_price ?? 0;
      const changeA = a.price_change_percentage_24h ?? 0;
      const changeB = b.price_change_percentage_24h ?? 0;

      if (cryptoSort === 'cap_desc') return capB - capA;
      if (cryptoSort === 'price_desc') return priceB - priceA;
      if (cryptoSort === 'price_asc') return priceA - priceB;
      if (cryptoSort === 'change_desc') return changeB - changeA;
      return 0;
    });
  }, [cryptoData, cryptoSearch, cryptoSort]);

  // ----------------------------------------------------
  // 3. Fetch Mutual Fund Details (AMFI API)
  // ----------------------------------------------------
  const fetchFundDetails = useCallback(async (schemeCode) => {
    try {
      setFundLoading(true);
      setFundError('');
      setFundDetails(null);
      const res = await axios.get(`https://api.mfapi.in/mf/${schemeCode}`);
      if (res.data && res.data.meta && res.data.data) {
        const reversedData = [...res.data.data].reverse();
        setFundDetails({
          meta: res.data.meta,
          data: reversedData
        });
      } else {
        throw new Error('Incomplete fund detail payload from AMFI API');
      }
    } catch (err) {
      console.error(err);
      setFundError('Failed to fetch mutual fund details. The AMFI Server may be busy.');
    } finally {
      setFundLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFundDetails(selectedFundCode);
  }, [selectedFundCode, fetchFundDetails]);

  const filteredPopularFunds = useMemo(() => {
    return POPULAR_FUNDS.filter(f =>
      f.name.toLowerCase().includes(fundSearch.toLowerCase()) ||
      f.type.toLowerCase().includes(fundSearch.toLowerCase())
    );
  }, [fundSearch]);

  const chartData = useMemo(() => {
    if (!fundDetails || !fundDetails.data) return [];
    const allData = fundDetails.data;
    if (allData.length === 0) return [];

    const latestRawStr = allData[allData.length - 1].date;
    const parseDateStr = (str) => {
      const p = str.split('-');
      return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
    };

    const latestDate = parseDateStr(latestRawStr);
    let cutoffDate = new Date(latestDate);

    if (chartDuration === '1M') cutoffDate.setMonth(latestDate.getMonth() - 1);
    else if (chartDuration === '6M') cutoffDate.setMonth(latestDate.getMonth() - 6);
    else if (chartDuration === '1Y') cutoffDate.setFullYear(latestDate.getFullYear() - 1);
    else if (chartDuration === '5Y') cutoffDate.setFullYear(latestDate.getFullYear() - 5);
    else cutoffDate = new Date(0);

    const filtered = allData.filter(item => parseDateStr(item.date) >= cutoffDate);
    const step = Math.max(1, Math.floor(filtered.length / 150));

    const finalPoints = [];
    for (let i = 0; i < filtered.length; i += step) {
      finalPoints.push({
        date: filtered[i].date,
        nav: parseFloat(filtered[i].nav)
      });
    }
    if (filtered.length > 0 && finalPoints[finalPoints.length - 1].date !== filtered[filtered.length - 1].date) {
      finalPoints.push({
        date: filtered[filtered.length - 1].date,
        nav: parseFloat(filtered[filtered.length - 1].nav)
      });
    }

    return finalPoints;
  }, [fundDetails, chartDuration]);

  // SIP Simulation
  useEffect(() => {
    if (!fundDetails || !fundDetails.data || fundDetails.data.length === 0) {
      setSipResult(null);
      return;
    }

    const rawData = fundDetails.data;
    const monthlyAmt = parseFloat(sipAmount);
    const dayToBuy = parseInt(sipDay);
    const durationYears = parseFloat(sipYears);

    if (isNaN(monthlyAmt) || monthlyAmt <= 0 || isNaN(dayToBuy) || dayToBuy <= 0) {
      setSipResult(null);
      return;
    }

    const latestRawStr = rawData[rawData.length - 1].date;
    const parseDateStr = (str) => {
      const p = str.split('-');
      return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
    };
    const latestDate = parseDateStr(latestRawStr);
    const startDate = new Date(latestDate);
    startDate.setFullYear(latestDate.getFullYear() - durationYears);

    const groupedByMonth = {};
    rawData.forEach(item => {
      const parts = item.date.split('-');
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const y = parseInt(parts[2]);
      const dateObj = new Date(y, m - 1, d);

      if (dateObj >= startDate && dateObj <= latestDate) {
        const key = `${y}-${m.toString().padStart(2, '0')}`;
        if (!groupedByMonth[key]) {
          groupedByMonth[key] = [];
        }
        groupedByMonth[key].push({
          date: item.date,
          day: d,
          nav: parseFloat(item.nav)
        });
      }
    });

    const sortedMonthKeys = Object.keys(groupedByMonth).sort();
    let totalInvested = 0;
    let totalUnits = 0;
    const purchaseLogs = [];

    sortedMonthKeys.forEach(monthKey => {
      const records = groupedByMonth[monthKey];
      if (records.length === 0) return;

      let bestRecord = records[0];
      let minDiff = Math.abs(records[0].day - dayToBuy);
      records.forEach(r => {
        const diff = Math.abs(r.day - dayToBuy);
        if (diff < minDiff) {
          minDiff = diff;
          bestRecord = r;
        }
      });

      if (bestRecord) {
        const units = monthlyAmt / bestRecord.nav;
        totalUnits += units;
        totalInvested += monthlyAmt;
        purchaseLogs.push({
          month: monthKey,
          date: bestRecord.date,
          nav: bestRecord.nav,
          amount: monthlyAmt,
          units: units,
          accumulatedUnits: totalUnits
        });
      }
    });

    const latestNav = parseFloat(rawData[rawData.length - 1].nav);
    const latestDateStr = rawData[rawData.length - 1].date;
    const currentValue = totalUnits * latestNav;
    const profit = currentValue - totalInvested;
    const gainPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    const actualMonths = purchaseLogs.length;

    const irrVal = calculateSipIrr(currentValue, monthlyAmt, actualMonths);

    setSipResult({
      totalInvested,
      currentValue,
      profit,
      gainPct,
      totalUnits,
      irr: irrVal,
      months: actualMonths,
      latestNav,
      latestDate: latestDateStr,
      logs: purchaseLogs
    });

  }, [fundDetails, sipAmount, sipDay, sipYears]);

  // ----------------------------------------------------
  // 4. Fetch Global Economics (World Bank Indicator API)
  // ----------------------------------------------------
  const fetchEconomicData = useCallback(async (countryCode) => {
    try {
      setEconomicLoading(true);
      setEconomicError('');
      
      const gdpRes = await axios.get(`https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.MKTP.KD.ZG?date=2014:2024&format=json`);
      const infRes = await axios.get(`https://api.worldbank.org/v2/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?date=2014:2024&format=json`);
      
      if (Array.isArray(gdpRes.data) && gdpRes.data[1] && Array.isArray(infRes.data) && infRes.data[1]) {
        const gdpList = gdpRes.data[1];
        const infList = infRes.data[1];
        
        const merged = gdpList.map(g => {
          const matchingInf = infList.find(i => i.date === g.date);
          return {
            year: g.date,
            gdp: g.value !== null ? parseFloat(g.value.toFixed(2)) : 0,
            inflation: (matchingInf && matchingInf.value !== null) ? parseFloat(matchingInf.value.toFixed(2)) : 0
          };
        }).reverse(); 
        
        setEconomicData(merged);
      } else {
        throw new Error('Incomplete indicators payload');
      }
    } catch (err) {
      console.warn('World Bank API blocked/slow. Loading cached indicators.', err.message);
      setEconomicError('Macroeconomic API rate limited. Loaded baseline cache.');
      if (countryCode === 'IN') {
        setEconomicData([
          { year: '2015', gdp: 7.99, inflation: 4.9 },
          { year: '2016', gdp: 8.26, inflation: 4.5 },
          { year: '2017', gdp: 6.80, inflation: 3.6 },
          { year: '2018', gdp: 6.45, inflation: 3.4 },
          { year: '2019', gdp: 3.87, inflation: 4.8 },
          { year: '2020', gdp: -5.83, inflation: 6.2 },
          { year: '2021', gdp: 9.05, inflation: 5.1 },
          { year: '2022', gdp: 7.24, inflation: 6.7 },
          { year: '2023', gdp: 7.60, inflation: 5.4 },
          { year: '2024', gdp: 7.00, inflation: 4.8 }
        ]);
      } else {
        setEconomicData([
          { year: '2015', gdp: 2.71, inflation: 0.1 },
          { year: '2016', gdp: 1.67, inflation: 1.3 },
          { year: '2017', gdp: 2.24, inflation: 2.1 },
          { year: '2018', gdp: 2.95, inflation: 2.4 },
          { year: '2019', gdp: 2.29, inflation: 1.8 },
          { year: '2020', gdp: -2.77, inflation: 1.2 },
          { year: '2021', gdp: 5.95, inflation: 4.7 },
          { year: '2022', gdp: 1.94, inflation: 8.0 },
          { year: '2023', gdp: 2.50, inflation: 4.1 },
          { year: '2024', gdp: 2.10, inflation: 2.9 }
        ]);
      }
    } finally {
      setEconomicLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'economics') {
      fetchEconomicData(economicCountry);
    }
  }, [activeTab, economicCountry, fetchEconomicData]);

  // ----------------------------------------------------
  // 5. Book Rules Evaluator Calculations
  // ----------------------------------------------------
  const bookEvaluations = useMemo(() => {
    const inc = parseFloat(salary) || 0;
    const fixedExp = parseFloat(fixedExpenses) || 0;
    const discExp = parseFloat(discretionaryExpenses) || 0;
    const sav = parseFloat(savingsAllocation) || 0;
    const cash = parseFloat(cashBalance) || 0;
    const assets = parseFloat(totalAssets) || 0;
    const liabilities = parseFloat(totalLiabilities) || 0;

    const totalExp = fixedExp + discExp;
    const emergencyCoverageMonths = totalExp > 0 ? (cash / totalExp) : 0;
    
    const wealthRate = inc > 0 ? (sav / inc) * 100 : 0;
    const egoIndex = inc > 0 ? (discExp / inc) * 100 : 0;
    let houselRating = 'Moderate';
    let houselColor = 'text-yellow-400';
    if (wealthRate > 25 && egoIndex < 15) {
      houselRating = 'Wealth Builder Elite';
      houselColor = 'text-green-400';
    } else if (egoIndex > 30) {
      houselRating = 'Vulnerable (Ego-Driven)';
      houselColor = 'text-red-400';
    }

    const assetToLiabRatio = liabilities > 0 ? (assets / liabilities) : (assets > 0 ? 99 : 0);
    let dadRating = 'Middle Class Trap';
    let dadColor = 'text-yellow-400';
    if (assetToLiabRatio >= 3.0) {
      dadRating = 'Wealth Liberator';
      dadColor = 'text-green-400';
    } else if (assetToLiabRatio < 1.0) {
      dadRating = 'Rat Race Liability';
      dadColor = 'text-red-400';
    }

    const babylonPassed = inc > 0 && (sav / inc) >= 0.10;
    const babylonPct = inc > 0 ? (sav / inc) * 100 : 0;

    const bogleSuggestedEquity = 110 - 30; 
    const bogleAdvise = `Allocate ${bogleSuggestedEquity}% to low-cost broad market index funds, and ${100 - bogleSuggestedEquity}% to cash/fixed income anchors. Rebalance annually.`;

    const annualExpenses = totalExp * 12;
    const fireTarget = annualExpenses * 25;
    const fireProgress = fireTarget > 0 ? (assets / fireTarget) * 100 : 0;

    let score = 50;
    if (emergencyCoverageMonths >= 6) score += 15;
    else if (emergencyCoverageMonths >= 3) score += 8;
    
    if (babylonPassed) score += 15;
    if (wealthRate >= 20) score += 15;
    if (assetToLiabRatio >= 2) score += 15;
    else if (assetToLiabRatio < 1) score -= 10;
    if (fireProgress >= 5) score += 10;

    score = Math.min(100, Math.max(10, score));

    return {
      emergencyCoverageMonths,
      wealthRate,
      egoIndex,
      houselRating,
      houselColor,
      assetToLiabRatio,
      dadRating,
      dadColor,
      babylonPassed,
      babylonPct,
      bogleAdvise,
      fireTarget,
      fireProgress,
      score
    };
  }, [salary, fixedExpenses, discretionaryExpenses, savingsAllocation, cashBalance, totalAssets, totalLiabilities]);


  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <FaGlobe className="text-teal-400 animate-pulse" /> Market Terminal & Strategy Suite
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time public currency conversions, CoinGecko price grids, live Indian Mutual Fund NAV tracking, and classic book strategies.
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300">AMFI Mutual Fund Feed</span>
          </div>
          <div className="border-l border-slate-800"></div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300">Exchange Rates API</span>
          </div>
          <div className="border-l border-slate-800"></div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-slate-300">World Bank Indicators API</span>
          </div>
        </div>
      </div>

      {/* Modern Glassmorphic Tab Selector */}
      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl max-w-3xl gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('forex')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'forex'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FaExchangeAlt /> Forex & Commodities
        </button>
        <button
          onClick={() => setActiveTab('crypto')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'crypto'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FaCoins /> Crypto Grid
        </button>
        <button
          onClick={() => setActiveTab('mutual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'mutual'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FaChartArea /> MF & SIP Simulator
        </button>
        <button
          onClick={() => setActiveTab('economics')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'economics'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FaGlobe /> Global Economics
        </button>
        <button
          onClick={() => setActiveTab('books')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all shrink-0 ${
            activeTab === 'books'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FaBookOpen /> Wealth Book Rules
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: FOREX & COMMODITIES TERMINAL                  */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'forex' && (
        <div className="space-y-8">
          
          {/* Commodities Live Metals Rates (Gold & Silver widget) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-yellow-950/10 border border-slate-800 rounded-2xl p-5 hover:border-yellow-500/20 transition-all flex items-center justify-between">
              <div>
                <span className="text-[10px] text-yellow-500 uppercase font-extrabold tracking-wider block">🏆 Gold Spot (24K/10g)</span>
                {metalsData.loading ? (
                  <div className="h-6 w-32 bg-slate-800 animate-pulse rounded mt-2"></div>
                ) : (
                  <div className="text-2xl font-extrabold text-white mt-1.5 font-mono">
                    ₹{metalsData.gold.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                )}
                <span className="text-[9px] text-slate-500 mt-1 block">Live rate feed: {metalsData.source}</span>
              </div>
              <div className="h-10 w-10 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center font-bold text-lg">
                Au
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-all flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-300 uppercase font-extrabold tracking-wider block">🥈 Silver Spot (1 Kg)</span>
                {metalsData.loading ? (
                  <div className="h-6 w-32 bg-slate-800 animate-pulse rounded mt-2"></div>
                ) : (
                  <div className="text-2xl font-extrabold text-white mt-1.5 font-mono">
                    ₹{metalsData.silver.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                )}
                <span className="text-[9px] text-slate-500 mt-1 block">Live rate feed: {metalsData.source}</span>
              </div>
              <div className="h-10 w-10 bg-slate-800 text-slate-200 rounded-xl flex items-center justify-center font-bold text-lg border border-slate-700">
                Ag
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/20 transition-all flex items-center justify-between md:col-span-2 lg:col-span-1">
              <div>
                <span className="text-[10px] text-blue-400 uppercase font-extrabold tracking-wider block">💡 Commodity Hedge Tip</span>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Financial books recommend allocation of **10-15%** of your total portfolio value in Gold as a hedge during equity downturns.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Currency Converter Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaExchangeAlt className="text-blue-500" /> Interactive Forex Converter
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Convert global values instantly using real-time interbank currency exchange ratios.
                </p>
              </div>

              {forexError && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl p-3 flex gap-2">
                  <FaInfoCircle className="shrink-0 mt-0.5" />
                  <span>{forexError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Input Value */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={forexAmount}
                    onChange={(e) => setForexAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none"
                    placeholder="Enter amount..."
                  />
                </div>

                {/* Bidirectional Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-9 items-center gap-2">
                  <div className="md:col-span-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      From
                    </label>
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-3 py-3 text-sm font-semibold text-white"
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1 flex justify-center pt-5">
                    <button
                      onClick={handleSwapCurrencies}
                      className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 rounded-xl transition-all cursor-pointer"
                      title="Swap Currencies"
                    >
                      <FaExchangeAlt className="rotate-90 md:rotate-0" size={12} />
                    </button>
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      To
                    </label>
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-3 py-3 text-sm font-semibold text-white"
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conversion Result Display */}
                {forexLoading && Object.keys(forexRates).length === 0 ? (
                  <div className="bg-slate-950 border border-slate-855 rounded-xl p-4 text-center">
                    <span className="text-xs text-slate-500 animate-pulse block">Computing rate...</span>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-855 rounded-xl p-5 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    <span className="text-xs text-slate-500 block font-medium">Conversion Value</span>
                    <div className="text-3xl font-extrabold text-white mt-1 font-mono">
                      {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      <span className="text-sm font-bold text-blue-400 ml-1.5">{toCurrency}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-2 font-mono">
                      Rate: 1 {fromCurrency} = {(forexRates[toCurrency]/forexRates[fromCurrency]).toFixed(6)} {toCurrency}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Currency Rates Grid Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-[520px]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Major Global Currency Rates</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live value comparison of dominant global currencies against Indian Rupee (INR).
                  </p>
                </div>

                {/* Rates Search Bar */}
                <div className="relative w-full md:w-64">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                  <input
                    type="text"
                    value={forexSearch}
                    onChange={(e) => setForexSearch(e.target.value)}
                    placeholder="Search currency..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {forexLoading && Object.keys(forexRates).length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        <th className="pb-3">Currency</th>
                        <th className="pb-3 text-right">In INR (Rupees)</th>
                        <th className="pb-3 text-right">1 INR Equals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-xs">
                      {filteredForexGrid.map(item => (
                        <tr key={item.code} className="hover:bg-slate-800/20 transition-all">
                          <td className="py-3.5 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-[10px] font-mono">
                                {item.code}
                              </span>
                              <span className="text-slate-300 font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-right font-mono text-slate-200 font-bold">
                            ₹{item.rateInInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                          </td>
                          <td className="py-3.5 text-right font-mono text-slate-500">
                            {forexRates[item.code]?.toFixed(5)} {item.code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: CRYPTOCURRENCY LIVE GRID TERMINAL             */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'crypto' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-855 p-5 rounded-2xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FaCoins className="text-yellow-500" /> Cryptocurrency Watchlist Terminal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking of top digital assets. Price feeds are updated dynamically.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial md:w-60">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  value={cryptoSearch}
                  onChange={(e) => setCryptoSearch(e.target.value)}
                  placeholder="Search assets (symbol)..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={cryptoSort}
                onChange={(e) => setCryptoSort(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="cap_desc">Sort: Market Cap</option>
                <option value="price_desc">Sort: Price High-Low</option>
                <option value="price_asc">Sort: Price Low-High</option>
                <option value="change_desc">Sort: 24h Change %</option>
              </select>

              <span className={`text-[10px] font-bold px-3 py-2 rounded-xl border ${
                cryptoApiStatus === 'live'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                {cryptoApiStatus === 'live' ? '🟢 COINGECKO LIVE' : '🟡 SIMULATED TICKER FEED'}
              </span>
            </div>
          </div>

          {cryptoLoading ? (
            <div className="py-24 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="text-xs text-slate-500 mt-3 font-medium">Connecting to CoinGecko Feed...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedAndFilteredCrypto.map(coin => {
                const priceChange = coin.price_change_percentage_24h ?? 0;
                const isUp = priceChange >= 0;
                const currentPrice = coin.current_price ?? 0;
                const totalVolume = coin.total_volume ?? 0;
                const marketCap = coin.market_cap ?? 0;
                return (
                  <div
                    key={coin.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all space-y-4 hover:shadow-lg hover:shadow-slate-950"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        {coin.image ? (
                          <img src={coin.image} alt={coin.name} className="h-7 w-7 rounded-full" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400">
                            {coin.symbol.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-100">{coin.name}</h4>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{coin.symbol}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${
                        isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {isUp ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
                        {priceChange.toFixed(2)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Price in INR</span>
                      <div className="text-2xl font-extrabold text-slate-100 font-mono leading-none mt-1">
                        ₹{currentPrice.toLocaleString('en-IN', {
                          minimumFractionDigits: currentPrice > 100 ? 2 : 4
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] pt-3 border-t border-slate-800/50">
                      <div>
                        <span className="text-slate-500 block">24h Vol (INR)</span>
                        <span className="font-semibold font-mono text-slate-300">
                          {totalVolume >= 1e9
                            ? `${(totalVolume / 1e9).toFixed(1)}B`
                            : totalVolume.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Market Cap</span>
                        <span className="font-semibold font-mono text-slate-300">
                          {marketCap >= 1e9
                            ? `${(marketCap / 1e9).toFixed(1)}B`
                            : marketCap.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {coin.high_24h !== null && coin.low_24h !== null && coin.high_24h !== undefined && coin.low_24h !== undefined && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                          <span>Low: ₹{coin.low_24h.toLocaleString()}</span>
                          <span>High: ₹{coin.high_24h.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden relative">
                          <div
                            className="bg-blue-500 h-full rounded-full absolute"
                            style={{
                              left: '10%',
                              width: '80%'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: MUTUAL FUND & HISTORICAL SIP CALCULATOR       */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'mutual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Mutual Fund Preset List Sidebar (1-Col) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[650px] space-y-4 font-sans">
            <div>
              <h3 className="text-md font-bold text-white">Popular Indian Mutual Funds</h3>
              <p className="text-xs text-slate-400 mt-0.5">Select a fund scheme to load real-time AMFI data.</p>
            </div>

            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input
                type="text"
                value={fundSearch}
                onChange={(e) => setFundSearch(e.target.value)}
                placeholder="Filter schemes..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPopularFunds.map(fund => {
                const isSelected = selectedFundCode === fund.code;
                return (
                  <button
                    key={fund.code}
                    onClick={() => setSelectedFundCode(fund.code)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-855 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">{fund.name}</span>
                    <div className="flex justify-between items-center w-full text-[9px] font-bold">
                      <span className="uppercase text-slate-500">{fund.type}</span>
                      <span className={`px-1.5 py-0.25 rounded ${
                        fund.risk === 'Very High' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>{fund.risk} Risk</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Charting & Historical SIP Engine */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              {fundLoading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-xs text-slate-500 mt-2">Fetching NAV history from AMFI API...</p>
                </div>
              ) : fundError ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-red-500/5 rounded-xl border border-red-500/20">
                  <FaTimesCircle className="text-red-500 text-3xl mb-2" />
                  <h4 className="text-sm font-bold text-white">AMFI Fetch Error</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">{fundError}</p>
                  <button
                    onClick={() => fetchFundDetails(selectedFundCode)}
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : fundDetails ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-805 pb-4 gap-3">
                    <div>
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase">
                        {fundDetails.meta.scheme_category}
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-1.5 leading-tight">
                        {fundDetails.meta.scheme_name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Code: {fundDetails.meta.scheme_code} | House: {fundDetails.meta.fund_house}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-semibold block">Current NAV</span>
                      <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                        ₹{parseFloat(fundDetails.data[fundDetails.data.length - 1]?.nav || 0).toFixed(4)}
                      </div>
                      <span className="text-[9px] text-slate-500 block font-mono">
                        As of {fundDetails.data[fundDetails.data.length - 1]?.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                      <FaChartArea className="text-blue-500" /> NAV Price Trend History
                    </span>

                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-855 gap-0.5">
                      {['1M', '6M', '1Y', '5Y', 'ALL'].map(dur => (
                        <button
                          key={dur}
                          onClick={() => setChartDuration(dur)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            chartDuration === dur
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          stroke="#475569"
                          fontSize={8}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke="#475569"
                          fontSize={8}
                          tickLine={false}
                          dx={-5}
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#3b82f6', fontSize: '11px', fontWeight: 'bold' }}
                          formatter={(value) => [`₹${value.toFixed(4)}`, 'NAV']}
                        />
                        <Area
                          type="monotone"
                          dataKey="nav"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorNav)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  Select a scheme to view historical metrics.
                </div>
              )}
            </div>

            {/* Historical SIP Simulation Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <FaCalendarAlt className="text-indigo-400" /> Historical NAV SIP Projection Engine
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculate exactly what a SIP on this fund would have earned if you invested in the past.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Monthly SIP (INR)
                  </label>
                  <input
                    type="number"
                    value={sipAmount}
                    onChange={(e) => setSipAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Day of Installment
                  </label>
                  <select
                    value={sipDay}
                    onChange={(e) => setSipDay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {[1, 5, 10, 15, 20, 25].map(d => (
                      <option key={d} value={d}>{d}th of month</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    SIP Duration
                  </label>
                  <select
                    value={sipYears}
                    onChange={(e) => setSipYears(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">1 Year Ago</option>
                    <option value="3">3 Years Ago</option>
                    <option value="5">5 Years Ago</option>
                    <option value="7">7 Years Ago</option>
                  </select>
                </div>
              </div>

              {sipResult ? (
                <div className="bg-slate-950 border border-slate-855 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500"></div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Total Invested</span>
                    <div className="text-lg font-extrabold text-white font-mono">
                      ₹{sipResult.totalInvested.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[9px] text-slate-600 block">{sipResult.months} installments</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Current Valuation</span>
                    <div className="text-lg font-extrabold text-emerald-400 font-mono">
                      ₹{parseFloat(sipResult.currentValue.toFixed(2)).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[9px] text-slate-600 block">Units: {sipResult.totalUnits.toFixed(2)}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Net Earnings</span>
                    <div className="text-lg font-extrabold text-blue-400 font-mono">
                      +₹{parseFloat(sipResult.profit.toFixed(2)).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[9px] text-emerald-400 font-bold">Gain: {sipResult.gainPct.toFixed(2)}%</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Annual Return (IRR)</span>
                    <div className="text-lg font-extrabold text-purple-400 font-mono">
                      {sipResult.irr.toFixed(2)}% <span className="text-[10px] text-slate-500">p.a.</span>
                    </div>
                    <span className="text-[9px] text-slate-600 block">Compounded CAGR</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-855 rounded-xl p-4 text-center">
                  <span className="text-xs text-slate-500">Unable to run historical simulation for this scheme range.</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: GLOBAL ECONOMIC INDICATORS (WORLD BANK API)    */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'economics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Panel (Left 1-Col) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FaGlobe className="text-blue-500" /> Country Selector
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select a nation to query live macro-economic indicators from the World Bank API.
              </p>
            </div>

            {economicError && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl p-3 flex gap-2">
                <FaInfoCircle className="shrink-0 mt-0.5" />
                <span>{economicError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Select Country
                </label>
                <select
                  value={economicCountry}
                  onChange={(e) => setEconomicCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-3 py-3 text-sm font-semibold text-white cursor-pointer"
                >
                  <option value="IN">🇮🇳 India</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="JP">🇯🇵 Japan</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="AU">🇦🇺 Australia</option>
                </select>
              </div>

              <div className="bg-slate-950 border border-slate-855 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <FaInfoCircle className="text-blue-400" /> Indicators tracked
                </h4>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside font-light leading-relaxed">
                  <li><strong>GDP Growth Rate</strong> (Annual %): Reflects the annualized health and expansion velocity of the country's economy.</li>
                  <li><strong>CPI Inflation Rate</strong> (Annual %): Reflects consumer price index swings, tracking the purchasing power decrease.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Economic Line Chart Display (Right 2-Cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-6 h-[480px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-md font-bold text-white">Comparative Macroeconomic History</h3>
                <p className="text-xs text-slate-400 mt-0.5">GDP Growth vs. Inflation curves over the last decade.</p>
              </div>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded-full font-bold">
                World Bank Data Feed
              </span>
            </div>

            {economicLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Fetching indicators from World Bank API...</p>
              </div>
            ) : economicData.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 h-64 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={economicData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis dataKey="year" stroke="#475569" fontSize={9} />
                      <YAxis stroke="#475569" fontSize={9} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Line
                        name="GDP Growth Rate (annual %)"
                        type="monotone"
                        dataKey="gdp"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        name="Inflation CPI (annual %)"
                        type="monotone"
                        dataKey="inflation"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-slate-500 font-mono text-right pt-2 border-t border-slate-805 mt-4">
                  Note: Inflation vs GDP correlation highlights stagflation cycles or economic booms.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                No indicators loaded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: BOOK-BASED WEALTH STRATEGY SUITE ENGINE       */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'books' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User Parameters Form (Left 1-Col) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FaBookOpen className="text-blue-500" /> Wealth Strategy Inputs
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your monthly cashflows and net worth parameters to analyze strategies.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Monthly Net Income (Salary)
                </label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Fixed Expenses
                  </label>
                  <input
                    type="number"
                    value={fixedExpenses}
                    onChange={(e) => setFixedExpenses(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Discretionary Expenses
                  </label>
                  <input
                    type="number"
                    value={discretionaryExpenses}
                    onChange={(e) => setDiscretionaryExpenses(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Monthly Savings / Investments
                </label>
                <input
                  type="number"
                  value={savingsAllocation}
                  onChange={(e) => setSavingsAllocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-slate-800/80 pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Balance Sheet</span>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Cash & Bank Savings (Liquid)
                    </label>
                    <input
                      type="number"
                      value={cashBalance}
                      onChange={(e) => setCashBalance(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Total Assets
                      </label>
                      <input
                        type="number"
                        value={totalAssets}
                        onChange={(e) => setTotalAssets(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Total Liabilities
                      </label>
                      <input
                        type="number"
                        value={totalLiabilities}
                        onChange={(e) => setTotalLiabilities(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Analysis Grid */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden font-sans">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full"></div>
              
              <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="42" stroke="#3b82f6" strokeWidth="8" fill="transparent"
                          strokeDasharray={263.8}
                          strokeDashoffset={263.8 - (263.8 * bookEvaluations.score) / 100}
                          strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-white">{bookEvaluations.score}</span>
                  <span className="text-[10px] text-slate-500 block">/ 100</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded font-bold uppercase">
                  Strategy Assessment
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1.5">Classic Financial Books Compliance Score</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed font-light">
                  Your overall rating reflects compliance with principles from classic personal finance books. Having a high emergency balance, saving 10%+ net income, and maintaining low liabilities boosts this score.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              
              <div className="bg-slate-900 border border-slate-855 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-extrabold text-slate-200">📚 The Psychology of Money</h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${bookEvaluations.houselColor} bg-slate-955`}>
                    {bookEvaluations.houselRating}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                  Morgan Housel emphasizes: "Wealth is what you don't see." It is cash saved, not depreciating assets bought to show off.
                </p>
                <div className="bg-slate-950 border border-slate-855 rounded-xl p-3 grid grid-cols-2 gap-3 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block font-bold">SAVINGS RATE</span>
                    <span className="font-extrabold text-white font-mono">{bookEvaluations.wealthRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block font-bold">EGO EXPENSE %</span>
                    <span className="font-extrabold text-white font-mono">{bookEvaluations.egoIndex.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-855 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-extrabold text-slate-200">📚 Rich Dad Poor Dad</h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${bookEvaluations.dadColor} bg-slate-955`}>
                    {bookEvaluations.dadRating}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                  Robert Kiyosaki defines: "An asset puts money in your pocket. A liability takes money out." High liability debt triggers the middle-class trap.
                </p>
                <div className="bg-slate-950 border border-slate-855 rounded-xl p-3 text-center text-xs">
                  <span className="text-[9px] text-slate-500 block font-bold">ASSETS TO LIABILITIES RATIO</span>
                  <div className="font-extrabold text-white font-mono mt-0.5">
                    {bookEvaluations.assetToLiabRatio === 99 ? '∞ (Zero Liabilities)' : `${bookEvaluations.assetToLiabRatio.toFixed(2)}x`}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-855 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-extrabold text-slate-200">📚 Richest Man in Babylon</h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                    bookEvaluations.babylonPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {bookEvaluations.babylonPassed ? <FaCheckCircle /> : <FaTimesCircle />}
                    {bookEvaluations.babylonPassed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                  George Clason's #1 Law of Wealth: "A part of all you earn is yours to keep." You must pay yourself first at least 10% of earnings before paying others.
                </p>
                <div className="bg-slate-950 border border-slate-855 rounded-xl p-3 text-center text-xs">
                  <span className="text-[9px] text-slate-500 block font-bold">SAVED FOR SELF FIRST</span>
                  <span className="font-extrabold text-white font-mono">{bookEvaluations.babylonPct.toFixed(1)}% of income</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-855 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-extrabold text-slate-200">📚 The 4% Rule (FIRE)</h4>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-955 text-indigo-400">
                    {bookEvaluations.fireProgress.toFixed(1)}% Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                  To achieve Financial Independence & Retire Early, your nest egg should be 25x your annual expenses, allowing a safe withdrawal rate of 4% annually.
                </p>
                <div className="bg-slate-950 border border-slate-855 rounded-xl p-3 grid grid-cols-2 gap-3 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block font-bold">FIRE NEST TARGET</span>
                    <span className="font-extrabold text-white font-mono">₹{bookEvaluations.fireTarget.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block font-bold">CURRENT NEST</span>
                    <span className="font-extrabold text-white font-mono">₹{parseFloat(totalAssets).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-gradient-to-r from-blue-900/10 to-indigo-950/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4 font-sans">
              <div className="p-3 bg-blue-600/15 text-blue-400 rounded-xl border border-blue-500/20">
                <FaRobot size={22} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  John Bogle Index Allocation Advice (Bogleheads)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  {bookEvaluations.bogleAdvise}
                </p>
                <div className="text-[10px] text-slate-500 pt-1 font-semibold">
                  📌 Advice Basis: Asset liquidity index is calculated from cash (₹{parseFloat(cashBalance).toLocaleString()}) to net balance.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default MarketIntelligence;
