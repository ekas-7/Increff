'use client';

import { useState } from 'react';

const VirtualKeyboard = ({ onKeyPress, onBackspace, disabled }) => {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  // Define keyboard layout
  const keyboardRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
  ];

  const shiftCharMap = {
    '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
    '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
    '-': '_', '=': '+', '[': '{', ']': '}', ';': ':',
    "'": '"', ',': '<', '.': '>', '/': '?'
  };

  const handleKeyClick = (key) => {
    if (disabled) return;

    let charToSend = key;

    // Handle shift/caps lock for letters
    if (key.match(/[a-z]/)) {
      if (isShiftPressed || isCapsLock) {
        charToSend = key.toUpperCase();
      }
    } 
    // Handle shift for special characters
    else if (isShiftPressed && shiftCharMap[key]) {
      charToSend = shiftCharMap[key];
    }

    onKeyPress(charToSend);

    // Reset shift after key press (but not caps lock)
    if (isShiftPressed) {
      setIsShiftPressed(false);
    }
  };

  const handleShift = () => {
    if (disabled) return;
    setIsShiftPressed(!isShiftPressed);
  };

  const handleCapsLock = () => {
    if (disabled) return;
    setIsCapsLock(!isCapsLock);
  };

  const handleSpace = () => {
    if (disabled) return;
    onKeyPress(' ');
  };

  const handleBackspaceClick = () => {
    if (disabled) return;
    onBackspace();
  };

  const getKeyClass = (key) => {
    const baseClass = "m-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 text-center min-w-[40px] text-sm font-medium";
    
    if (disabled) {
      return baseClass + " opacity-50 cursor-not-allowed";
    }

    // Special styling for letters when caps lock or shift is active
    if (key.match(/[a-z]/) && (isShiftPressed || isCapsLock)) {
      return baseClass + " bg-blue-100 border-blue-300 text-blue-800 cursor-pointer";
    }

    return baseClass + " cursor-pointer";
  };

  const getSpecialKeyClass = (isActive = false) => {
    const baseClass = "m-1 px-4 py-2 border rounded-lg transition-colors duration-150 text-sm font-medium";
    
    if (disabled) {
      return baseClass + " bg-gray-200 border-gray-300 opacity-50 cursor-not-allowed";
    }

    if (isActive) {
      return baseClass + " bg-blue-500 border-blue-600 text-white cursor-pointer";
    }

    return baseClass + " bg-gray-200 border-gray-300 hover:bg-gray-300 active:bg-gray-400 cursor-pointer";
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      {/* Keyboard rows */}
      {keyboardRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center mb-2">
          {rowIndex === 1 && (
            <button
              onClick={() => onKeyPress('\t')}
              disabled={disabled}
              className={getSpecialKeyClass()}
            >
              Tab
            </button>
          )}
          
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyClick(key)}
              disabled={disabled}
              className={getKeyClass(key)}
            >
              {(isShiftPressed || isCapsLock) && key.match(/[a-z]/) 
                ? key.toUpperCase() 
                : isShiftPressed && shiftCharMap[key] 
                  ? shiftCharMap[key] 
                  : key
              }
            </button>
          ))}
          
          {rowIndex === 1 && (
            <button
              onClick={handleBackspaceClick}
              disabled={disabled}
              className={getSpecialKeyClass()}
            >
              ⌫ Backspace
            </button>
          )}
        </div>
      ))}

      {/* Bottom row with special keys */}
      <div className="flex justify-center mb-2">
        <button
          onClick={handleCapsLock}
          disabled={disabled}
          className={getSpecialKeyClass(isCapsLock)}
        >
          ⇪ Caps Lock
        </button>
        
        <button
          onClick={handleShift}
          disabled={disabled}
          className={getSpecialKeyClass(isShiftPressed)}
        >
          ⇧ Shift
        </button>
        
        <button
          onClick={handleSpace}
          disabled={disabled}
          className={getSpecialKeyClass() + " min-w-[200px]"}
        >
          Space
        </button>
        
        <button
          onClick={() => onKeyPress('.')}
          disabled={disabled}
          className={getKeyClass('.')}
        >
          .
        </button>
        
        <button
          onClick={() => onKeyPress(',')}
          disabled={disabled}
          className={getKeyClass(',')}
        >
          ,
        </button>
        
        <button
          onClick={() => onKeyPress('!')}
          disabled={disabled}
          className={getKeyClass('!')}
        >
          !
        </button>
        
        <button
          onClick={() => onKeyPress('?')}
          disabled={disabled}
          className={getKeyClass('?')}
        >
          ?
        </button>
      </div>

      {/* Status indicators */}
      <div className="flex justify-center gap-4 mt-3 text-xs text-gray-600">
        <div className={`flex items-center gap-1 ${isCapsLock ? 'text-blue-600 font-medium' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${isCapsLock ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          Caps Lock {isCapsLock ? 'ON' : 'OFF'}
        </div>
        <div className={`flex items-center gap-1 ${isShiftPressed ? 'text-blue-600 font-medium' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${isShiftPressed ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          Shift {isShiftPressed ? 'ON' : 'OFF'}
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
