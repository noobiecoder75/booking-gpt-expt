'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Send, Edit, X, Clock } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ClientMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, requestChanges: boolean) => void;
  agentName: string;
}

export function ClientMessageModal({ 
  isOpen, 
  onClose, 
  onSend, 
  agentName 
}: ClientMessageModalProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'question' | 'changes'>('question');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      await onSend(message.trim(), messageType === 'changes');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setMessageType('question');
    onClose();
  };

  const quickMessages = {
    question: [
      "I have some questions about the itinerary",
      "Can you provide more details about the accommodations?",
      "What's included in the activity pricing?",
      "Are there any additional fees I should know about?"
    ],
    changes: [
      "I'd like to modify the travel dates",
      "Can we look at different accommodation options?",
      "I'd prefer different flight times",
      "Can we add/remove some activities?"
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-clio-gray-50 dark:bg-clio-gray-800/50 border-b border-clio-gray-100 dark:border-clio-gray-800">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white dark:bg-clio-gray-900 rounded-xl flex items-center justify-center shadow-sm">
              <MessageSquare className="w-6 h-6 text-clio-blue" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                Message {agentName}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest">
                Direct inquiry regarding your quote
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white dark:bg-clio-gray-900">
          {/* Message Type Selection */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">What would you like to do?</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMessageType('question')}
                className={`p-5 rounded-2xl border text-left transition-all duration-200 group ${
                  messageType === 'question'
                    ? 'border-clio-blue bg-clio-blue/5 text-clio-blue shadow-sm'
                    : 'border-clio-gray-100 dark:border-clio-gray-800 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                }`}
              >
                <MessageSquare className={`w-6 h-6 mb-3 ${messageType === 'question' ? 'text-clio-blue' : 'text-clio-gray-400 group-hover:text-clio-gray-600'}`} />
                <div className="font-bold uppercase tracking-tight text-sm mb-1">Ask Questions</div>
                <div className="text-[10px] font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest">
                  Get more information
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMessageType('changes')}
                className={`p-5 rounded-2xl border text-left transition-all duration-200 group ${
                  messageType === 'changes'
                    ? 'border-clio-blue bg-clio-blue/5 text-clio-blue shadow-sm'
                    : 'border-clio-gray-100 dark:border-clio-gray-800 hover:border-clio-gray-300 dark:hover:border-clio-gray-700'
                }`}
              >
                <Edit className={`w-6 h-6 mb-3 ${messageType === 'changes' ? 'text-clio-blue' : 'text-clio-gray-400 group-hover:text-clio-gray-600'}`} />
                <div className="font-bold uppercase tracking-tight text-sm mb-1">Request Changes</div>
                <div className="text-[10px] font-medium text-clio-gray-500 dark:text-clio-gray-400 uppercase tracking-widest">
                  Modify the quote
                </div>
              </button>
            </div>
          </div>

          {/* Quick Message Options */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Quick Suggestions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickMessages[messageType].map((quickMsg, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMessage(quickMsg)}
                  className="text-left text-[10px] font-bold uppercase tracking-tight p-3 rounded-xl border border-clio-gray-100 dark:border-clio-gray-800 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800 hover:border-clio-blue/30 transition-all text-clio-gray-600 dark:text-clio-gray-400"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">
                Your Message
              </Label>
              <div className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest">
                {message.length}/500
              </div>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                messageType === 'question'
                  ? "Type your question here..."
                  : "Describe the changes you'd like to make..."
              }
              rows={4}
              className="resize-none rounded-2xl bg-clio-gray-50/50 dark:bg-clio-gray-950 border-clio-gray-200 dark:border-clio-gray-800 p-4 font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-clio-gray-100 dark:border-clio-gray-800">
            <button 
              type="button" 
              onClick={handleClose}
              disabled={isLoading}
              className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel Request
            </button>
            <Button 
              type="submit"
              disabled={!message.trim() || isLoading}
              className="bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-clio-blue/20"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="w-4 h-4 mr-3" />
                  {messageType === 'changes' ? 'Request Changes' : 'Send Message'}
                </div>
              )}
            </Button>
          </div>

          {/* Note */}
          <div className="bg-clio-blue/5 dark:bg-clio-blue/10 rounded-2xl p-5 border border-clio-blue/10">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-white dark:bg-clio-gray-900 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <Clock className="w-4 h-4 text-clio-blue" />
              </div>
              <div className="text-xs font-medium text-clio-gray-600 dark:text-clio-gray-400 leading-relaxed">
                <strong className="text-clio-blue font-bold uppercase tracking-tight">Standard Response:</strong> {agentName} typically responds within 24 hours. 
                {messageType === 'changes' && ' Note that significant changes may impact final pricing.'}
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}