import { Send, Upload, Trash2 } from 'lucide-react';
import { ChatBubbleLeftRightIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { ChatCircleDots, UploadSimple, Trash } from 'phosphor-react';

export default function IconPreview() {
  return (
    <div className="grid grid-cols-3 gap-6 p-6 bg-[#0a0c0e] text-[#e0c87a]">
      <div className="flex flex-col items-center">
        <Send className="w-6 h-6" />
        <span className="text-xs mt-2">Lucide: Send</span>
      </div>
      <div className="flex flex-col items-center">
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
        <span className="text-xs mt-2">Heroicons: Chat</span>
      </div>
      <div className="flex flex-col items-center">
        <ChatCircleDots size={24} />
        <span className="text-xs mt-2">Phosphor: Chat</span>
      </div>
    </div>
  );
}
