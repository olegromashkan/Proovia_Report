import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../../components/Layout';
import { 
  Trash2, 
  Plus, 
  GripVertical, 
  Copy, 
  Settings, 
  Eye,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Save,
  ArrowLeft,
  MoreHorizontal,
  Move,
  Star,
  Clock,
  Users
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  description?: string;
  points: number;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  options: string[];
  required: boolean;
  order: number;
}

export default function EditTemplate() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const isNew = id === 'new' || !id;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [focusedQuestion, setFocusedQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNew) {
      addQuestion();
      return;
    }
    setIsLoading(true);
    fetch(`/api/test-templates/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch template');
        return res.json();
      })
      .then(d => {
        setName(d.template.name || '');
        setDescription(d.template.description || '');
        const qs: Question[] = (d.template.questions || []).map((q: any, index: number) => ({
          id: q.id || `q-${Date.now()}-${index}`,
          text: q.text || '',
          description: q.description || '',
          points: q.points ?? 1,
          type: q.type || 'text',
          options: q.options || [],
          required: q.required ?? false,
          order: q.order ?? index,
        }));
        setQuestions(qs);
      })
      .catch(() => setError('Failed to load template. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [id, isNew]);

  const generateId = () => `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      text: '',
      description: '',
      points: 1,
      type: 'text',
      options: [],
      required: false,
      order: questions.length
    };
    setQuestions([...questions, newQuestion]);
    setFocusedQuestion(newQuestion.id);
    setExpandedQuestion(newQuestion.id);
  };

  const updateQuestion = (id: string, field: keyof Question, val: any) => {
    setQuestions(questions.map(item => 
      item.id === id ? { ...item, [field]: val } : item
    ));
  };

  const duplicateQuestion = (id: string) => {
    const questionToDuplicate = questions.find(q => q.id === id);
    if (!questionToDuplicate) return;
    
    const newQuestion: Question = {
      ...questionToDuplicate,
      id: generateId(),
      text: `${questionToDuplicate.text} (Copy)`,
      order: questions.length
    };
    setQuestions([...questions, newQuestion]);
    setFocusedQuestion(newQuestion.id);
    setExpandedQuestion(newQuestion.id);
  };

  const deleteQuestion = (id: string) => {
    if (questions.length === 1) {
      alert('You must have at least one question');
      return;
    }
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id));
      if (expandedQuestion === id) {
        setExpandedQuestion(null);
      }
      if (focusedQuestion === id) {
        setFocusedQuestion(null);
      }
    }
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(item =>
      item.id === questionId 
        ? { ...item, options: [...(item.options || []), ''] } 
        : item
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(item => {
      if (item.id !== questionId) return item;
      const opts = [...item.options];
      opts[optionIndex] = value;
      return { ...item, options: opts };
    }));
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(item => {
      if (item.id !== questionId) return item;
      const opts = item.options.filter((_, oi) => oi !== optionIndex);
      return { ...item, options: opts };
    }));
  };

  const validateForm = () => {
    if (!name.trim()) return 'Template name is required';
    if (!questions.length) return 'At least one question is required';
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} text is required`;
      if (q.points < 1) return `Question ${i + 1} points must be at least 1`;
      if ((q.type === 'radio' || q.type === 'checkbox') && q.options.length < 2) {
        return `Question ${i + 1} must have at least 2 options`;
      }
      if ((q.type === 'radio' || q.type === 'checkbox') && q.options.some(opt => !opt.trim())) {
        return `All options in question ${i + 1} must be filled`;
      }
    }
    return null;
  };

  const save = async () => {
    const validationMsg = validateForm();
    if (validationMsg) {
      setValidationError(validationMsg);
      return;
    }

    setIsLoading(true);
    setError(null);
    setValidationError(null);

    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/test-templates' : `/api/test-templates/${id}`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, questions }),
      });
      if (!res.ok) throw new Error('Failed to save template');
      router.push('/tests/dashboard');
    } catch (err) {
      setError('Failed to save template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <AlignLeft className="h-4 w-4" />;
      case 'textarea': return <List className="h-4 w-4" />;
      case 'radio': return <Circle className="h-4 w-4" />;
      case 'checkbox': return <CheckSquare className="h-4 w-4" />;
      default: return <AlignLeft className="h-4 w-4" />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Short Answer';
      case 'textarea': return 'Long Answer';
      case 'radio': return 'Single Choice';
      case 'checkbox': return 'Multiple Choice';
      default: return 'Short Answer';
    }
  };

  const renderQuestionPreview = (question: Question) => {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{question.order + 1}.</span>
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-white leading-relaxed">
                {question.text || 'Untitled question'}
              </h3>
              {question.required && (
                <span className="text-red-500 text-sm font-medium">*</span>
              )}
            </div>
            {question.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {question.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="pl-7">
          {question.type === 'text' && (
            <div className="space-y-2">
              <input 
                className="w-full px-0 py-3 text-sm border-0 border-b border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none bg-transparent placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Your answer"
                disabled
              />
            </div>
          )}
          
          {question.type === 'textarea' && (
            <div className="space-y-2">
              <textarea 
                className="w-full px-3 py-3 text-sm rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-black/20 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
                rows={4}
                placeholder="Your answer"
                disabled
              />
            </div>
          )}
          
          {question.type === 'radio' && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <label key={index} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 opacity-0 group-hover:opacity-30"></div>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                </label>
              ))}
            </div>
          )}
          
          {question.type === 'checkbox' && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <label key={index} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 opacity-0 group-hover:opacity-30"></div>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        <div className="pl-7 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {question.points} {question.points === 1 ? 'point' : 'points'}
          </span>
          <span className="flex items-center gap-1">
            {getQuestionTypeIcon(question.type)}
            {getQuestionTypeLabel(question.type)}
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout title={isNew ? 'New Template' : 'Edit Template'}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="rounded-2xl bg-white/80 dark:bg-black/50 border border-white/20 dark:border-black/20 shadow-lg p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading template...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={isNew ? 'New Template' : 'Edit Template'}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-2xl mx-auto pt-8">
            <div className="rounded-2xl bg-white/80 dark:bg-black/50 border border-red-200 dark:border-red-800 shadow-lg p-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isNew ? 'New Template' : 'Edit Template'}>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/20 dark:border-black/20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/tests/dashboard')}
                  className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-black/30 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isNew ? 'New Template' : 'Edit Template'}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full bg-white/50 dark:bg-black/30">
                      {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full bg-white/50 dark:bg-black/30">
                      {questions.reduce((sum, q) => sum + q.points, 0)} point{questions.reduce((sum, q) => sum + q.points, 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    previewMode 
                      ? 'bg-white/80 dark:bg-black/50 border border-white/20 dark:border-black/20 text-gray-900 dark:text-white shadow-sm' 
                      : 'hover:bg-white/50 dark:hover:bg-black/30 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
                <button
                  onClick={save}
                  disabled={isLoading || !name.trim() || !questions.length}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-black/50 border border-white/20 dark:border-black/20 text-gray-900 dark:text-white font-medium hover:bg-white dark:hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {validationError && (
            <div className="mb-6 rounded-2xl bg-white/80 dark:bg-black/50 border border-red-200 dark:border-red-800 shadow-lg p-4">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm font-medium">{validationError}</p>
              </div>
            </div>
          )}

          {/* Template Header */}
          <div className="mb-8 rounded-2xl border border-white/20 dark:border-black/20 shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <input
                    className="w-full text-3xl font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-none focus:outline-none"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Untitled Template"
                  />
                </div>
                <div>
                  <textarea
                    className="w-full text-base text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-none focus:outline-none resize-none"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Add a description to help people understand this template"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {isNew ? 'Created now' : 'Last modified'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Template
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div 
                key={question.id} 
                className={`rounded-2xl border border-white/20 dark:border-black/20 shadow-lg transition-all hover:shadow-xl ${
                  focusedQuestion === question.id ? 'ring-2 ring-gray-300 dark:ring-gray-600' : ''
                }`}
              >
                {previewMode ? (
                  <div className="p-8">
                    {renderQuestionPreview(question)}
                  </div>
                ) : (
                  <div className="group">
                    {/* Question Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-black/10">
                      <div className="flex items-center gap-3">
                        <button className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/30 transition-colors cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Question {index + 1}
                          </span>
                          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                            {getQuestionTypeIcon(question.type)}
                            <span className="text-xs">{getQuestionTypeLabel(question.type)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => duplicateQuestion(question.id)}
                          className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/30 transition-colors"
                          title="Duplicate question"
                        >
                          <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </button>
                        <button
                          onClick={() => setExpandedQuestion(
                            expandedQuestion === question.id ? null : question.id
                          )}
                          className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/30 transition-colors"
                          title="Question settings"
                        >
                          <Settings className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="p-6">
                      <div className="space-y-6">
                        {/* Question Text */}
                        <div className="space-y-2">
                          <textarea
                            className="w-full text-lg font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-none focus:outline-none resize-none"
                            placeholder="Question"
                            value={question.text}
                            onChange={e => updateQuestion(question.id, 'text', e.target.value)}
                            onFocus={() => setFocusedQuestion(question.id)}
                            onBlur={() => setFocusedQuestion(null)}
                            rows={2}
                          />
                          <textarea
                            className="w-full text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-none focus:outline-none resize-none"
                            placeholder="Add a description (optional)"
                            value={question.description}
                            onChange={e => updateQuestion(question.id, 'description', e.target.value)}
                            rows={1}
                          />
                        </div>

                        {/* Question Type Selector */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <select
                              className="px-3 py-2 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-black/20 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-sm"
                              value={question.type}
                              onChange={e => updateQuestion(question.id, 'type', e.target.value as Question['type'])}
                            >
                              <option value="text">Short answer</option>
                              <option value="textarea">Long answer</option>
                              <option value="radio">Single choice</option>
                              <option value="checkbox">Multiple choice</option>
                            </select>
                          </div>
                          
                          {(question.type === 'radio' || question.type === 'checkbox') && (
                            <button
                              onClick={() => addOption(question.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-black/20 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-black/40 transition-colors text-sm"
                            >
                              <Plus className="h-4 w-4" />
                              Add option
                            </button>
                          )}
                        </div>

                        {/* Options */}
                        {(question.type === 'radio' || question.type === 'checkbox') && (
                          <div className="space-y-3">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-3 group">
                                <div className="flex-shrink-0 p-1">
                                  {question.type === 'radio' ? (
                                    <Circle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                  ) : (
                                    <CheckSquare className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                  )}
                                </div>
                                <input
                                  className="flex-1 px-3 py-2 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-black/20 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-sm"
                                  value={option}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  onChange={e => updateOption(question.id, optionIndex, e.target.value)}
                                />
                                <button
                                  onClick={() => deleteOption(question.id, optionIndex)}
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete option"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Question Settings */}
                        {expandedQuestion === question.id && (
                          <div className="pt-4 border-t border-white/10 dark:border-black/10">
                            <div className="rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-black/20 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={question.required}
                                      onChange={e => updateQuestion(question.id, 'required', e.target.checked)}
                                      className="w-4 h-4 rounded text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 focus:ring-gray-300 dark:focus:ring-gray-600"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">Required</span>
                                  </label>
                                </div>
                                <div className="flex items-center gap-3">
                                  <label className="text-sm text-gray-600 dark:text-gray-300">Points:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    className="w-20 px-3 py-2 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-black/20 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-sm"
                                    value={question.points}
                                    onChange={e => updateQuestion(question.id, 'points', Number(e.target.value))}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Question Button */}
          {!previewMode && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={addQuestion}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-gray-600 hover:text-purple-600"
              >
                <Plus className="h-5 w-5" />
                Add Question
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}