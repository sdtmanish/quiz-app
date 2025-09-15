'use client';
import { useState, useEffect } from 'react';

export default function AddQuestions() {
  const [questionType, setQuestionType] = useState('text');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']); // four options
  const [correctAnswer, setCorrectAnswer] = useState(null); // index of correct answer
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // clean up object URL when file changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetForm = () => {
    setQuestionType('text');
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(null);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleTypeChange = (type) => {
    resetForm();
    setQuestionType(type);
    setMessage(null);
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // validations
      if (!questionText.trim()) {
        setMessage({ type: 'error', text: 'Please enter the question text ❌' });
        setLoading(false);
        return;
      }
      if (correctAnswer === null) {
        setMessage({ type: 'error', text: 'Please select the correct answer ❌' });
        setLoading(false);
        return;
      }
      if (options.some((opt) => !opt.trim())) {
        setMessage({ type: 'error', text: 'All options must be filled ❌' });
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('type', questionType);
      formData.append('question', questionText.trim());
      formData.append('options', JSON.stringify(options.map((o) => o.trim())));
      formData.append('correctAnswer', correctAnswer);

      if (file) {
        formData.append('file', file);
      }

      const token = localStorage.getItem('adminToken'); // 🔑 ensure admin is logged in
      if (!token) {
        setMessage({ type: 'error', text: 'Not authenticated. Please log in again ❌' });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, // ✅ send auth header
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({ type: 'success', text: 'Question submitted! ✅' });
      resetForm();
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ type: 'error', text: error.message || 'Upload failed ❌' });
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    if (!previewUrl) return null;

    if (questionType === 'image') {
      return (
        <img
          src={previewUrl}
          alt="preview"
          className="mt-4 max-w-full max-h-80 object-contain rounded-md"
        />
      );
    }
    if (questionType === 'audio') {
      return <audio controls src={previewUrl} className="mt-4 w-full" />;
    }
    if (questionType === 'video') {
      return <video controls src={previewUrl} className="mt-4 w-full" />;
    }
    return null;
  };

  const renderInputArea = () => (
    <div className="space-y-4">
      {/* Question text */}
      <textarea
        className="w-[96%] p-4 ml-6 border border-gray-400 rounded-md text-black focus:outline-none focus:border-blue-400"
        rows="3"
        placeholder="Type your question here..."
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />

      {renderPreview()}

      {/* File input for media types */}
      {['image', 'audio', 'video'].includes(questionType) && (
        <div className="flex flex-col items-center justify-center p-6 border-dashed border-2 rounded-md">
          <input
            type="file"
            onChange={handleFileChange}
            accept={
              questionType === 'image'
                ? 'image/*'
                : questionType === 'audio'
                ? 'audio/*'
                : 'video/*'
            }
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Choose {questionType} file
          </label>
          {file && <p className="mt-2 text-gray-500">{file.name}</p>}
        </div>
      )}

      {/* Options with radio buttons */}
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <input
              type="radio"
              name="correctAnswer"
              checked={correctAnswer === idx}
              onChange={() => setCorrectAnswer(idx)}
              className="h-4 w-4 text-green-600"
            />
            <input
              type="text"
              className="flex-1 p-3 border border-gray-400 rounded-md text-black focus:outline-none focus:border-blue-400"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-xl mt-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-black">
        MCQ Question Uploader
      </h1>

      <div className="flex justify-center space-x-4 mb-8">
        {['text', 'image', 'audio', 'video'].map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            type="button"
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              questionType === type
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderInputArea()}

        {message && (
          <div
            className={`p-4 rounded-md text-center font-bold ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 font-bold rounded-md transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Question'}
        </button>
      </form>
    </div>
  );
}
