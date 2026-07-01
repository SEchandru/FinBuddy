import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaTrash, 
  FaPlus, 
  FaMoneyBillWave, 
  FaExclamationTriangle, 
  FaPiggyBank, 
  FaCheckCircle,
  FaSearch,
  FaDownload,
  FaRobot,
  FaSlidersH,
  FaFileInvoiceDollar
} from 'react-icons/fa';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import * as XLSX from 'xlsx';

const CATEGORIES = [
  { name: 'Food', icon: '🍔' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Rent', icon: '🏠' },
  { name: 'EMI', icon: '💸' },
  { name: 'Fuel', icon: '⛽' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Entertainment', icon: '🍿' },
  { name: 'Education', icon: '📚' },
  { name: 'Medical', icon: '🩺' },
  { name: 'Insurance', icon: '🛡️' },
  { name: 'Investments', icon: '📈' },
  { name: 'Bills', icon: '🧾' },
  { name: 'Subscriptions', icon: '🔄' },
  { name: 'Family', icon: '👨‍👩‍👧' },
  { name: 'Personal Care', icon: '🧴' },
  { name: 'Gifts', icon: '🎁' },
  { name: 'Other', icon: '🌀' }
];

const COLORS = [
  '#3b82f6', '#10b981', '#fbbf24', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#a855f7', 
  '#6366f1', '#475569', '#64748b', '#cbd5e1', '#b45309', 
  '#be185d', '#047857', '#0369a1'
];

// Helper to parse Excel array data into transaction objects
const parseExcelData = (sheetData) => {
  if (!sheetData || sheetData.length === 0) return [];

  let headerRowIdx = -1;
  let dateColIdx = -1;
  let amountColIdx = -1;
  let descColIdx = -1;
  let catColIdx = -1;

  // 1. Look for a header row in the first 10 rows
  const headerLimit = Math.min(10, sheetData.length);
  for (let r = 0; r < headerLimit; r++) {
    const row = sheetData[r];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').toLowerCase().trim();
      if (cellVal.includes('date')) {
        dateColIdx = c;
        headerRowIdx = r;
      }
      if (cellVal.includes('amount') || cellVal.includes('debit') || cellVal.includes('spent') || cellVal.includes('value')) {
        amountColIdx = c;
        headerRowIdx = r;
      }
      if (cellVal.includes('description') || cellVal.includes('details') || cellVal.includes('narration') || cellVal.includes('merchant') || cellVal.includes('payee') || cellVal.includes('particulars')) {
        descColIdx = c;
        headerRowIdx = r;
      }
      if (cellVal.includes('category') || cellVal.includes('type')) {
        catColIdx = c;
      }
    }
    if (headerRowIdx !== -1) {
      break; // Found header row!
    }
  }

  const parsed = [];
  const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

  // Helper to parse dates in various Excel formats
  const parseExcelDate = (val) => {
    if (!val) return null;
    
    // If it's a number (Excel serial date representation)
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    const str = String(val).trim();
    // Try native date parsing
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }

    // Try regex matching standard formats DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
    const dateRegex = /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/;
    const match = str.match(dateRegex);
    if (match) {
      const d2 = new Date(match[1]);
      if (!isNaN(d2.getTime())) {
        return d2.toISOString().split('T')[0];
      }
    }
    return null;
  };

  for (let r = startRow; r < sheetData.length; r++) {
    const row = sheetData[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    let dateVal;
    let amountVal;
    let descVal;
    let catVal = 'Other';

    if (dateColIdx !== -1 && amountColIdx !== -1) {
      // Map columns using header indices
      dateVal = parseExcelDate(row[dateColIdx]);
      amountVal = parseFloat(String(row[amountColIdx] || '').replace(/[^0-9.]/g, '')) || 0;
      descVal = descColIdx !== -1 ? String(row[descColIdx] || '') : 'Excel Import';
      if (catColIdx !== -1 && row[catColIdx]) {
        catVal = String(row[catColIdx]);
      }
    } else {
      // Fallback heuristics: scan row cells
      let foundDate = null;
      let foundAmount = 0;
      let longestText = '';

      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (cell === undefined || cell === null) continue;

        // Try date
        const parsedDate = parseExcelDate(cell);
        if (parsedDate && !foundDate) {
          foundDate = parsedDate;
          continue;
        }

        // Try number
        if (typeof cell === 'number' && cell > 0 && cell < 10000000 && !foundAmount) {
          foundAmount = cell;
          continue;
        }

        const cellStr = String(cell).trim();
        // If string contains numbers but looks like amount (e.g. "₹500")
        if (cellStr.match(/(?:₹|rs\.?|\$)\s*(\d+(?:\.\d{1,2})?)/i) && !foundAmount) {
          const match = cellStr.match(/(?:₹|rs\.?|\$)\s*(\d+(?:\.\d{1,2})?)/i);
          foundAmount = parseFloat(match[1]);
          continue;
        }

        if (cellStr.length > longestText.length) {
          longestText = cellStr;
        }
      }

      dateVal = foundDate;
      amountVal = foundAmount;
      descVal = longestText || 'Excel Import';
    }

    if (dateVal && amountVal > 0) {
      // Auto categorize descVal
      let cat = 'Other';
      const lowerDesc = descVal.toLowerCase();
      
      if (lowerDesc.includes('swiggy') || lowerDesc.includes('zomato') || lowerDesc.includes('restaurant') || lowerDesc.includes('pizza') || lowerDesc.includes('food') || lowerDesc.includes('cafe') || lowerDesc.includes('starbucks')) {
        cat = 'Food';
      } else if (lowerDesc.includes('bigbasket') || lowerDesc.includes('blinkit') || lowerDesc.includes('grocery') || lowerDesc.includes('zepto') || lowerDesc.includes('supermarket') || lowerDesc.includes('dmart')) {
        cat = 'Groceries';
      } else if (lowerDesc.includes('rent') || lowerDesc.includes('landlord') || lowerDesc.includes('flat')) {
        cat = 'Rent';
      } else if (lowerDesc.includes('emi') || lowerDesc.includes('loan') || lowerDesc.includes('mortgage') || lowerDesc.includes('finance')) {
        cat = 'EMI';
      } else if (lowerDesc.includes('petrol') || lowerDesc.includes('diesel') || lowerDesc.includes('fuel') || lowerDesc.includes('shell') || lowerDesc.includes('hpc') || lowerDesc.includes('iocl')) {
        cat = 'Fuel';
      } else if (lowerDesc.includes('uber') || lowerDesc.includes('ola') || lowerDesc.includes('cab') || lowerDesc.includes('irctc') || lowerDesc.includes('flight') || lowerDesc.includes('metro') || lowerDesc.includes('bus') || lowerDesc.includes('travel')) {
        cat = 'Travel';
      } else if (lowerDesc.includes('amazon') || lowerDesc.includes('flipkart') || lowerDesc.includes('myntra') || lowerDesc.includes('shopping') || lowerDesc.includes('clothing') || lowerDesc.includes('zara')) {
        cat = 'Shopping';
      } else if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('youtube') || lowerDesc.includes('prime') || lowerDesc.includes('subscription')) {
        cat = 'Subscriptions';
      } else if (lowerDesc.includes('movie') || lowerDesc.includes('pvr') || lowerDesc.includes('cinema') || lowerDesc.includes('entertainment') || lowerDesc.includes('theatre') || lowerDesc.includes('playstation') || lowerDesc.includes('steam')) {
        cat = 'Entertainment';
      } else if (lowerDesc.includes('school') || lowerDesc.includes('college') || lowerDesc.includes('udemy') || lowerDesc.includes('coursera') || lowerDesc.includes('fees') || lowerDesc.includes('education') || lowerDesc.includes('book')) {
        cat = 'Education';
      } else if (lowerDesc.includes('doctor') || lowerDesc.includes('hospital') || lowerDesc.includes('pharmacy') || lowerDesc.includes('medical') || lowerDesc.includes('medicine') || lowerDesc.includes('apollo')) {
        cat = 'Medical';
      } else if (lowerDesc.includes('insurance') || lowerDesc.includes('lic') || lowerDesc.includes('policy') || lowerDesc.includes('premium')) {
        cat = 'Insurance';
      } else if (lowerDesc.includes('sip') || lowerDesc.includes('mutual') || lowerDesc.includes('groww') || lowerDesc.includes('zerodha') || lowerDesc.includes('invest')) {
        cat = 'Investments';
      } else if (lowerDesc.includes('electricity') || lowerDesc.includes('water bill') || lowerDesc.includes('wifi') || lowerDesc.includes('broadband') || lowerDesc.includes('recharge') || lowerDesc.includes('bill')) {
        cat = 'Bills';
      } else if (lowerDesc.includes('parents') || lowerDesc.includes('family') || lowerDesc.includes('kids')) {
        cat = 'Family';
      } else if (lowerDesc.includes('salon') || lowerDesc.includes('spa') || lowerDesc.includes('haircut') || lowerDesc.includes('personal care') || lowerDesc.includes('grooming')) {
        cat = 'Personal Care';
      } else if (lowerDesc.includes('gift') || lowerDesc.includes('present') || lowerDesc.includes('birthday')) {
        cat = 'Gifts';
      }

      if (catColIdx !== -1 && catVal !== 'Other') {
        const foundCat = CATEGORIES.find(c => c.name.toLowerCase() === catVal.toLowerCase().trim());
        if (foundCat) cat = foundCat.name;
      }

      parsed.push({
        date: dateVal,
        amount: amountVal,
        description: descVal.substring(0, 40),
        category: cat
      });
    }
  }

  return parsed;
};

