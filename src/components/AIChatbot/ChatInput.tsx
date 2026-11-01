import React, { useState } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setText('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t-2 border-[#5c4e99] bg-[#120d26] p-2.5 sm:p-3 space-y-2"
    >
      <label htmlFor="ai-dungeon-mentor-input" className="sr-only">
        Tanyakan konsep ML, DL, rumus, atau kode Python kepada AI Dungeon Mentor
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="ai-dungeon-mentor-input"
          rows={2}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pertanyaan ML/DL, rumus, atau kode Python... (Enter untuk kirim)"
          className="flex-1 bg-[#0d0a1a] border-2 border-[#5c4e99] focus:border-[#38d864] px-2.5 py-2 font-vt text-lg sm:text-xl text-[#f4f1ea] placeholder-[#b3aad1]/60 focus:outline-none resize-none"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="Kirim pesan ke AI Dungeon Mentor"
          className="pixel-btn px-3.5 py-2.5 bg-[#38d864] text-[#0d0a1a] font-pixel text-[10px] shrink-0 h-[44px]"
        >
          Kirim
        </button>
      </div>
    </form>
  );
};
