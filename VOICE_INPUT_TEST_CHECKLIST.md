# Voice Input Testing Checklist

## Pre-Testing Setup

- [ ] Frontend server running: `http://localhost:3000`
- [ ] Backend server running: Port 5000
- [ ] AI service running: Port 8000
- [ ] Browser: Chrome/Edge (recommended) or Safari
- [ ] Microphone: Connected and working
- [ ] Internet: Connected (required for speech recognition)

---

## 🧪 Test Suite

### Test 1: English (India) Voice Input
**Language:** en-IN  
**Browser:** Chrome/Edge

**Steps:**
1. [ ] Open `http://localhost:3000`
2. [ ] Navigate to "ATLYX Chat" tab
3. [ ] Verify language selector shows "🌐 EN"
4. [ ] Click microphone button (🎤)
5. [ ] Allow microphone permission when prompted
6. [ ] Verify "Listening..." indicator appears
7. [ ] Verify microphone button turns red and pulses
8. [ ] Speak: "What is semantic chunking in RAG systems?"
9. [ ] Verify text appears in input field
10. [ ] Verify "Listening..." indicator disappears
11. [ ] Verify microphone returns to gray state
12. [ ] Click send button (➤)
13. [ ] Verify message is sent to chatbot
14. [ ] Verify chatbot responds normally

**Expected Results:**
- ✅ English speech correctly transcribed
- ✅ Text appears in input field
- ✅ Visual feedback during listening
- ✅ Normal chatbot flow maintained

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 2: Tamil (ta-IN) Voice Input
**Language:** ta-IN

**Steps:**
1. [ ] Click language selector (🌐 EN)
2. [ ] Verify dropdown opens with 6 languages
3. [ ] Click "Tamil"
4. [ ] Verify selector now shows "🌐 தமிழ்"
5. [ ] Click microphone button
6. [ ] Speak in Tamil: "இது என்ன?" (What is this?)
7. [ ] Verify Tamil text appears in input field
8. [ ] Click send
9. [ ] Verify chatbot processes query

**Expected Results:**
- ✅ Tamil text correctly transcribed
- ✅ Unicode characters display properly
- ✅ Chatbot accepts Tamil query

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

**Notes:** _______________________

---

### Test 3: Hindi (hi-IN) Voice Input
**Language:** hi-IN

**Steps:**
1. [ ] Select "Hindi" from language selector
2. [ ] Verify selector shows "🌐 हिन्दी"
3. [ ] Click microphone
4. [ ] Speak in Hindi: "यह क्या है?" (What is this?)
5. [ ] Verify Hindi text transcription
6. [ ] Send message
7. [ ] Verify response

**Expected Results:**
- ✅ Hindi Devanagari script appears correctly
- ✅ Recognition accuracy is acceptable

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 4: Telugu (te-IN) Voice Input
**Language:** te-IN

**Steps:**
1. [ ] Select "Telugu"
2. [ ] Verify "🌐 తెలుగు" displayed
3. [ ] Click microphone
4. [ ] Speak in Telugu: "ఇది ఏమిటి?" (What is this?)
5. [ ] Verify Telugu script transcription
6. [ ] Send and verify

**Expected Results:**
- ✅ Telugu script rendered correctly
- ✅ Recognition works

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 5: Malayalam (ml-IN) Voice Input
**Language:** ml-IN

**Steps:**
1. [ ] Select "Malayalam"
2. [ ] Verify "🌐 മലയാളം" displayed
3. [ ] Click microphone
4. [ ] Speak in Malayalam: "ഇത് എന്താണ്?" (What is this?)
5. [ ] Verify Malayalam script
6. [ ] Send message

**Expected Results:**
- ✅ Malayalam script displays correctly
- ✅ Recognition functional

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 6: Kannada (kn-IN) Voice Input
**Language:** kn-IN

**Steps:**
1. [ ] Select "Kannada"
2. [ ] Verify "🌐 ಕನ್ನಡ" displayed
3. [ ] Click microphone
4. [ ] Speak in Kannada: "ಇದು ಏನು?" (What is this?)
5. [ ] Verify Kannada script
6. [ ] Send message

**Expected Results:**
- ✅ Kannada script renders properly
- ✅ Recognition works

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 7: Language Persistence
**Goal:** Verify selected language is remembered

**Steps:**
1. [ ] Select "Tamil" from language selector
2. [ ] Verify "🌐 தமிழ்" is displayed
3. [ ] Refresh browser (F5)
4. [ ] Verify Tamil is still selected
5. [ ] Open browser DevTools → Application → Local Storage
6. [ ] Find key: `chatbot_voice_language`
7. [ ] Verify value: `ta-IN`
8. [ ] Close browser completely
9. [ ] Reopen browser and navigate to chat
10. [ ] Verify Tamil is still selected

