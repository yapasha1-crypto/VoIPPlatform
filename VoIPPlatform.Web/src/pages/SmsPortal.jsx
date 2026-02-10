import { useState, useEffect } from 'react';
import { MessageSquare, Send, Inbox, CheckCircle, XCircle, Clock } from 'lucide-react';
import { smsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const SmsPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('compose');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ totalSMS: 0, totalCost: 0, successRate: '0%' });

  // Compose form state
  const [formData, setFormData] = useState({
    receiverNumber: '',
    messageBody: '',
  });

  // Fetch messages and stats when History tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      fetchMessages();
    }
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await smsAPI.getMyMessages();
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load message history');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Limit message body to 160 characters
    if (name === 'messageBody' && value.length > 160) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendSMS = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.receiverNumber || !formData.messageBody) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.messageBody.length > 160) {
      toast.error('Message exceeds 160 characters');
      return;
    }

    try {
      setLoading(true);

      // Prepare request data
      const requestData = {
        accountId: user?.accountId || 1, // Use user's account ID or default
        userId: user?.id || 1,
        senderNumber: user?.phoneNumber || 'VoIPv1',
        recipientNumber: formData.receiverNumber,
        messageContent: formData.messageBody,
      };

      const response = await smsAPI.sendSMS(requestData);

      if (response.data.success) {
        toast.success('SMS sent successfully!');
        // Clear form
        setFormData({
          receiverNumber: '',
          messageBody: '',
        });
        // Switch to history tab to show the sent message
        setActiveTab('history');
      } else {
        toast.error(response.data.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);

      // Handle specific error codes
      if (error.response?.status === 402) {
        toast.error('Insufficient balance. Please top up your account.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to send SMS. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Sent: { color: 'bg-green-500/20 text-green-400 border-green-500/50', icon: CheckCircle },
      Failed: { color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: XCircle },
      Delivered: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: CheckCircle },
      Pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: Clock },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  };

  // Calculate statistics from messages
  useEffect(() => {
    if (messages.length > 0) {
      const totalSMS = messages.length;
      const totalCost = messages.reduce((sum, msg) => sum + msg.Cost, 0);
      const sentCount = messages.filter(msg => msg.Status === 'Sent' || msg.Status === 'Delivered').length;
      const successRate = ((sentCount / totalSMS) * 100).toFixed(1) + '%';

      setStats({ totalSMS, totalCost, successRate });
    }
  }, [messages]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">SMS Portal</h1>
          <p className="text-slate-400">Send messages and view your SMS history</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex gap-2 mb-6 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'compose'
                ? 'text-violet-400 border-violet-500'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            <Send className="w-4 h-4" />
            Compose SMS
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'history'
                ? 'text-violet-400 border-violet-500'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Sent History
          </button>
        </div>

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="space-y-6">
            <form onSubmit={handleSendSMS} className="space-y-4">
              {/* Receiver Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Receiver Number
                </label>
                <input
                  type="tel"
                  name="receiverNumber"
                  value={formData.receiverNumber}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {/* Message Body */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Message
                  </label>
                  <span className={`text-sm font-medium ${
                    formData.messageBody.length > 160 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {formData.messageBody.length}/160
                  </span>
                </div>
                <textarea
                  name="messageBody"
                  value={formData.messageBody}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  rows="4"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                  required
                  disabled={loading}
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || formData.messageBody.length === 0 || formData.receiverNumber.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            {messages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Total SMS Sent</p>
                  <p className="text-2xl font-bold text-white">{stats.totalSMS}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-violet-400">${stats.totalCost.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Success Rate</p>
                  <p className="text-2xl font-bold text-green-400">{stats.successRate}</p>
                </div>
              </div>
            )}

            {/* Messages Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No messages sent yet</p>
                <p className="text-slate-500 text-sm mt-2">
                  Switch to the Compose tab to send your first SMS
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                        Time
                      </th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                        To
                      </th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                        Message
                      </th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                        Cost
                      </th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {messages.map((message) => (
                      <tr key={message.Id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 text-sm text-slate-300">
                          {formatDate(message.CreatedAt)}
                        </td>
                        <td className="py-4 text-sm text-slate-300 font-mono">
                          {message.RecipientNumber}
                        </td>
                        <td className="py-4 text-sm text-slate-400 max-w-xs">
                          {truncateMessage(message.MessageContent)}
                        </td>
                        <td className="py-4 text-sm text-violet-400 font-medium">
                          ${message.Cost.toFixed(2)}
                        </td>
                        <td className="py-4">
                          {getStatusBadge(message.Status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmsPortal;
