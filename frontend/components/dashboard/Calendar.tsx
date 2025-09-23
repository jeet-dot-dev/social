'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CalendarProps {
  onDateTimeSelect: (dateTime: Date | null) => void;
  selectedDateTime?: Date | null;
}

export const Calendar: React.FC<CalendarProps> = ({ onDateTimeSelect, selectedDateTime }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(selectedDateTime || null);
  const [selectedTime, setSelectedTime] = useState<string>('12:00');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateCalendarDays = () => {
    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push(
        <button
          key={`prev-${day}`}
          className="w-8 h-8 text-gray-400 text-sm hover:bg-gray-100 rounded"
          disabled
        >
          {day}
        </button>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      days.push(
        <button
          key={day}
          onClick={() => !isPast && setSelectedDate(date)}
          disabled={isPast}
          className={`w-8 h-8 text-sm rounded transition-colors ${
            isPast
              ? 'text-gray-300 cursor-not-allowed'
              : isSelected
              ? 'bg-black text-white'
              : isToday
              ? 'bg-gray-200 text-black font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }

    // Next month days to fill the grid
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <button
          key={`next-${day}`}
          className="w-8 h-8 text-gray-400 text-sm hover:bg-gray-100 rounded"
          disabled
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1));
  };

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      // Check if the scheduled time is in the future
      if (scheduledDateTime > new Date()) {
        onDateTimeSelect(scheduledDateTime);
      } else {
        alert('Please select a future date and time');
      }
    }
  };

  const handleClearSchedule = () => {
    setSelectedDate(null);
    onDateTimeSelect(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Schedule Post</h3>
        {selectedDateTime && (
          <Button
            onClick={handleClearSchedule}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h4 className="text-lg font-medium text-gray-900">
          {monthNames[month]} {year}
        </h4>
        
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {generateCalendarDays()}
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time:</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="text-sm text-gray-600">
            <p>Selected: {selectedDate.toLocaleDateString()} at {selectedTime}</p>
          </div>

          <Button
            onClick={handleSchedule}
            className="w-full bg-black hover:bg-gray-800 text-white"
          >
            Schedule Post
          </Button>
        </div>
      )}

      {!selectedDate && (
        <div className="text-center text-sm text-gray-500 py-4">
          Select a date to schedule your post
        </div>
      )}

      {selectedDateTime && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            📅 Scheduled for: {selectedDateTime.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};
