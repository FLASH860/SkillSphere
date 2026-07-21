import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchConversations, fetchMessages } from '../api/messages';
import { initSocket, getSocket } from '../api/socket';
import { uploadToCloudinary } from '../api/upload';
import DashboardShell from '../components/DashboardShell';

const buildConversationId = (a, b) => [a, b].sort().join('_');

export default function ChatPage() {
  const user = useSelector((s) => s.auth.user);
  const [searchParams] = useSearchParams();
  const startWithId = searchParams.get('with');
  const startWithName = searchParams.get('name');

  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    const socket = initSocket(user._id);

    socket.on('newMessage', (msg) => {
      setMessages((prev) => {
        if (active && msg.conversationId === active.conversationId) {
          return [...prev, msg];
        }
        return prev;
      });
      setConversations((prev) => {
        const exists = prev.find((c) => c.conversationId === msg.conversationId);
        const otherUser =
          msg.sender._id === user._id
            ? active?.otherUser
            : { _id: msg.sender._id, name: msg.sender.name };
        if (exists) {
          return prev.map((c) =>
            c.conversationId === msg.conversationId
              ? { ...c, lastMessage: msg.text, lastMessageAt: msg.createdAt }
              : c
          );
        }
        return [
          {
            conversationId: msg.conversationId,
            otherUser,
            lastMessage: msg.text,
            lastMessageAt: msg.createdAt,
          },
          ...prev,
        ];
      });
    });

    socket.on('userTyping', ({ senderId }) => {
      if (active && active.otherUser._id === senderId) setOtherTyping(true);
    });
    socket.on('userStoppedTyping', ({ senderId }) => {
      if (active && active.otherUser._id === senderId) setOtherTyping(false);
    });

    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [user._id, active]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (startWithId && user._id !== startWithId) {
      const conversationId = buildConversationId(user._id, startWithId);
      const existing = conversations.find((c) => c.conversationId === conversationId);
      if (existing) {
        selectConversation(existing);
      } else {
        selectConversation({
          conversationId,
          otherUser: { _id: startWithId, name: startWithName || 'User' },
          lastMessage: '',
        });
      }
    } else if (!active && conversations.length > 0) {
      selectConversation(conversations[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWithId, conversations.length]);

  const loadConversations = async () => {
    const res = await fetchConversations();
    setConversations(res.data);
  };

  const selectConversation = async (conv) => {
    setActive(conv);
    setOtherTyping(false);
    const res = await fetchMessages(conv.conversationId);
    setMessages(res.data);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = () => {
    if (!text.trim() || !active) return;
    const socket = getSocket();
    socket.emit('sendMessage', {
      senderId: user._id,
      receiverId: active.otherUser._id,
      text: text.trim(),
    });
    socket.emit('stopTyping', { senderId: user._id, receiverId: active.otherUser._id });
    setText('');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    setUploadingFile(true);
    try {
      const url = await uploadToCloudinary(file);
      const socket = getSocket();
      socket.emit('sendMessage', {
        senderId: user._id,
        receiverId: active.otherUser._id,
        text: '',
        fileUrl: url,
      });
    } catch (err) {
      alert(err.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!active) return;
    const socket = getSocket();
    socket.emit('typing', { senderId: user._id, receiverId: active.otherUser._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stopTyping', { senderId: user._id, receiverId: active.otherUser._id });
    }, 1500);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <DashboardShell title="Messages">
    <div className="flex h-full min-h-0 bg-ink text-text-primary -m-6 divide-x divide-border">
      <div className="w-72 overflow-y-auto">
        <h2 className="font-['Fraunces'] text-lg px-4 py-3 border-b border-border">Messages</h2>
        {conversations.length === 0 && (
          <p className="px-4 py-3 text-sm text-text-muted">No conversations yet.</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.conversationId}
            onClick={() => selectConversation(c)}
            className={`w-full text-left px-4 py-3 border-b border-border hover:bg-surface transition ${
              active?.conversationId === c.conversationId ? 'bg-surface-alt' : ''
            }`}
          >
            <p className="font-medium text-sm">{c.otherUser?.name || 'User'}</p>
            <p className="text-xs text-text-muted truncate font-['IBM_Plex_Mono']">
              {c.lastMessage || 'No messages yet'}
            </p>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-text-muted">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border font-medium">
              {active.otherUser?.name}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 flex flex-col justify-end">
              {messages.map((m) => {
                const mine = (m.sender._id || m.sender) === user._id;
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                        mine ? 'bg-amber text-ink' : 'bg-surface-alt text-text-primary'
                      }`}
                    >
                      {m.fileUrl && (
                        /\.(jpg|jpeg|png|gif|webp)$/i.test(m.fileUrl) ? (
                          <a href={m.fileUrl} target="_blank" rel="noreferrer">
                            <img src={m.fileUrl} alt="attachment" className="max-w-[200px] rounded mb-1" />
                          </a>
                        ) : (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-xs font-mono block mb-1"
                          >
                            📎 Attachment
                          </a>
                        )
                      )}
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {otherTyping && (
                <p className="text-xs text-sage italic">
                  {active.otherUser?.name} is typing...
                </p>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <label className="cursor-pointer bg-surface hover:bg-surface-alt rounded px-3 py-2 text-sm transition flex items-center">
                {uploadingFile ? '...' : '📎'}
                <input
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploadingFile}
                  className="hidden"
                />
              </label>
              <input
                value={text}
                onChange={handleTyping}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-surface rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber"
              />
              <button
                onClick={handleSend}
                className="bg-amber text-ink px-4 py-2 rounded text-sm font-medium hover:opacity-90"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </DashboardShell>
  );
}



























