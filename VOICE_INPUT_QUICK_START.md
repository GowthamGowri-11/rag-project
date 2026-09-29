# Voice Input Quick Start Guide

## 🎤 How to Use Voice Input

### Step 1: Access the Chat Interface
1. Open your browser and navigate to: `http://localhost:3000`
2. Click on **"ATLYX Chat"** tab in the navigation

### Step 2: Select Your Language
1. Look for the **🌐 EN** button next to the microphone in the chat input area
2. Click it to open the language dropdown
3. Select your preferred language:
   - **EN** - English (India)
   - **தமிழ்** - Tamil
   - **हिन्दी** - Hindi
   - **తెలుగు** - Telugu
   - **മലയാളം** - Malayalam
   - **ಕನ್ನಡ** - Kannada

### Step 3: Start Voice Input
1. Click the **🎤 microphone button**
2. Your browser will ask for microphone permission (first time only)
3. Click **"Allow"** to grant permission
4. You'll see a red pulsing microphone and **"Listening..."** indicator
5. Speak clearly in your selected language

### Step 4: Review and Send
1. The recognized text will appear in the input field
2. You can edit the text if needed
3. Click the **➤ send button** or press **Enter** to send your message
4. The chatbot will respond normally

---

## 🎯 Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Type your message here...                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🏷️ Domain: All   🏷️ Strategy: auto        🌐 EN  🎤  ➤   │
└─────────────────────────────────────────────────────────────┘
                                                    ↑    ↑   ↑
                                            Language  Mic Send
                                            Selector
```

### When Listening:
```
                                    ┌─────────────────┐
                                    │ • Listening...  │
                                    └─────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Your spoken text appears here as you speak...              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🏷️ Domain: All   🏷️ Strategy: auto        🌐 EN  🔴  ➤   │
└─────────────────────────────────────────────────────────────┘
                                                    ↑   ↑
                                            Language Red
                                            Selector Mic
```

---

## 💡 Pro Tips

### Tip 1: Combine Typing and Voice
You can mix typed and spoken input:
1. Type: "Explain this code"
2. Click microphone
3. Speak: "in Python"
4. Result: "Explain this code in Python"

### Tip 2: Stop Recording Anytime
- Click the red microphone button again to stop recording
- The system will automatically stop after you finish speaking

### Tip 3: Language Persistence
- Your selected language is remembered between sessions
- No need to select it every time

### Tip 4: Voice with Domain Filters
- Voice input works with all existing features
- Select a specific domain before speaking
- Choose a retrieval strategy
- Everything works seamlessly together

### Tip 5: Clear Speech = Better Results
- Speak clearly and at normal pace
- Avoid background noise if possible
- Pause briefly between sentences
- Spell out unusual technical terms if needed

---

## ⚠️ Troubleshooting

### Problem: Microphone button does nothing
**Solution:**
1. Check if your browser supports voice input (Chrome/Edge recommended)
2. Make sure you're using HTTPS or localhost
3. Check browser console for permission errors

### Problem: Wrong language is recognized
**Solution:**
1. Click the 🌐 language selector
2. Verify the correct language is selected (✓ checkmark)
3. Try speaking again

### Problem: "Microphone permission was denied"
**Solution:**
1. Click the 🔒 lock icon in your browser's address bar
2. Find "Microphone" permissions
3. Change to "Allow"
4. Refresh the page

### Problem: Recognition stops immediately
**Solution:**
1. Check your internet connection (most browsers need it)
2. Ensure microphone is not being used by another application
3. Try a different browser (Chrome recommended)

### Problem: Text is not accurate
**Solution:**
1. Speak more slowly and clearly
2. Reduce background noise
3. Position microphone closer
4. Try typing if recognition is consistently poor

---

## 🌍 Supported Languages

| Language | Works Best For |
|----------|---------------|
| **English (India)** | English speakers in India, code discussions |
| **Tamil** | Tamil speakers, regional queries |
| **Hindi** | Hindi speakers across India |
| **Telugu** | Telugu speakers in Andhra Pradesh, Telangana |
| **Malayalam** | Malayalam speakers in Kerala |
| **Kannada** | Kannada speakers in Karnataka |

---

## 🔐 Privacy & Security

✅ **Your voice is processed by your browser** - not stored by the application  
✅ **No audio recordings are saved** - only the text transcript  
✅ **Microphone permission** is controlled by you  
✅ **Works offline in some browsers** - depending on browser support  
✅ **No external APIs** - uses built-in browser technology  

---

## 📱 Mobile Usage

Voice input works on mobile devices too:

1. **Android Chrome**: Full support ✅
2. **iOS Safari**: Partial support ⚠️
3. **Mobile browsers**: Tap microphone, speak, send

Mobile tips:
- Tap and hold for continuous recording (in some browsers)
- Use external microphone for better quality
- Check browser permissions in device settings

---

## 🎬 Example Workflows

### Example 1: Quick Question in English
1. Click microphone 🎤
2. Say: "What is semantic chunking?"
3. Click send ➤
4. Get answer with citations

### Example 2: Code Question in Hindi
1. Select Hindi (हिन्दी) from 🌐 selector
2. Click microphone 🎤
3. Speak your question in Hindi
4. Text appears in Hindi
5. Send and get response

### Example 3: Multi-turn Conversation with Voice
1. Voice: "Explain RAG systems"
2. Send → Get response
3. Voice: "What are the benefits?"
4. Send → Get response
5. Voice: "Show me examples"
6. Send → Get response

### Example 4: Domain-Specific Voice Query
1. Select Domain: "Legal" from dropdown
2. Select language: English
3. Voice: "Summarize compliance policies"
4. Send → Get domain-filtered response

---

## ✨ What's Working

✅ Voice-to-text in 6 Indian languages  
✅ Real-time language switching  
✅ Visual feedback (listening indicator)  
✅ Error handling with user-friendly messages  
✅ Preserves existing text when appending  
✅ Works with all chatbot features  
✅ Remembers language preference  
✅ Mobile responsive  
✅ Accessible (ARIA labels, keyboard navigation)  

---

## 🚀 Next Steps

1. **Test Basic Voice Input**:
   - Open http://localhost:3000
   - Navigate to ATLYX Chat
   - Try English voice input first

2. **Test Your Native Language**:
   - Switch to Tamil/Hindi/Telugu/Malayalam/Kannada
   - Verify recognition accuracy

3. **Test Edge Cases**:
   - Try with existing text
   - Test with domain filters
   - Test language switching

4. **Report Issues**:
   - Note which browser you're using
   - Specify which language had issues
   - Check browser console for errors

---

## 📞 Support

If you encounter any issues:

1. **Check browser compatibility** - Chrome/Edge recommended
2. **Verify microphone permissions** - must be allowed
3. **Test with English first** - to isolate language-specific issues
4. **Check internet connection** - required for cloud-based recognition
5. **Try incognito mode** - to rule out extension conflicts

---

**Ready to try it? Open http://localhost:3000 and click ATLYX Chat!** 🎤✨