**Expected Results:**
- ✅ Language preference persists across sessions
- ✅ localStorage correctly stores selection

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 8: Language Switching During Session
**Goal:** Verify safe language switching

**Steps:**
1. [ ] Select English
2. [ ] Click microphone, start speaking English
3. [ ] Mid-sentence, click microphone to stop
4. [ ] Change language to Hindi
5. [ ] Click microphone again
6. [ ] Speak in Hindi
7. [ ] Verify Hindi recognition is used (not English)

**Expected Results:**
- ✅ Language switch stops current recognition
- ✅ New session uses new language
- ✅ No errors occur

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 9: Append to Existing Text
**Goal:** Verify voice doesn't destroy typed text

**Steps:**
1. [ ] Type in input: "Explain this code"
2. [ ] Do NOT send yet
3. [ ] Click microphone
4. [ ] Speak: "in Python"
5. [ ] Verify result: "Explain this code in Python"
6. [ ] Verify proper spacing between texts
7. [ ] Send message
8. [ ] Verify chatbot receives full text

**Expected Results:**
- ✅ Existing text is preserved
- ✅ Voice text is appended with proper spacing
- ✅ No text is lost

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 10: Multiple Voice Messages
**Goal:** Verify no transcript accumulation

**Steps:**
1. [ ] Voice: "What is RAG?"
2. [ ] Send → Wait for response
3. [ ] Verify input field is cleared
4. [ ] Voice: "Explain vector databases"
5. [ ] Verify ONLY new transcript appears (no previous text)
6. [ ] Send → Wait for response
7. [ ] Voice: "How does reranking work?"
8. [ ] Verify ONLY latest transcript
9. [ ] Send → Verify response

**Expected Results:**
- ✅ Each voice message is independent
- ✅ No transcript accumulation
- ✅ Input clears after send

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 11: Permission Denied Handling
**Goal:** Verify graceful permission error handling

**Steps:**
1. [ ] Open browser settings
2. [ ] Find site permissions for localhost:3000
3. [ ] Block microphone permission
4. [ ] Navigate to chat
5. [ ] Click microphone button
6. [ ] Verify error message appears: "Microphone permission was denied..."
7. [ ] Verify error is displayed in amber alert box
8. [ ] Verify chatbot is still functional
9. [ ] Type a message: "Hello"
10. [ ] Send and verify response
11. [ ] Click X to dismiss error message
12. [ ] Verify error disappears

**Expected Results:**
- ✅ User-friendly error message shown
- ✅ Chatbot remains functional
- ✅ Typed input works normally
- ✅ Error is dismissible

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 12: Unsupported Browser
**Goal:** Test in browser without Speech API

**Browser:** Firefox (or older browser)

**Steps:**
1. [ ] Open Firefox
2. [ ] Navigate to `http://localhost:3000`
3. [ ] Go to ATLYX Chat
4. [ ] Verify microphone button is present
5. [ ] Click microphone button
6. [ ] Verify error message: "Voice input is not supported in this browser"
7. [ ] Verify typed input still works
8. [ ] Type and send a message
9. [ ] Verify full chatbot functionality

**Expected Results:**
- ✅ Graceful fallback message
- ✅ No application crash
- ✅ Typed input fully functional

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 13: No Speech / Silent Recognition
**Goal:** Handle silent microphone gracefully

**Steps:**
1. [ ] Click microphone button
2. [ ] Do NOT speak for 5 seconds
3. [ ] Wait for recognition to timeout
4. [ ] Verify no error message is shown
5. [ ] Verify UI returns to idle state
6. [ ] Verify input field remains empty
7. [ ] Verify microphone button is clickable again

**Expected Results:**
- ✅ No scary error for silence
- ✅ UI resets gracefully
- ✅ Can try again immediately

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 14: Manual Stop Recording
**Goal:** Verify user can stop recording

**Steps:**
1. [ ] Click microphone (start recording)
2. [ ] Verify "Listening..." appears
3. [ ] Verify red pulsing microphone
4. [ ] Start speaking: "This is a test..."
5. [ ] Mid-sentence, click microphone again
6. [ ] Verify recording stops immediately
7. [ ] Verify "Listening..." disappears
8. [ ] Verify microphone returns to gray
9. [ ] Verify partial transcript is in input field
10. [ ] Verify text can be edited or sent

**Expected Results:**
- ✅ Recording stops on second click
- ✅ Partial transcript preserved
- ✅ Immediate UI feedback

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 15: Integration with Existing Features
**Goal:** Verify voice doesn't break existing chatbot

