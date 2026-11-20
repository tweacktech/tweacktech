import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, Clock, Type, Award, Star,
   ChevronUp, ChevronDown
} from 'lucide-react';
import Footer from '../Component/Footer';
import Navbar from '../Component/Navbar';

// Expanded word lists by difficulty
const WORD_LISTS = {
  easy: [
    "cat", "dog", "run", "sun", "map", "car", "hat",
    "ball", "tree", "book", "desk", "fish", "bird", "home"
  ],
  medium: [
    "javascript", "python", "coding", "laptop", "server",
    "network", "system", "simple", "complex", "design",
    "create", "develop", "mobile", "online", "program"
  ],
  hard: [
    "algorithm", "synchronization", "architecture",
    "optimization", "cryptocurrency", "microservices",
    "asynchronous", "containerization", "polymorphism",
    "encapsulation", "cybersecurity", "implementation"
  ]
};

const SpeedTypingTest = () => {
  // Game state
  const [currentWord, setCurrentWord] = useState('');
  const [typedWord, setTypedWord] = useState('');
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [highScores, setHighScores] = useState({
    easy: 0,
    medium: 0,
    hard: 0
  });
  const [gameStats, setGameStats] = useState({
    correctWords: 0,
    incorrectWords: 0,
    accuracy: 0
  });

  const inputRef = useRef(null);

  // Load high scores from localStorage on component mount
  useEffect(() => {
    const savedHighScores = localStorage.getItem('typingHighScores');
    if (savedHighScores) {
      setHighScores(JSON.parse(savedHighScores));
    }
  }, []);

  // Game logic functions
  const startGame = () => {
    setIsGameStarted(true);
    setIsGameOver(false);
    setScore(0);
    setTimeRemaining(60);
    setGameStats({
      correctWords: 0,
      incorrectWords: 0,
      accuracy: 0
    });
    selectNewWord();
    inputRef.current.focus();
  };

  const selectNewWord = () => {
    const currentWordList = WORD_LISTS[difficulty];
    const randomWord = currentWordList[Math.floor(Math.random() * currentWordList.length)];
    setCurrentWord(randomWord);
    setTypedWord('');
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setTypedWord(value);

    if (value === currentWord) {
      setScore(prevScore => prevScore + 1);
      setGameStats(prev => ({
        ...prev,
        correctWords: prev.correctWords + 1,
        accuracy: Math.round(((prev.correctWords + 1) / (prev.correctWords + prev.incorrectWords + 2)) * 100)
      }));
      selectNewWord();
    } else if (value.length === currentWord.length) {
      setGameStats(prev => ({
        ...prev,
        incorrectWords: prev.incorrectWords + 1,
        accuracy: Math.round(((prev.correctWords) / (prev.correctWords + prev.incorrectWords + 1)) * 100)
      }));
    }
  };

  // Timer and game end logic
  useEffect(() => {
    if (isGameStarted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      endGame();
    }
  }, [isGameStarted, timeRemaining]);

  const endGame = () => {
    setIsGameOver(true);
    setIsGameStarted(false);

    // Update high scores
    const currentSpeed = calculateTypingSpeed();
    const newHighScores = { ...highScores };

    if (currentSpeed > newHighScores[difficulty]) {
      newHighScores[difficulty] = currentSpeed;
      setHighScores(newHighScores);
      localStorage.setItem('typingHighScores', JSON.stringify(newHighScores));
    }
  };

  // Difficulty adjustment
  const changeDifficulty = (direction) => {
    const difficulties = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(difficulty);
    let newIndex = direction === 'up'
      ? Math.min(currentIndex + 1, difficulties.length - 1)
      : Math.max(currentIndex - 1, 0);

    setDifficulty(difficulties[newIndex]);
  };

  // Calculate typing speed
  const calculateTypingSpeed = () => {
    return Math.round((score / 60) * 60);
  };

  return (
    <div>
      <Navbar/>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 flex items-center justify-center">
            <Type className="mr-3 text-blue-600" size={32} />
            Speed Typing Test
          </h1>

          {/* Difficulty Selection */}
          <div className="mb-4 flex items-center justify-center">
            <span className="mr-2 font-semibold capitalize">Difficulty:</span>
            <div className="flex items-center">
              <button
                onClick={() => changeDifficulty('down')}
                className="mr-2 text-gray-600 hover:text-blue-600"
              >
                <ChevronDown size={20} />
              </button>
              <span className="font-bold text-blue-600 capitalize">{difficulty}</span>
              <button
                onClick={() => changeDifficulty('up')}
                className="ml-2 text-gray-600 hover:text-blue-600"
              >
                <ChevronUp size={20} />
              </button>
            </div>
          </div>

          {/* Game Status Display */}
          <div className="mb-6 flex justify-between">
            <div className="flex items-center">
              <Clock className="mr-2 text-green-600" size={24} />
              <span className="font-semibold">
                Time: {timeRemaining}s
              </span>
            </div>
            <div className="flex items-center">
              <Award className="mr-2 text-yellow-600" size={24} />
              <span className="font-semibold">
                Score: {score}
              </span>
            </div>
          </div>

          {/* Word Display */}
          {isGameStarted && !isGameOver && (
            <div className="mb-6">
              <div className="text-2xl font-bold text-blue-600 mb-4">
                {currentWord}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={typedWord}
                onChange={handleInputChange}
                disabled={!isGameStarted || isGameOver}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type the word here"
              />
            </div>
          )}

          {/* Game Start/Restart Button */}
          {!isGameStarted && (
            <button
              onClick={startGame}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
            >
              <RefreshCw className="mr-2" size={20} />
              {isGameOver ? 'Play Again' : 'Start Game'}
            </button>
          )}

          {/* Game Over Results */}
          {isGameOver && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                Game Over!
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Words Typed:</span>
                  <span>{score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Typing Speed:</span>
                  <span>{calculateTypingSpeed()} WPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Accuracy:</span>
                  <span>{gameStats.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">
                    <Star className="inline mr-1 text-yellow-500" size={16} />
                    High Score ({difficulty}):
                  </span>
                  <span>{highScores[difficulty]} WPM</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </div>
    
  );
};

export default SpeedTypingTest;