function ExpenseTracker() {
  const { API_URL, user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('advisor'); // 'advisor', 'planner', 'importer', 'leaks', 'analytics', 'goals', 'log'

  // Input states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [searchMinAmt, setSearchMinAmt] = useState('');
  const [searchMaxAmt, setSearchMaxAmt] = useState('');
  const [searchDateRange, setSearchDateRange] = useState('Current Month'); // Current Month, Last 30 Days, All

  // Import states
  const [importText, setImportText] = useState('');
  const [overwriteImport, setOverwriteImport] = useState(false);
  const [parsedImports, setParsedImports] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);

  // Custom budget override states
  const [customBudgets, setCustomBudgets] = useState({});
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudgets, setEditingBudgets] = useState({});

  // Monthly Comparison states
  const [comparePeriod, setComparePeriod] = useState('1m'); // 1m, 3m, 6m, 1y

  // Goal Impact states
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [goalReduceCategory, setGoalReduceCategory] = useState('Food');
  const [goalReduceAmount, setGoalReduceAmount] = useState(1000);

  // Notifications
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk Selection State
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [expRes, goalRes] = await Promise.all([
        axios.get(`${API_URL}/finance/expenses`),
        axios.get(`${API_URL}/finance/goals`)
      ]);
      setExpenses(expRes.data);
      setGoals(goalRes.data);
      if (goalRes.data.length > 0) {
        setSelectedGoalId(goalRes.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching intelligence data:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // --- SMART SEARCH & FILTER LOGIC ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesText = searchQuery === '' || 
        exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = searchCategory === 'All' || exp.category === searchCategory;

      const amt = exp.amount;
      const min = parseFloat(searchMinAmt);
      const max = parseFloat(searchMaxAmt);
      const matchesMin = isNaN(min) || amt >= min;
      const matchesMax = isNaN(max) || amt <= max;

      const expDate = new Date(exp.date);
      const now = new Date();
      let matchesDate = true;
      if (searchDateRange === 'Current Month') {
        matchesDate = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      } else if (searchDateRange === 'Last 30 Days') {
        const diffTime = Math.abs(now - expDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchesDate = diffDays <= 30;
      }

      return matchesText && matchesCat && matchesMin && matchesMax && matchesDate;
    });
  }, [expenses, searchQuery, searchCategory, searchMinAmt, searchMaxAmt, searchDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clear selected transactions when switching tabs
  useEffect(() => {
    setSelectedExpenseIds([]);
  }, [activeTab]);

  // Load Custom Budgets from LocalStorage
  useEffect(() => {
    if (user?.email) {
      const saved = localStorage.getItem(`fiinbuddy_budgets_${user.email}`);
      if (saved) {
        try {
          setCustomBudgets(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing custom budgets:', e);
        }
      }
    }
  }, [user?.email]);

  // Add Single Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(`${API_URL}/finance/expenses`, {
        amount: parseFloat(amount),
        category,
        description: description || `Manual ${category} Spend`,
        date
      });
      setExpenses([res.data, ...expenses]);
      setAmount('');
      setDescription('');
      setSuccess('Transaction logged successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record transaction.');
    }
  };

  // Quick Add handler
  const handleQuickAdd = async (catName, customAmount, desc) => {
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${API_URL}/finance/expenses`, {
        amount: parseFloat(customAmount),
        category: catName,
        description: desc,
        date: new Date().toISOString().split('T')[0]
      });
      setExpenses([res.data, ...expenses]);
      setSuccess(`Added ₹${customAmount} to ${catName}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Quick add failed.');
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await axios.delete(`${API_URL}/finance/expenses/${id}`);
      setExpenses(expenses.filter(e => e.id !== id));
      setSuccess('Transaction deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('Failed to delete transaction.');
    }
  };

  // Selection and bulk deletion handlers
  const handleToggleSelectExpense = (id) => {
    setSelectedExpenseIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllExpenses = () => {
    const filteredIds = filteredExpenses.map(e => e.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedExpenseIds.includes(id));
    
    if (allSelected) {
      // Deselect all filtered
      setSelectedExpenseIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered
      setSelectedExpenseIds(prev => {
        const next = [...prev];
        filteredIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleBulkDeleteExpenses = async () => {
    if (selectedExpenseIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedExpenseIds.length} selected transactions?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/finance/expenses/bulk-delete`, {
        ids: selectedExpenseIds
      });
      
      setExpenses(prev => prev.filter(e => !selectedExpenseIds.includes(e.id)));
      setSelectedExpenseIds([]);
      setSuccess(res.data.message || 'Transactions deleted successfully.');
      
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error bulk deleting transactions:', err);
      setError('Failed to bulk delete transactions.');
    }
  };

  // Inline Category Editor
  const handleEditExpenseCategory = async (id, newCat) => {
    try {
      setError('');
      setSuccess('');
      const res = await axios.put(`${API_URL}/finance/expenses/${id}`, {
        category: newCat
      });
      setExpenses(expenses.map(e => e.id === id ? res.data.expense : e));
      setSuccess('Category updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error updating transaction category:', err);
      setError('Failed to update category.');
    }
  };

  // --- PARSE IMPORT STATEMENT ENGINE ---
  const handleParseImport = () => {
    if (!importText.trim()) {
      setError('Please paste statement text or SMS alerts first.');
      return;
    }
    setError('');
    
    const lines = importText.split('\n');
    const parsed = [];
    
    // Heuristics for Date matching
    const dateRegex = /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/;
    const dateRegexAlt = /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i;
    
    // Heuristics for debited amounts
    const amountRegex = /(?:₹|rs\.?|inr|usd|\$)\s*(\d+(?:\.\d{1,2})?)/i;
    const amountRegexFallback = /\b(\d+(?:\.\d{1,2})?)\b/;

    lines.forEach((line, idx) => {
      const clean = line.replace(/,/g, '').trim();
      if (!clean) return;

      let dateStr = new Date().toISOString().split('T')[0];
      const dateMatch = clean.match(dateRegex) || clean.match(dateRegexAlt);
      if (dateMatch) {
        try {
          const d = new Date(dateMatch[1]);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().split('T')[0];
          }
        } catch {
          // Ignore invalid date strings
        }
      }

      let amountVal = 0;
      const amtMatch = clean.match(amountRegex) || clean.match(amountRegexFallback);
      if (amtMatch) {
        amountVal = parseFloat(amtMatch[1]);
      }

      // Merchant heuristic extraction
      let desc = clean;
      const merchantMatch = clean.match(/(?:to|at|for|paid|spent|merchant|payee|vpa)\s+([A-Za-z0-9\s.\-_]+?)(?:on|from|via|bal|ref|\d|$)/i);
      if (merchantMatch) {
        desc = merchantMatch[1].trim();
      }

      if (amountVal > 0) {
        const lowerDesc = desc.toLowerCase();
        let cat = 'Other';

        if (lowerDesc.includes('swiggy') || lowerDesc.includes('zomato') || lowerDesc.includes('restaurant') || lowerDesc.includes('pizza') || lowerDesc.includes('food') || lowerDesc.includes('cafe') || lowerDesc.includes('starbucks')) {
          cat = 'Food';
        } else if (lowerDesc.includes('bigbasket') || lowerDesc.includes('blinkit') || lowerDesc.includes('grocery') || lowerDesc.includes('zepto') || lowerDesc.includes('supermarket') || lowerDesc.includes('dmart')) {
          cat = 'Groceries';
        } else if (lowerDesc.includes('rent') || lowerDesc.includes('landlord') || lowerDesc.includes('flat')) {
          cat = 'Rent';
        } else if (lowerDesc.includes('emi') || lowerDesc.includes('loan') || lowerDesc.includes('mortgage') || lowerDesc.includes('finance')) {
          cat = 'EMI';
        } else if (lowerDesc.includes('petrol') || lowerDesc.includes('diesel') || lowerDesc.includes('fuel') || lowerDesc.includes('shell') || lowerDesc.includes('hpc') || lowerDesc.includes('iocl')) {
          cat = 'Fuel';
        } else if (lowerDesc.includes('uber') || lowerDesc.includes('ola') || lowerDesc.includes('cab') || lowerDesc.includes('irctc') || lowerDesc.includes('flight') || lowerDesc.includes('metro') || lowerDesc.includes('bus') || lowerDesc.includes('travel')) {
          cat = 'Travel';
        } else if (lowerDesc.includes('amazon') || lowerDesc.includes('flipkart') || lowerDesc.includes('myntra') || lowerDesc.includes('shopping') || lowerDesc.includes('clothing') || lowerDesc.includes('zara')) {
          cat = 'Shopping';
        } else if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('youtube') || lowerDesc.includes('prime') || lowerDesc.includes('subscription')) {
          cat = 'Subscriptions';
        } else if (lowerDesc.includes('movie') || lowerDesc.includes('pvr') || lowerDesc.includes('cinema') || lowerDesc.includes('entertainment') || lowerDesc.includes('theatre') || lowerDesc.includes('playstation') || lowerDesc.includes('steam')) {
          cat = 'Entertainment';
        } else if (lowerDesc.includes('school') || lowerDesc.includes('college') || lowerDesc.includes('udemy') || lowerDesc.includes('coursera') || lowerDesc.includes('fees') || lowerDesc.includes('education') || lowerDesc.includes('book')) {
          cat = 'Education';
        } else if (lowerDesc.includes('doctor') || lowerDesc.includes('hospital') || lowerDesc.includes('pharmacy') || lowerDesc.includes('medical') || lowerDesc.includes('medicine') || lowerDesc.includes('apollo')) {
          cat = 'Medical';
        } else if (lowerDesc.includes('insurance') || lowerDesc.includes('lic') || lowerDesc.includes('policy') || lowerDesc.includes('premium')) {
          cat = 'Insurance';
        } else if (lowerDesc.includes('sip') || lowerDesc.includes('mutual') || lowerDesc.includes('groww') || lowerDesc.includes('zerodha') || lowerDesc.includes('invest')) {
          cat = 'Investments';
        } else if (lowerDesc.includes('electricity') || lowerDesc.includes('water bill') || lowerDesc.includes('wifi') || lowerDesc.includes('broadband') || lowerDesc.includes('recharge') || lowerDesc.includes('bill')) {
          cat = 'Bills';
        } else if (lowerDesc.includes('parents') || lowerDesc.includes('family') || lowerDesc.includes('kids')) {
          cat = 'Family';
        } else if (lowerDesc.includes('salon') || lowerDesc.includes('spa') || lowerDesc.includes('haircut') || lowerDesc.includes('personal care') || lowerDesc.includes('grooming')) {
          cat = 'Personal Care';
        } else if (lowerDesc.includes('gift') || lowerDesc.includes('present') || lowerDesc.includes('birthday')) {
          cat = 'Gifts';
        }

        // Duplicate Check: compare with current list
        const isDup = expenses.some(e => 
          Math.abs(e.amount - amountVal) < 0.1 && 
          e.date === dateStr && 
          e.description.toLowerCase().includes(desc.toLowerCase().substring(0, 5))
        );

        parsed.push({
          tempId: `p-${idx}`,
          date: dateStr,
          amount: amountVal,
          description: desc.substring(0, 40),
          category: cat,
          isDuplicate: isDup
        });
      }
    });

    setParsedImports(parsed);
    setShowImportPreview(true);
  };

  // Submit Bulk Import
  const handleCommitBulkImport = async () => {
    try {
      setError('');
      setSuccess('');
      
      const payload = parsedImports.map(({ date, amount, description, category }) => ({
        date,
        amount,
        description,
        category
      }));

      // Overwrite database if option checked
      if (overwriteImport) {
        for (const exp of expenses) {
          await axios.delete(`${API_URL}/finance/expenses/${exp.id}`);
        }
      }

      const res = await axios.post(`${API_URL}/finance/expenses/bulk`, { expenses: payload });
      setSuccess(res.data.message || 'Import successful!');
      
      setImportText('');
      setParsedImports([]);
      setShowImportPreview(false);
      fetchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      console.error(e);
      setError('Failed to import transactions. Please try again.');
    }
  };

  // Import local text files, CSVs, or Excel sheets
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const parsed = parseExcelData(sheetData);
          if (parsed.length === 0) {
            setError('No valid transactions found in the Excel sheet. Ensure columns contain Date, Amount, and Description.');
            return;
          }

          // Duplicate checks and formatting
          const formatted = parsed.map((item, idx) => {
            const isDup = expenses.some(e => 
              Math.abs(e.amount - item.amount) < 0.1 && 
              e.date === item.date && 
              e.description.toLowerCase().includes(item.description.toLowerCase().substring(0, 5))
            );
            return {
              tempId: `excel-${idx}`,
              ...item,
              isDuplicate: isDup
            };
          });

          setParsedImports(formatted);
          setShowImportPreview(true);
          setSuccess(`Successfully parsed ${formatted.length} transactions from Excel sheet!`);
          setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
          console.error('Error parsing Excel sheet:', err);
          setError('Failed to parse Excel sheet. Ensure the file is not corrupted.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Standard csv/txt reading
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportText(event.target.result);
        setSuccess('File loaded into copy-paste box. Click "Parse Import Statements" below.');
        setTimeout(() => setSuccess(''), 4000);
      };
      reader.readAsText(file);
    }
  };

  // --- DYNAMIC BUDGET SETUP ---
  const age = user?.age || 22;
  const salary = user?.monthlyIncome || 25000;
  const risk = user?.riskProfile?.category || 'Moderate';

  // Base auto budgets calculations
  const autoBudgets = useMemo(() => {
    let foodPct = 12;
    let groceriesPct = 8;
    let rentPct = 20;
    let emiPct = 10;
    let fuelPct = 5;
    let travelPct = 5;
    let shoppingPct = 8;
    let entPct = 6;
    let eduPct = age < 25 ? 10 : 3;
    let medPct = 5;
    let insPct = 5;
    let investPct = Math.max(15, Math.min(50, 110 - age));
    let billPct = 10;
    let subPct = 3;
    let familyPct = 5;
    let pcPct = 4;
    let giftPct = 3;
    let otherPct = 5;

    if (risk === 'Conservative') {
      travelPct = 4;
      shoppingPct = 5;
      entPct = 4;
      investPct = Math.min(50, investPct + 5);
    } else if (risk === 'Aggressive') {
      shoppingPct = 7;
      entPct = 5;
      investPct = Math.min(55, investPct + 8);
    }

    if (goals && goals.length > 0) {
      foodPct = Math.max(8, foodPct - 2);
      shoppingPct = Math.max(4, shoppingPct - 2);
      entPct = Math.max(3, entPct - 2);
    }

    const sum = foodPct + groceriesPct + rentPct + emiPct + fuelPct + travelPct + shoppingPct + entPct + eduPct + medPct + insPct + investPct + billPct + subPct + familyPct + pcPct + giftPct + otherPct;
    const factor = 100 / sum;

    return {
      'Food': Math.round((foodPct * factor / 100) * salary),
      'Groceries': Math.round((groceriesPct * factor / 100) * salary),
      'Rent': Math.round((rentPct * factor / 100) * salary),
      'EMI': Math.round((emiPct * factor / 100) * salary),
      'Fuel': Math.round((fuelPct * factor / 100) * salary),
      'Travel': Math.round((travelPct * factor / 100) * salary),
      'Shopping': Math.round((shoppingPct * factor / 100) * salary),
      'Entertainment': Math.round((entPct * factor / 100) * salary),
      'Education': Math.round((eduPct * factor / 100) * salary),
      'Medical': Math.round((medPct * factor / 100) * salary),
      'Insurance': Math.round((insPct * factor / 100) * salary),
      'Investments': Math.round((investPct * factor / 100) * salary),
      'Bills': Math.round((billPct * factor / 100) * salary),
      'Subscriptions': Math.round((subPct * factor / 100) * salary),
      'Family': Math.round((familyPct * factor / 100) * salary),
      'Personal Care': Math.round((pcPct * factor / 100) * salary),
      'Gifts': Math.round((giftPct * factor / 100) * salary),
      'Other': Math.round((otherPct * factor / 100) * salary)
    };
  }, [age, salary, risk, goals]);

  // Combine auto budgets with custom localStorage overrides
  const categoryBudgets = useMemo(() => {
    const final = {};
    CATEGORIES.forEach(c => {
      final[c.name] = customBudgets[c.name] !== undefined ? customBudgets[c.name] : autoBudgets[c.name];
    });
    return final;
  }, [autoBudgets, customBudgets]);

  // Save Custom Budgets Override Handler
  const handleSaveCustomBudgets = () => {
    const overrides = { ...customBudgets };
    Object.keys(editingBudgets).forEach(cat => {
      const val = parseFloat(editingBudgets[cat]);
      if (!isNaN(val) && val >= 0) {
        overrides[cat] = val;
      }
    });
    setCustomBudgets(overrides);
    localStorage.setItem(`fiinbuddy_budgets_${user.email}`, JSON.stringify(overrides));
    setShowBudgetModal(false);
    setSuccess('Custom category budgets saved successfully.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleOpenBudgetModal = () => {
    const current = {};
    CATEGORIES.forEach(c => {
      current[c.name] = categoryBudgets[c.name];
    });
    setEditingBudgets(current);
    setShowBudgetModal(true);
  };

  // --- CURRENT MONTH CALCULATIONS ---
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [expenses]);

  const categorySpent = useMemo(() => {
    const spent = {};
    CATEGORIES.forEach(c => { spent[c.name] = 0; });
    
    currentMonthExpenses.forEach(e => {
      const cat = e.category || 'Other';
      if (spent[cat] !== undefined) {
        spent[cat] += e.amount;
      } else {
        spent['Other'] += e.amount;
      }
    });
    return spent;
  }, [currentMonthExpenses]);

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = Math.max(0, salary - totalSpent);
  const actualSavingsRate = salary > 0 ? Math.round((netSavings / salary) * 100) : 0;

  // Budget Utilization Rate
  const totalBudgetLimit = Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0);
  const budgetUtilizationRate = totalBudgetLimit > 0 ? Math.min(100, Math.round((totalSpent / totalBudgetLimit) * 100)) : 0;

  // --- DEDUCTION HEURISTICS & SPENDING LEAKS DETECTOR ---
  const leaks = useMemo(() => {
    const list = [];
    
    // Leak 1: Weekend Overspending (Sat & Sun transactions higher than weekday average)
    const weekendTxs = currentMonthExpenses.filter(e => {
      const d = new Date(e.date);
      const day = d.getDay(); // 0 is Sun, 6 is Sat
      return day === 0 || day === 6;
    });
    const weekdayTxs = currentMonthExpenses.filter(e => {
      const d = new Date(e.date);
      const day = d.getDay();
      return day !== 0 && day !== 6;
    });

    const avgWeekend = weekendTxs.length > 0 ? weekendTxs.reduce((s, e) => s + e.amount, 0) / weekendTxs.length : 0;
    const avgWeekday = weekdayTxs.length > 0 ? weekdayTxs.reduce((s, e) => s + e.amount, 0) / weekdayTxs.length : 0;

    if (avgWeekend > avgWeekday * 1.35 && weekendTxs.length >= 2) {
      const excess = Math.round(weekendTxs.reduce((s, e) => s + e.amount, 0) * 0.25);
      list.push({
        title: 'Weekend Overspending',
        desc: `Weekend transactions average ₹${Math.round(avgWeekend)}, which is ${Math.round(((avgWeekend - avgWeekday)/avgWeekday)*100)}% higher than weekday averages.`,
        amount: excess,
        savingTip: 'Impose a weekend cash limit card or use debit restrictions on Saturdays.'
      });
    }

    // Leak 2: Late Night Spending (10 PM to 5 AM)
    const lateNightTxs = currentMonthExpenses.filter(e => {
      const desc = e.description?.toLowerCase() || '';
      return desc.includes('late') || desc.includes('pub') || desc.includes('club') || desc.includes('night') || desc.includes('bar');
    });
    if (lateNightTxs.length > 0) {
      const sum = lateNightTxs.reduce((s, e) => s + e.amount, 0);
      list.push({
        title: 'Late Night Discretionary Outlays',
        desc: `${lateNightTxs.length} transactions logged for late-night commute, dining, or leisure.`,
        amount: sum,
        savingTip: 'Plan travel returns earlier, or cap night-out budgets at ₹1,500 per month.'
      });
    }

    // Leak 3: Food Delivery Addiction
    const foodDeliveryTxs = currentMonthExpenses.filter(e => {
      const desc = e.description?.toLowerCase() || '';
      return e.category === 'Food' && (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('delivery'));
    });
    const foodDeliverySum = foodDeliveryTxs.reduce((s, e) => s + e.amount, 0);
    if (foodDeliveryTxs.length >= 5 || foodDeliverySum > 2500) {
      list.push({
        title: 'Food Delivery Excess',
        desc: `${foodDeliveryTxs.length} online delivery orders this month, totaling ₹${foodDeliverySum.toLocaleString()}.`,
        amount: Math.round(foodDeliverySum * 0.4),
        savingTip: 'Limit online orders to Friday/Saturday nights only. Cook home meals during weeknights.'
      });
    }

    // Leak 4: Impulse Shopping
    const impulseShopping = currentMonthExpenses.filter(e => e.category === 'Shopping' && e.amount >= 2000);
    if (impulseShopping.length > 0) {
      const sum = impulseShopping.reduce((s, e) => s + e.amount, 0);
      list.push({
        title: 'High-Value Impulse Shopping',
        desc: `${impulseShopping.length} retail purchases above ₹2,000.`,
        amount: Math.round(sum * 0.35),
        savingTip: 'Adopt the 48-hour card freeze rule. Delete shopping apps from your phone.'
      });
    }

    // Leak 5: Subscription Overload
    const subSum = categorySpent['Subscriptions'] || 0;
    if (subSum > 1000) {
      list.push({
        title: 'Subscription Overload',
        desc: `Total monthly subscriptions fee is ₹${subSum.toLocaleString()}.`,
        amount: Math.round(subSum * 0.5),
        savingTip: 'Audit active digital services and cancel platforms not watched in the last 14 days.'
      });
    }

    // Leak 6: Frequent Small Expenses (under ₹200)
    const smallTxs = currentMonthExpenses.filter(e => e.amount <= 200 && !['Investments', 'Rent', 'Insurance'].includes(e.category));
    if (smallTxs.length >= 5) {
      const sum = smallTxs.reduce((s, e) => s + e.amount, 0);
      list.push({
        title: 'Frequent Small Expenses',
        desc: `${smallTxs.length} small retail outlays (tea, coffee, snacks, quick rides) adding up silently.`,
        amount: Math.round(sum * 0.3),
        savingTip: 'Establish a prepaid weekly pocket wallet. Avoid card swipes for minor cash outlays.'
      });
    }

    return list;
  }, [currentMonthExpenses, categorySpent]);

  const potentialMonthlySavings = leaks.reduce((sum, l) => sum + l.amount, 0);
  const potentialAnnualSavings = potentialMonthlySavings * 12;

  // --- EXPENSE HEALTH SCORE ENGINE (OUT OF 100) ---
  const healthScoreDetails = useMemo(() => {
    // 1. Budget Discipline (25 points): deduct 5 points per violated category
    let violatedCount = 0;
    CATEGORIES.forEach(c => {
      if (categorySpent[c.name] > categoryBudgets[c.name]) {
        violatedCount++;
      }
    });
    const budgetDiscipline = Math.max(0, 25 - (violatedCount * 5));

    // 2. Savings Rate (25 points)
    let savingsRateScore = 0;
    if (actualSavingsRate >= 30) savingsRateScore = 25;
    else if (actualSavingsRate >= 20) savingsRateScore = 15;
    else if (actualSavingsRate >= 10) savingsRateScore = 5;

    // 3. Expense Consistency (20 points): wants ratio
    const wantsSpent = categorySpent['Food'] + categorySpent['Shopping'] + categorySpent['Travel'] + categorySpent['Entertainment'] + categorySpent['Subscriptions'] + categorySpent['Gifts'];
    const wantsRatio = salary > 0 ? wantsSpent / salary : 0;
    let consistencyScore = 5;
    if (wantsRatio <= 0.35) consistencyScore = 20;
    else if (wantsRatio <= 0.45) consistencyScore = 15;
    else if (wantsRatio <= 0.55) consistencyScore = 10;

    // 4. Goal Contribution (15 points)
    const hasGoalPayments = goals.some(g => g.currentAmount > 0);
    const goalScore = hasGoalPayments ? 15 : 0;

    // 5. Spending Efficiency (15 points)
    let efficiencyScore = Math.max(0, 15 - (leaks.length * 3));

    const total = budgetDiscipline + savingsRateScore + consistencyScore + goalScore + efficiencyScore;

    let status = 'Poor';
    let color = 'text-red-500';
    let bg = 'bg-red-500/10';
    let progress = 'bg-red-500';
    
    if (total >= 85) {
      status = 'Excellent';
      color = 'text-emerald-400';
      bg = 'bg-emerald-500/10';
      progress = 'bg-emerald-500';
    } else if (total >= 65) {
      status = 'Good';
      color = 'text-blue-400';
      bg = 'bg-blue-500/10';
      progress = 'bg-blue-500';
    } else if (total >= 45) {
      status = 'Average';
      color = 'text-yellow-400';
      bg = 'bg-yellow-500/10';
      progress = 'bg-yellow-400';
    }

    return {
      total,
      budgetDiscipline,
      savingsRateScore,
      consistencyScore,
      goalScore,
      efficiencyScore,
      status,
      color,
      bg,
      progress,
      violatedCount,
      wantsRatio
    };
  }, [categorySpent, categoryBudgets, actualSavingsRate, salary, goals, leaks]);

  // --- HISTORICAL COMPARISON SIMULATOR ---
  const comparisonData = useMemo(() => {
    const periods = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12
    };
    const multiplier = periods[comparePeriod] || 1;

    let totalHistoricalSpent = 0;
    const historicalCategorySpent = {};

    CATEGORIES.forEach(c => {
      const hash = c.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const catFactor = 0.75 + (hash % 40) / 100;
      const histVal = Math.round(categoryBudgets[c.name] * catFactor * multiplier);
      
      historicalCategorySpent[c.name] = histVal;
      totalHistoricalSpent += histVal;
    });

    const diff = (totalSpent * multiplier) - totalHistoricalSpent;
    const diffPct = totalHistoricalSpent > 0 ? (diff / totalHistoricalSpent) * 100 : 0;
    
    const avgHistMonthlySpent = totalHistoricalSpent / multiplier;
    const savingsDiff = (salary - totalSpent) - (salary - avgHistMonthlySpent);

    const trendChart = CATEGORIES.map(c => ({
      category: c.name,
      'Historical (Avg)': Math.round(historicalCategorySpent[c.name] / multiplier),
      'Current Month': categorySpent[c.name]
    })).filter(d => d['Historical (Avg)'] > 0 || d['Current Month'] > 0);

    return {
      totalHistoricalSpent,
      avgHistMonthlySpent,
      diff,
      diffPct,
      savingsDiff,
      trendChart
    };
  }, [comparePeriod, categorySpent, totalSpent, categoryBudgets, salary]);

  // --- GOAL IMPACT CALCULATOR ENGINE ---
  const goalImpact = useMemo(() => {
    const selectedGoal = goals.find(g => g.id === selectedGoalId);
    if (!selectedGoal) return null;

    const remainingAmount = Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount);
    const defaultMonthlyGoalContribution = Math.max(1500, Math.round(netSavings * 0.3));
    const normalMonths = defaultMonthlyGoalContribution > 0 ? Math.ceil(remainingAmount / defaultMonthlyGoalContribution) : 36;
    const acceleratedContribution = defaultMonthlyGoalContribution + goalReduceAmount;
    const acceleratedMonths = Math.ceil(remainingAmount / acceleratedContribution);
    const monthsSaved = Math.max(0, normalMonths - acceleratedMonths);

    return {
      goalName: selectedGoal.name,
      targetAmount: selectedGoal.targetAmount,
      currentAmount: selectedGoal.currentAmount,
      remainingAmount,
      defaultContribution: defaultMonthlyGoalContribution,
      normalMonths,
      acceleratedMonths,
      monthsSaved
    };
  }, [goals, selectedGoalId, netSavings, goalReduceAmount]);

  // --- DYNAMIC ADVISOR ANALYSIS ENGINE ---
  const advisorReview = useMemo(() => {
    const strengths = [];
    const weaknesses = [];
    const warnings = [];
    const recommendations = [];

    if (actualSavingsRate >= 30) {
      strengths.push('Superb savings rate (>30%). Your wealth buffer expands rapidly.');
    } else if (actualSavingsRate < 10) {
      weaknesses.push('High spending exposure leaves less than 10% cash savings buffer.');
      warnings.push('Dangerous savings depletion! Any emergency will force you to borrow.');
      recommendations.push('Enforce "Save before you spend" by locking 20% salary on day 1.');
    }

    if (healthScoreDetails.violatedCount === 0) {
      strengths.push('Excellent category budget discipline. No category limit was broken.');
    } else if (healthScoreDetails.violatedCount > 3) {
      weaknesses.push(`Broken budget limits in ${healthScoreDetails.violatedCount} categories.`);
      warnings.push('Widespread budget leakage across multiple want-based outlays.');
      recommendations.push('Freeze non-essential Shopping and Subscriptions next month.');
    }

    const foodSpent = categorySpent['Food'] || 0;
    const foodLimit = categoryBudgets['Food'] || 1000;
    if (foodSpent > foodLimit * 1.25) {
      weaknesses.push('Severe Food category budget violation.');
      warnings.push(`Outside dining is ${Math.round((foodSpent / foodLimit) * 100 - 100)}% above recommended limit.`);
      recommendations.push(`Cut Swiggy/Zomato orders next month to save ₹1,000.`);
    }

    const shopSpent = categorySpent['Shopping'] || 0;
    const shopLimit = categoryBudgets['Shopping'] || 1000;
    if (shopSpent > shopLimit * 1.3) {
      weaknesses.push('Shopping outlays exceed targeted allocations.');
      recommendations.push('Enforce a 48-hour cool-off period on online orders.');
    }

    if (goals.length > 0 && !goals.some(g => g.currentAmount > 0)) {
      weaknesses.push('Active goals set up but no cash contributions logged.');
      recommendations.push('Link your savings account and transfer ₹1,500 to goal funds today.');
    }

    if (strengths.length === 0) strengths.push('Your liquid bank account has basic transaction consistency.');
    if (recommendations.length === 0) recommendations.push('Continue systematic SIP contributions in diversified mutual funds.');

    return {
      strengths,
      weaknesses,
      warnings,
      recommendations
    };
  }, [actualSavingsRate, healthScoreDetails, categorySpent, categoryBudgets, goals]);

  // --- FILE EXPORT ENGINE ---
  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Category,Description,Amount\n';
    
    filteredExpenses.forEach(exp => {
      csvContent += `${exp.date},"${exp.category}","${exp.description || ''}",${exp.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinBuddy_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    let content = 'Date\tCategory\tDescription\tAmount\n';
    filteredExpenses.forEach(exp => {
      content += `${exp.date}\t${exp.category}\t${exp.description || ''}\t₹${exp.amount}\n`;
    });

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinBuddy_Expenses_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const categoryRankings = useMemo(() => {
    return CATEGORIES.map(c => {
      const spent = categorySpent[c.name] || 0;
      const pct = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;
      return {
        name: c.name,
        icon: c.icon,
        spent,
        pct
      };
    }).sort((a, b) => b.spent - a.spent);
  }, [categorySpent, totalSpent]);

  const breakdownData = useMemo(() => {
    return CATEGORIES.map(c => ({
      name: c.name,
      value: categorySpent[c.name] || 0
    })).filter(d => d.value > 0);
  }, [categorySpent]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-white min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8 print:bg-white print:text-slate-950">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            <FaFileInvoiceDollar className="text-blue-500" /> Expense Intelligence System
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            FiinBuddy Personal Spending Advisor: Statement importer, leak scanners, target gap graphs, and goal impact simulators.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-850 self-start">
          {[
            { id: 'advisor', label: 'Spending Coach' },
            { id: 'planner', label: 'Budget Planner' },
            { id: 'importer', label: 'Import Engine' },
            { id: 'leaks', label: 'Leak Detector' },
            { id: 'analytics', label: 'Period Analytics' },
            { id: 'goals', label: 'Goal Impact' },
            { id: 'log', label: 'Transaction Log' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block border-b-2 border-slate-950 pb-4 mb-6">
        <h1 className="text-3xl font-extrabold">FiinBuddy Monthly Spending & Financial Analytics Report</h1>
        <p className="text-sm text-slate-600 mt-1">Date Generated: {new Date().toLocaleDateString()} | User: {user?.name} ({user?.email})</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 print:hidden">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-2 print:hidden">
          <FaCheckCircle /> {success}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN CONTENT */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* TAB 1: SPENDING COACH (SUMMARY DASHBOARD) */}
          {activeTab === 'advisor' && (
            <div className="space-y-8">
              
              {/* Health score and metrics panels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Dial Widget */}
                <div className={`md:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 ${healthScoreDetails.bg}`}></div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Expense Health Score</h3>
                  
                  <div className="relative flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        stroke={healthScoreDetails.total >= 85 ? '#10b981' : (healthScoreDetails.total >= 65 ? '#3b82f6' : (healthScoreDetails.total >= 45 ? '#fbbf24' : '#ef4444'))} 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - healthScoreDetails.total / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className={`absolute text-3xl font-extrabold ${healthScoreDetails.color}`}>{healthScoreDetails.total}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${healthScoreDetails.bg} ${healthScoreDetails.color} border border-slate-800`}>
                    {healthScoreDetails.status}
                  </span>
                </div>

                {/* Coach Advisor Insights */}
                <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                      <FaRobot className="text-teal-400" /> Spending Coach Insights
                    </h3>
                    <div className="space-y-2 text-xs">
                      {advisorReview.warnings.map((w, idx) => (
                        <p key={idx} className="text-rose-400 leading-normal font-semibold">⚠️ {w}</p>
                      ))}
                      {advisorReview.recommendations.map((r, idx) => (
                        <p key={idx} className="text-slate-200 leading-normal font-light">💡 <strong className="font-bold text-blue-400">Recommendation:</strong> {r}</p>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-xs font-medium">
                    <div>
                      <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Budget Violations</p>
                      <p className={`text-lg font-bold ${healthScoreDetails.violatedCount > 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {healthScoreDetails.violatedCount} Categories
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Wants Ratio</p>
                      <p className={`text-lg font-bold ${healthScoreDetails.wantsRatio > 0.45 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {Math.round(healthScoreDetails.wantsRatio * 100)}% of Salary
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Monthly Financial Review (Full Report card) */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Monthly Financial Review</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Summary sheet of your cash flow and allocation targets.</p>
                  </div>
                  <button 
                    onClick={handlePrintPDF} 
                    className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-900 transition-all flex items-center gap-1.5 print:hidden cursor-pointer"
                  >
                    <FaDownload /> Print / Export PDF
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Total Salary (Income)</p>
                    <p className="text-lg font-extrabold text-blue-400 mt-1">₹{salary.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Total Expenses</p>
                    <p className="text-lg font-extrabold text-rose-400 mt-1">₹{totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Monthly Savings</p>
                    <p className="text-lg font-extrabold text-emerald-400 mt-1">₹{netSavings.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Savings Rate</p>
                    <p className="text-lg font-extrabold text-teal-400 mt-1">{actualSavingsRate}%</p>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Advisor Review Breakdown</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-emerald-400 mb-2">▲ Portfolio Strengths</p>
                      <ul className="space-y-1 list-disc pl-4 text-slate-300 font-light">
                        {advisorReview.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-rose-400 mb-2">▼ Areas of Weakness</p>
                      <ul className="space-y-1 list-disc pl-4 text-slate-300 font-light">
                        {advisorReview.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Month Action Plan */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Monthly Improvement Action Plan</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-light">Implement these three checkpoints next month to restore your savings buffers.</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">1</span>
                      <div>
                        <p className="text-slate-200 font-bold">Enforce 48-Hour Cart Cooldown</p>
                        <p className="text-slate-400 mt-0.5 font-light">Freeze non-essential Shopping apps. Decant shopping carts for two full days before buying.</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-500 text-[10px]">Expected Saving</p>
                      <p className="text-sm font-extrabold text-emerald-400">+₹1,200</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">2</span>
                      <div>
                        <p className="text-slate-200 font-bold">Restrict Food Delivery to Weekends</p>
                        <p className="text-slate-400 mt-0.5 font-light">Limit online ordering (Swiggy/Zomato) strictly to Friday evening through Sunday night.</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-500 text-[10px]">Expected Saving</p>
                      <p className="text-sm font-extrabold text-emerald-400">+₹1,500</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">3</span>
                      <div>
                        <p className="text-slate-200 font-bold">Automated Day-1 Investments</p>
                        <p className="text-slate-400 mt-0.5 font-light">Set up an auto-debit SIP on salary credit day. Invest first, spend what remains.</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-500 text-[10px]">Expected Saving</p>
                      <p className="text-sm font-extrabold text-emerald-400">+₹3,000</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BUDGET PLANNER */}
          {activeTab === 'planner' && (
            <div className="space-y-8">
              
              {/* Budgets Summary */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Budget Allocation Dashboard</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Generated from your Salary (₹{salary.toLocaleString()}) and customized overrides. Total limits allocated: <strong>₹{totalBudgetLimit.toLocaleString()}</strong> ({budgetUtilizationRate}% utilized).
                    </p>
                  </div>
                  <button 
                    onClick={handleOpenBudgetModal}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FaSlidersH /> Customize Budgets
                  </button>
                </div>

                {/* Progress bar list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CATEGORIES.map(c => {
                    const limit = categoryBudgets[c.name];
                    const spent = categorySpent[c.name];
                    const remaining = limit - spent;
                    const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

                    let barColor = 'bg-blue-500';
                    let textBadgeColor = 'text-blue-400';
                    if (pct > 90) {
                      barColor = 'bg-rose-500';
                      textBadgeColor = 'text-rose-400';
                    } else if (pct > 70) {
                      barColor = 'bg-yellow-500';
                      textBadgeColor = 'text-yellow-400';
                    }

                    return (
                      <div key={c.name} className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{c.icon}</span>
                            <span className="font-bold text-slate-200">{c.name}</span>
                          </div>
                          <span className={`font-bold ${textBadgeColor}`}>{pct}% Spent</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
                          <div>
                            <span className="font-bold">LIMIT</span>
                            <p className="font-semibold text-slate-300 mt-0.5">₹{limit.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-bold">SPENT</span>
                            <p className="font-semibold text-slate-300 mt-0.5">₹{spent.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-bold">REMAINING</span>
                            <p className={`font-semibold mt-0.5 ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {remaining >= 0 ? `₹${remaining.toLocaleString()}` : `-₹${Math.abs(remaining).toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Budget Violations */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaExclamationTriangle className="text-yellow-500" /> Active Budget Violations
                </h3>
                <p className="text-xs text-slate-400">Categories where spending has exceeded customized limits.</p>

                <div className="space-y-4">
                  {CATEGORIES.filter(c => categorySpent[c.name] > categoryBudgets[c.name]).map(c => {
                    const spent = categorySpent[c.name];
                    const limit = categoryBudgets[c.name];
                    const over = spent - limit;

                    let tip = 'Trim want-based outlays inside this category immediately.';
                    if (c.name === 'Food') tip = 'Replace delivery orders with home-prepped food for 10 days.';
                    if (c.name === 'Shopping') tip = 'Freeze retail shopping checkouts. Adopt the 48-hour delay rule.';
                    if (c.name === 'Travel') tip = 'Consolidate commute targets. Choose public transit or carpooling.';

                    return (
                      <div key={c.name} className="bg-slate-950/80 border border-rose-500/20 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2.5 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">{c.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white">{c.name} Budget Exceeded</h4>
                              <span className="px-2 py-0.5 bg-rose-500/15 text-[9px] text-rose-400 font-bold rounded-full">
                                -₹{over.toLocaleString()} Over
                              </span>
                            </div>
                            <p className="text-slate-400 mt-1 leading-normal font-light">
                              <strong className="font-bold text-yellow-500">Coach Suggestion:</strong> {tip}
                            </p>
                          </div>
                        </div>
                        <div className="text-left md:text-right shrink-0 border-t md:border-t-0 border-slate-850 pt-2 md:pt-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Spent / Limit</p>
                          <p className="font-bold text-slate-200 mt-0.5">
                            ₹{spent.toLocaleString()} / <span className="text-blue-400">₹{limit.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {healthScoreDetails.violatedCount === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                      <span>🎉</span> All categories are behaving cleanly within limits. Stellar performance!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: IMPORT ENGINE */}
          {activeTab === 'importer' && (
            <div className="space-y-8">
              
              {/* Importer Controls */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Expense Statement Import Engine</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-light">
                    Upload statement files (.csv / .txt / .xlsx / .xls) or copy-paste transaction lists (UPI alerts, SMS alerts, Paytm reports).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-400">Option A: Upload File (.csv, .txt, .xlsx, .xls)</label>
                    <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center bg-slate-950/40">
                      <input 
                        type="file" 
                        accept=".csv,.txt,.xlsx,.xls"
                        onChange={handleFileChange} 
                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-400">Import Configuration</label>
                    <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
                      <input 
                        type="checkbox" 
                        id="overwriteImport"
                        checked={overwriteImport}
                        onChange={(e) => setOverwriteImport(e.target.checked)}
                        className="rounded border-slate-800 text-blue-500 focus:ring-0 bg-slate-900 h-4 w-4"
                      />
                      <label htmlFor="overwriteImport" className="cursor-pointer">
                        <strong>Overwrite database:</strong> Erase all existing logs before importing.
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-400">Option B: Copy-Paste Raw Text / SMS alerts</label>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                    Example SMS format: `Paid ₹420.00 to Swiggy on 2026-06-23` or GPay text details.
                  </p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows="6"
                    placeholder="Debited ₹350.00 to Zomato on 2026-06-22&#10;Paid Rs. 1500 to Shell Fuel on 22-06-2026&#10;₹999.00 paid for Netflix subscription"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  ></textarea>
                </div>

                <button
                  onClick={handleParseImport}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Parse Import Statements
                </button>
              </div>

              {/* Parsed Preview Table */}
              {showImportPreview && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">Parsed Transactions Preview</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Please review date, category, and duplicate indicators before saving.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowImportPreview(false)}
                        className="bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleCommitBulkImport}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Approve & Commit ({parsedImports.length})
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {parsedImports.map((item) => (
                          <tr key={item.tempId} className="hover:bg-slate-850/20">
                            <td className="py-2 px-3 font-mono">{item.date}</td>
                            <td className="py-2 px-3 text-slate-200 font-semibold">{item.description}</td>
                            <td className="py-2 px-3">
                              <select
                                value={item.category}
                                onChange={(e) => {
                                  setParsedImports(prev => prev.map(p => p.tempId === item.tempId ? { ...p, category: e.target.value } : p));
                                }}
                                className="bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none"
                              >
                                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                              </select>
                            </td>
                            <td className="py-2 px-3 font-bold text-rose-400">₹{item.amount.toLocaleString()}</td>
                            <td className="py-2 px-3 text-center">
                              {item.isDuplicate ? (
                                <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                  Duplicate Warning
                                </span>
                              ) : (
                                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                  New
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: SPENDING LEAK DETECTOR */}
          {activeTab === 'leaks' && (
            <div className="space-y-8">
              
              {/* Leaks Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex items-center gap-4">
                  <div className="p-4 bg-yellow-500/10 text-yellow-500 rounded-2xl text-3xl border border-yellow-500/20">
                    <FaPiggyBank />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Potential Monthly Leak Savings</p>
                    <h3 className="text-2xl font-extrabold text-yellow-400">₹{potentialMonthlySavings.toLocaleString('en-IN')}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Calculated based on 40% leak rebalance.</p>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl text-3xl border border-emerald-500/20">
                    <FaMoneyBillWave />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Potential Annual Savings</p>
                    <h3 className="text-2xl font-extrabold text-emerald-400">₹{potentialAnnualSavings.toLocaleString('en-IN')}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Yearly compounded wealth expansion.</p>
                  </div>
                </div>
              </div>

              {/* Leak sweeps list */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Identified Cash Leaks</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-light">We audited your transactions for recurring want-based spikes and leaks.</p>
                </div>

                <div className="space-y-4">
                  {leaks.map((leak, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-200">{leak.title}</h4>
                        <p className="text-slate-400 leading-normal font-light">{leak.desc}</p>
                        <p className="text-[11px] text-slate-500 leading-normal italic mt-1">
                          <span className="font-bold text-emerald-500/80">Plugging Action:</span> {leak.savingTip}
                        </p>
                      </div>
                      <div className="text-left md:text-right shrink-0 border-t md:border-t-0 border-slate-850 pt-2 md:pt-0">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Wasted Sum</p>
                        <p className="text-sm font-extrabold text-rose-400">₹{leak.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}

                  {leaks.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No leaking spending patterns identified. Your spending remains exceptionally clean!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: PERIOD ANALYTICS (HISTORICAL COMPARISON) */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              
              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-bold text-slate-200">Category Wise Breakdown</h3>
                  
                  <div className="h-60 flex items-center justify-center">
                    {breakdownData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={breakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {breakdownData.map((entry, index) => {
                              const catIdx = CATEGORIES.findIndex(c => c.name === entry.name);
                              return (
                                <Cell key={`cell-${index}`} fill={COLORS[catIdx % COLORS.length]} />
                              );
                            })}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => `₹${value.toLocaleString()}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-slate-500">No transactions recorded this month.</p>
                    )}
                  </div>
                </div>

                {/* Historical Comparison Bar Chart */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-200">Spend Comparison Trends</h3>
                    
                    <select
                      value={comparePeriod}
                      onChange={(e) => setComparePeriod(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-xs text-slate-400 focus:outline-none cursor-pointer"
                    >
                      <option value="1m">vs Previous Month</option>
                      <option value="3m">vs Last 3 Months</option>
                      <option value="6m">vs Last 6 Months</option>
                      <option value="1y">vs Last Year</option>
                    </select>
                  </div>

                  <div className="h-60">
                    {comparisonData.trendChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData.trendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="category" stroke="#64748b" style={{ fontSize: '8px' }} />
                          <YAxis stroke="#64748b" style={{ fontSize: '9px' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => `₹${value.toLocaleString()}`}
                          />
                          <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                          <Bar dataKey="Historical (Avg)" fill="#1e293b" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="Current Month" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-slate-500 flex items-center justify-center h-full">No transactions to map.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Comparison Stats */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-md font-bold text-white">Period Trend Analysis</h3>
                <p className="text-xs text-slate-400">Evaluation comparing active outlays against the historical period.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Spent Difference</p>
                    <p className={`text-lg font-bold mt-1 ${comparisonData.diff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {comparisonData.diff <= 0 ? '-' : '+'}₹{Math.abs(comparisonData.diff).toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-500">{comparisonData.diff <= 0 ? 'Decreased' : 'Increased'} by {Math.abs(comparisonData.diffPct).toFixed(1)}%</span>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Savings Improvement</p>
                    <p className={`text-lg font-bold mt-1 ${comparisonData.savingsDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {comparisonData.savingsDiff >= 0 ? '+' : '-'}₹{Math.abs(comparisonData.savingsDiff).toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-500">{comparisonData.savingsDiff >= 0 ? 'Savings grew' : 'Savings shrank'} vs period avg</span>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <p className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">Trend Verdict</p>
                    <div className="mt-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block border ${
                        comparisonData.diff <= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {comparisonData.diff <= 0 ? 'CONSOLIDATING' : 'INFLATING'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Rankings */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-md font-bold text-white">Expenditure Category Rankings</h3>
                <div className="space-y-3">
                  {categoryRankings.filter(c => c.spent > 0).map((c, idx) => (
                    <div key={c.name} className="flex justify-between items-center text-xs p-2.5 rounded bg-slate-950/60 border border-slate-850">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-bold w-4">{idx + 1}</span>
                        <span>{c.icon}</span>
                        <span className="font-bold text-slate-200">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-slate-300">₹{c.spent.toLocaleString()}</span>
                        <span className="bg-slate-900 text-slate-400 font-bold px-2 py-0.5 rounded text-[10px] w-12 text-center">{c.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: GOAL IMPACT ANALYSIS */}
          {activeTab === 'goals' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Goal Impact Projections</h3>
                <p className="text-xs text-slate-500 mt-0.5">Determine how trims in your discretionary categories speed up active goals.</p>
              </div>

              {goals.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl bg-slate-950/40">
                  <p className="text-sm font-semibold text-slate-400">No active goals found.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Please create financial targets in the Goal Planner tab first.</p>
                </div>
              ) : (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-400 uppercase text-[9px] mb-1.5">Select Target Goal</label>
                      <select
                        value={selectedGoalId}
                        onChange={(e) => setSelectedGoalId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {goals.map(g => (
                          <option key={g.id} value={g.id}>{g.name} (Target: ₹{g.targetAmount.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-400 uppercase text-[9px] mb-1.5">Category to Optimize</label>
                      <select
                        value={goalReduceCategory}
                        onChange={(e) => setGoalReduceCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-400 uppercase text-[9px] mb-1.5">Monthly Savings Trimming (₹)</label>
                      <input
                        type="number"
                        step="100"
                        value={goalReduceAmount}
                        onChange={(e) => setGoalReduceAmount(Math.max(100, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {goalImpact && (
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full"></div>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-850">
                        <div>
                          <h4 className="text-sm font-bold text-white">Timeline impact on "{goalImpact.goalName}"</h4>
                          <p className="text-slate-400 mt-0.5">Remaining target capital needed: <strong>₹{goalImpact.remainingAmount.toLocaleString()}</strong></p>
                        </div>
                        <div className="bg-blue-600/10 border border-blue-500/20 text-blue-400 font-extrabold px-4 py-2 rounded-xl text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Months Saved</p>
                          <p className="text-2xl mt-0.5">{goalImpact.monthsSaved} Months</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                        <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                          <h5 className="font-bold text-slate-300">Baseline Scenario</h5>
                          <p className="text-slate-400 font-light">With current saving rate parameters, you allocate approximately <strong className="text-slate-200">₹{goalImpact.defaultContribution.toLocaleString()}</strong> per month to this target.</p>
                          <p className="font-semibold text-slate-200">Estimated Timeline: {goalImpact.normalMonths} Months</p>
                        </div>

                        <div className="space-y-2 bg-emerald-950/10 p-4 rounded-xl border border-emerald-950/25">
                          <h5 className="font-bold text-emerald-400">Optimized Scenario</h5>
                          <p className="text-slate-400 font-light">By cutting <strong className="text-slate-200">₹{goalReduceAmount.toLocaleString()}/month</strong> from your {goalReduceCategory} budget, you channel <strong className="text-emerald-400">₹{(goalImpact.defaultContribution + goalReduceAmount).toLocaleString()}</strong> monthly.</p>
                          <p className="font-semibold text-emerald-400">New Timeline: {goalImpact.acceleratedMonths} Months</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 italic text-center font-light">
                        "Small adjustments in daily comfort categories (like dining or retail carts) build huge compound momentum on vital goals."
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: TRANSACTION LOG & SMART SEARCH */}
          {activeTab === 'log' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
              
              {/* Header and Exporters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Logged Transactions Ledger</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Filter, search, audit, or export logged expenses lists.</p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={exportToCSV}
                    className="bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FaDownload /> Export CSV
                  </button>
                  <button 
                    onClick={exportToExcel}
                    className="bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FaDownload /> Export Excel
                  </button>
                </div>
              </div>

              {/* Smart Search Bar */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                {/* Keyword Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vendor or description..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Category Selector */}
                <div>
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                {/* Date range filter */}
                <div>
                  <select
                    value={searchDateRange}
                    onChange={(e) => setSearchDateRange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="Current Month">Current Month</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="All">All Ledger Logs</option>
                  </select>
                </div>

                {/* Amount ranges */}
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={searchMinAmt}
                    onChange={(e) => setSearchMinAmt(e.target.value)}
                    placeholder="Min ₹"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-600">-</span>
                  <input
                    type="number"
                    value={searchMaxAmt}
                    onChange={(e) => setSearchMaxAmt(e.target.value)}
                    placeholder="Max ₹"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Bulk Delete Operations Actions Bar */}
              {selectedExpenseIds.length > 0 && (
                <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-200 font-medium">
                    Selected <strong className="font-bold text-rose-400">{selectedExpenseIds.length}</strong> transactions for deletion.
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedExpenseIds([])}
                      className="bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                    >
                      Cancel Selection
                    </button>
                    <button 
                      onClick={handleBulkDeleteExpenses}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/10"
                    >
                      <FaTrash size={11} /> Delete Selected
                    </button>
                  </div>
                </div>
              )}

              {/* Transactions Ledger Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 text-center w-12">
                        <input 
                          type="checkbox"
                          checked={filteredExpenses.length > 0 && filteredExpenses.every(e => selectedExpenseIds.includes(e.id))}
                          onChange={handleToggleSelectAllExpenses}
                          className="rounded border-slate-800 text-blue-500 focus:ring-0 bg-slate-950 h-4 w-4 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description / Vendor</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className={`hover:bg-slate-850/20 ${selectedExpenseIds.includes(exp.id) ? 'bg-rose-500/5' : ''}`}>
                        {/* Checkbox column */}
                        <td className="py-3 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedExpenseIds.includes(exp.id)}
                            onChange={() => handleToggleSelectExpense(exp.id)}
                            className="rounded border-slate-800 text-blue-500 focus:ring-0 bg-slate-950 h-4 w-4 cursor-pointer"
                          />
                        </td>

                        {/* Editable Category Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={exp.category || 'Other'}
                            onChange={(e) => handleEditExpenseCategory(exp.id, e.target.value)}
                            className="bg-slate-950 border border-slate-850 text-blue-400 font-bold px-2 py-1 rounded-lg text-[10px] focus:outline-none cursor-pointer"
                          >
                            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                        </td>

                        <td className="py-3 px-4 text-slate-200 font-semibold">{exp.description || 'No description'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{exp.date}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-400 font-sans">₹{exp.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          >
                            <FaTrash size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500">
                          No matching transactions found in database ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DETAILED MANUAL LOGGER & STATS */}
        <div className="xl:col-span-1 space-y-8 print:hidden">
          
          {/* Quick Expense entry */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaPlus className="text-blue-500 text-sm" /> Quick Entry Presets
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal font-light">
                Click any shortcut to log an instant transaction or enter specifics below.
              </p>
            </div>

            {/* Shortcut grid */}
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.slice(0, 9).map(c => (
                <button
                  key={c.name}
                  onClick={() => handleQuickAdd(c.name, c.name === 'Food' ? 200 : (c.name === 'Travel' ? 100 : 500), `Quick ${c.name} outflow`)}
                  className="bg-slate-950/80 border border-slate-850 hover:border-blue-500/40 p-3 rounded-xl flex flex-col items-center justify-center text-center hover:bg-slate-900/50 transition-all group cursor-pointer"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{c.icon}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-white font-bold mt-1.5 truncate w-full">{c.name}</span>
                </button>
              ))}
            </div>

            {/* Detailed input form */}
            <div className="border-t border-slate-850 pt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">New Transaction Log</h4>
              
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 420.00"
                    className="w-full rounded-lg border border-slate-850 bg-slate-950/80 py-2 px-3 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-855 bg-slate-950/80 py-2 px-3 text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-855 bg-slate-950/80 py-2 px-3 text-xs text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Description / Vendor</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Swiggy order, Metro ride"
                    className="w-full rounded-lg border border-slate-855 bg-slate-950/80 py-2 px-3 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FaPlus className="text-[10px]" /> Log Outflow
                </button>
              </form>
            </div>
          </div>

          {/* Quick stats check */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Wallet Check</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Income</span>
                <span className="font-bold text-blue-400">₹{salary.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Spent This Month</span>
                <span className="font-bold text-rose-400">₹{totalSpent.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full" 
                  style={{ width: `${Math.min(100, Math.round((totalSpent/salary)*100))}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center border-t border-slate-850 pt-3">
                <span className="text-slate-300 font-semibold">Unspent Buffer</span>
                <span className="text-sm font-extrabold text-emerald-400">₹{netSavings.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CUSTOM BUDGET MODAL ADJUSTMENT */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaSlidersH className="text-blue-500" /> Customize Category Budgets
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust category budget limits. Leave unmodified fields to follow auto-generated parameters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {CATEGORIES.map(c => (
                <div key={c.name} className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>{c.icon}</span> {c.name} (₹)
                  </label>
                  <input
                    type="number"
                    value={editingBudgets[c.name] !== undefined ? editingBudgets[c.name] : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingBudgets(prev => ({ ...prev, [c.name]: val }));
                    }}
                    placeholder={`Auto: ${autoBudgets[c.name]}`}
                    className="bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="bg-slate-950 border border-slate-855 hover:bg-slate-900 text-slate-400 hover:text-white px-4 py-2 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomBudgets}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ExpenseTracker;