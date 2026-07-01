import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import {
  FaCheckCircle,
  FaArrowRight,
  FaShieldAlt,
  FaUndo,
  FaExclamationTriangle,
  FaUserAstronaut,
  FaPercentage
} from 'react-icons/fa';

const COLORS = ['#3b82f6', '#10b981', '#fbbf24', '#a855f7'];

function RiskQuiz() {
  const { API_URL, user, onboard } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      setCurrentStep(0);
      setAnswers({});
      
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/quiz/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch quiz questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/quiz/submit`, { answers }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
      // Sync local auth user state (especially financialHealthScore and riskProfile)
      if (user) {
        await onboard({
          ...user,
          riskProfile: {
            category: res.data.category,
            recommendation: res.data.recommendation
          }
        });
      }
    } catch (err) {
      console.error(err);
      setError('Error submitting quiz answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare chart data
  const pieData = result?.recommendation ? Object.entries(result.recommendation).map(([name, value]) => ({
    name,
    value
  })) : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <FaShieldAlt className="text-blue-500" /> Risk Assessment Quiz
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Evaluate your volatility appetite and discover your custom asset allocation model.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400 flex items-center gap-2">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Quiz Completion Screen */}
      {result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Result Card (1-Col) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-bl-full"></div>
            
            <FaUserAstronaut className="text-5xl text-blue-400 animate-bounce mt-4" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Your Risk Profile</span>
              <h2 className="text-3xl font-black text-white mt-1 uppercase tracking-tight">
                {result.category}
              </h2>
            </div>

            <div className="bg-slate-950 border border-slate-855 rounded-xl px-5 py-3 w-full text-xs text-slate-400 font-light leading-relaxed">
              Based on your answers, you have a **{result.category}** tolerance profile. We have adjusted your **Financial Health Score** and calculated custom allocation suggestions.
            </div>

            <button
              onClick={fetchQuestions}
              className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl border border-slate-700 hover:text-white transition-all flex items-center gap-2 cursor-pointer w-full justify-center"
            >
              <FaUndo /> Retake Assessment
            </button>
          </div>

          {/* Allocation Details (2-Cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="h-60 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(val) => [`${val}%`, 'Allocation']}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full md:w-1/2 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FaPercentage className="text-teal-400" /> Target Asset Allocations
              </h3>
              
              <div className="space-y-3">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-xs text-slate-300 font-bold">{item.name}</span>
                    </div>
                    <span className="text-sm font-extrabold text-white font-mono">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Active Screen */
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Assessment in progress</span>
            <span>Question {currentStep + 1} of {questions.length}</span>
          </div>

          {/* Active Question */}
          {questions.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white leading-snug">
                {questions[currentStep].question}
              </h3>

              <div className="space-y-3">
                {questions[currentStep].options.map((opt, oIdx) => {
                  const isSelected = answers[questions[currentStep].id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(questions[currentStep].id, oIdx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer text-xs font-semibold leading-relaxed flex items-center justify-between group ${
                        isSelected
                          ? 'bg-blue-600/10 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-855 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span>{opt.text}</span>
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-700 group-hover:border-slate-500'
                      }`}>
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Step Navigation Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800/60">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="px-4 py-2 border border-slate-800 bg-slate-950/80 hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-all cursor-pointer"
                >
                  Previous
                </button>

                {currentStep === questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || answers[questions[currentStep].id] === undefined}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? 'Analyzing...' : 'Submit Profile'} <FaCheckCircle />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={answers[questions[currentStep].id] === undefined}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Next Question <FaArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RiskQuiz;