**Steps:**
1. [ ] Select Domain: "RAG" (if available)
2. [ ] Select Strategy: "Hybrid"
3. [ ] Click microphone
4. [ ] Voice: "Explain RAG architecture"
5. [ ] Send
6. [ ] Verify domain filter is applied
7. [ ] Verify strategy is used
8. [ ] Verify response includes telemetry
9. [ ] Click telemetry to expand
10. [ ] Verify sources are shown
11. [ ] Click "Copy" on message
12. [ ] Verify text is copied
13. [ ] Click "Clear" conversation
14. [ ] Verify conversation cleared
15. [ ] Use voice input again
16. [ ] Verify everything still works

**Features to Test:**
- [ ] Domain selector works with voice
- [ ] Strategy selector works with voice
- [ ] Clear button works
- [ ] Copy button works
- [ ] Telemetry expansion works
- [ ] Source citations display
- [ ] Message history maintained
- [ ] Loading states work
- [ ] Pipeline animation works
- [ ] Enter to send still works
- [ ] Shift+Enter for newline still works

**Expected Results:**
- ✅ ALL existing features work normally
- ✅ Voice input integrates seamlessly
- ✅ No regression in functionality

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 16: Mobile Responsiveness
**Device:** Mobile phone or tablet

**Steps:**
1. [ ] Open on mobile device
2. [ ] Navigate to ATLYX Chat
3. [ ] Verify language selector is visible
4. [ ] Verify microphone button is tap-friendly
5. [ ] Tap language selector
6. [ ] Verify dropdown doesn't overflow screen
7. [ ] Select a language
8. [ ] Tap microphone
9. [ ] Speak into phone
10. [ ] Verify text appears
11. [ ] Tap send button
12. [ ] Verify message sent

**Expected Results:**
- ✅ All controls are touch-friendly
- ✅ No viewport overflow
- ✅ Readable on small screens
- ✅ Full functionality on mobile

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 17: Accessibility
**Goal:** Verify keyboard and screen reader support

**Steps:**
1. [ ] Tab to language selector
2. [ ] Press Enter to open
3. [ ] Use arrow keys to navigate languages
4. [ ] Press Enter to select
5. [ ] Tab to microphone button
6. [ ] Verify focus outline visible
7. [ ] Press Space/Enter to activate
8. [ ] Verify ARIA labels present (inspect in DevTools)
9. [ ] Test with screen reader (if available)

**Expected Results:**
- ✅ Keyboard navigation works
- ✅ Focus indicators visible
- ✅ ARIA labels present
- ✅ Screen reader compatible

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 18: Performance & Memory
**Goal:** Check for memory leaks

**Steps:**
1. [ ] Open browser DevTools → Performance tab
2. [ ] Start recording performance
3. [ ] Use voice input 10 times in a row
4. [ ] Switch languages 5 times
5. [ ] Start and stop recording multiple times
6. [ ] Stop performance recording
7. [ ] Check for memory leaks
8. [ ] Verify no duplicate listeners
9. [ ] Navigate away from chat
10. [ ] Come back to chat
11. [ ] Verify everything still works

**Expected Results:**
- ✅ No memory leaks detected
- ✅ No performance degradation
- ✅ Cleanup happens correctly

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 19: Network Failure
**Goal:** Handle network errors gracefully

**Steps:**
1. [ ] Open DevTools → Network tab
2. [ ] Set network to "Offline"
3. [ ] Click microphone button
4. [ ] Speak something
5. [ ] Verify error message appears
6. [ ] Set network back to "Online"
7. [ ] Try voice input again
8. [ ] Verify it works now

**Expected Results:**
- ✅ Network error handled gracefully
- ✅ User-friendly error message
- ✅ Recovery when network restored

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

### Test 20: Concurrent Usage
**Goal:** Handle rapid clicks safely

**Steps:**
1. [ ] Click microphone rapidly 5 times
2. [ ] Verify only one recognition session active
3. [ ] Verify no errors in console
4. [ ] Click stop
5. [ ] Switch language while listening
6. [ ] Verify safe handling
7. [ ] Try typing while voice is active
8. [ ] Verify both inputs work

**Expected Results:**
- ✅ No duplicate recognition instances
- ✅ Safe state management
- ✅ No race conditions

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: _______________

---

## 📊 Test Summary

**Total Tests:** 20  
**Passed:** ___  
**Failed:** ___  
**Skipped:** ___  

**Pass Rate:** ____%

---

## 🐛 Issues Found

| Test # | Issue Description | Severity | Browser | Language |
|--------|------------------|----------|---------|----------|
| | | | | |
| | | | | |
| | | | | |

**Severity Levels:**
- 🔴 Critical: Feature broken, blocks usage
- 🟡 Major: Feature degraded, workaround exists
- 🟢 Minor: Cosmetic or edge case

---

## ✅ Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Browser:** _______________  
**OS:** _______________  

**Recommendation:**
- [ ] Ready for production
- [ ] Needs fixes before production
- [ ] Needs more testing

**Notes:**
_________________________________
_________________________________
_________________________________
