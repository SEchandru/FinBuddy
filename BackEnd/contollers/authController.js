const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'finbuddy_secret_key_2026_jwt_token_12345';

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  try {
    const existingUser = db.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = db.create('users', {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      isOnboarded: false,
      age: null,
      monthlyIncome: 0,
      monthlySavingsGoal: 0,
      netWorth: 0,
      financialHealthScore: 50, // Default starting score
      riskProfile: null // will be determined by assessment
    });

    // Create default portfolio entries for the user
    db.create('portfolio', { userId: newUser.id, assetType: 'Stocks', amount: 0 });
    db.create('portfolio', { userId: newUser.id, assetType: 'Bonds', amount: 0 });
    db.create('portfolio', { userId: newUser.id, assetType: 'Gold', amount: 0 });
    db.create('portfolio', { userId: newUser.id, assetType: 'Cash', amount: 0 });

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isOnboarded: newUser.isOnboarded
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const user = db.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isOnboarded: user.isOnboarded
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = db.findOne('users', { id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Exclude password from response
    const { password, ...userProfile } = user;

    // Fetch user's current transactions, goals, and portfolio to compile dashboard overview
    const expenses = db.find('expenses', { userId: req.user.id });
    const goals = db.find('goals', { userId: req.user.id });
    const portfolio = db.find('portfolio', { userId: req.user.id });

    res.json({
      user: userProfile,
      summary: {
        totalExpensesCount: expenses.length,
        totalGoalsCount: goals.length,
        portfolioCount: portfolio.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

exports.onboard = async (req, res) => {
  const { age, monthlyIncome, monthlySavingsGoal, netWorth } = req.body;

  if (age === undefined || monthlyIncome === undefined || monthlySavingsGoal === undefined) {
    return res.status(400).json({ message: 'Please provide age, monthly income, and savings goal.' });
  }

  try {
    const parsedAge = parseInt(age);
    const parsedIncome = parseFloat(monthlyIncome);
    const parsedGoal = parseFloat(monthlySavingsGoal);
    const parsedNetWorth = parseFloat(netWorth) || 0;

    const user = db.findOne('users', { id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update user profile parameters
    db.update('users', { id: req.user.id }, {
      age: parsedAge,
      monthlyIncome: parsedIncome,
      monthlySavingsGoal: parsedGoal,
      netWorth: parsedNetWorth,
      isOnboarded: true
    });

    // Update cash portfolio item with initial netWorth/savings
    db.update('portfolio', { userId: req.user.id, assetType: 'Cash' }, { amount: parsedNetWorth });

    res.json({
      message: 'Onboarding completed successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isOnboarded: true
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during onboarding.' });
  }
};

exports.updateProfile = async (req, res) => {
  const updates = req.body;
  try {
    const user = db.findOne('users', { id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Exclude fields that shouldn't be edited directly this way
    delete updates.id;
    delete updates.password;
    delete updates.email;

    db.update('users', { id: req.user.id }, updates);

    // Fetch updated user profile
    const updatedUser = db.findOne('users', { id: req.user.id });
    const { password, ...userProfile } = updatedUser;

    res.json({
      message: 'Profile updated successfully!',
      user: userProfile
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
};
