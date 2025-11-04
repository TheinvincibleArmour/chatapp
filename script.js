const chat = document.getElementById('chat');
const speakBtn = document.getElementById('speakBtn');
const nextBtn = document.getElementById('nextBtn');
const conversationBtn = document.getElementById('conversationBtn');
const languageSelect = document.getElementById('languageSelect');
const topicSelect = document.getElementById('topicSelect');
const scoreEl = document.getElementById('score');
const xpEl = document.getElementById('xp');
const streakEl = document.getElementById('streak');

let recognition;
let currentLanguage = languageSelect.value;
let selectedTopic = null;
let currentExerciseIndex = 0;
let streak = parseInt(localStorage.getItem('streak') || 0);
let xp = parseInt(localStorage.getItem('xp') || 0);

updateStats();

// Example lessons
const lessons = {
  "en-US": {
    greetings: [
      { type: "listen", phrase: "Hello", translation: "Hello" },
      { type: "speak", phrase: "Good morning", translation: "Good morning" },
      { type: "translate", phrase: "Thank you", translation: "Thank you" }
    ],
    travel: [
      { type: "listen", phrase: "Where is the airport?", translation: "Where is the airport?" },
      { type: "speak", phrase: "I need a taxi", translation: "I need a taxi" },
      { type: "translate", phrase: "How much is this?", translation: "How much is this?" }
    ]
  },
  "es-ES": {
    greetings: [
      { type: "listen", phrase: "Hola", translation: "Hello" },
      { type: "speak", phrase: "Buenos días", translation: "Good morning" },
      { type: "translate", phrase: "Gracias", translation: "Thank you" }
    ]
  }
};

// Populate topic select dynamically
function updateTopicOptions() {
  topicSelect.innerHTML = '<option value="">Select topic</option>';
  const topics = Object.keys(lessons[currentLanguage] || {});
  topics.forEach(t => {
    const option = document.createElement('option');
    option.value = t;
    option.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    topicSelect.appendChild(option);
  });
}

updateTopicOptions();

languageSelect.addEventListener('change', () => {
  currentLanguage = languageSelect.value;
  selectedTopic = null;
  currentExerciseIndex = 0;
  updateTopicOptions();
  chat.innerHTML = "";
  addMessage("Language changed. Please select a topic.", "bot");
});

topicSelect.addEventListener('change', () => {
  selectedTopic = topicSelect.value;
  currentExerciseIndex = 0;
  chat.innerHTML = "";
  if(selectedTopic) showExercise();
});

function updateStats() {
  xpEl.textContent = `XP: ${xp}`;
  streakEl.textContent = `🔥 Streak: ${streak}`;
}

function addMessage(text, sender) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

function pronunciationScore(expected, actual) {
  const e = expected.toLowerCase(), a = actual.toLowerCase();
  let matches = 0;
  for (let i = 0; i < Math.min(e.length, a.length); i++) if (e[i] === a[i]) matches++;
  return Math.round((matches / e.length) * 100);
}

function speak(text, lang) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  speechSynthesis.speak(utter);
}

function showExercise() {
  if (!selectedTopic) return;
  const exercises = lessons[currentLanguage][selectedTopic];
  if (!exercises || exercises.length === 0) return addMessage("No exercises for this topic.", "bot");

  if (currentExerciseIndex >= exercises.length) {
    return addMessage("🎉 You've completed this topic! Choose another.", "bot");
  }

  const exercise = exercises[currentExerciseIndex];
  switch (exercise.type) {
    case "listen":
      addMessage(`Listen and repeat: "${exercise.phrase}"`, "bot");
      speak(exercise.phrase, currentLanguage);
      break;
    case "translate":
      addMessage(`Translate this: "${exercise.phrase}"`, "bot");
      break;
    case "speak":
      addMessage(`Say: "${exercise.phrase}" (${exercise.translation})`, "bot");
      speak(exercise.phrase, currentLanguage);
      break;
  }
}

function nextExercise() {
  if (!selectedTopic) return addMessage("Select a topic first.", "bot");
  currentExerciseIndex++;
  showExercise();
}

function startListening() {
  if (!selectedTopic) return addMessage("Select a topic first.", "bot");

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = currentLanguage;
  recognition.start();

  recognition.onresult = (event) => {
    const userSpeech = event.results[0][0].transcript;
    addMessage(userSpeech, 'user');

    const exercise = lessons[currentLanguage][selectedTopic][currentExerciseIndex];
    const score = pronunciationScore(exercise.phrase, userSpeech);
    scoreEl.textContent = `Pronunciation Score: ${score}%`;

    if (score >= 60) {
      addMessage("✅ Great job! +10 XP", "bot");
      xp += 10;
      streak++;
      localStorage.setItem('xp', xp);
      localStorage.setItem('streak', streak);
    } else {
      addMessage("❌ Try again to improve pronunciation.", "bot");
      streak = 0;
      localStorage.setItem('streak', 0);
    }
    updateStats();
  };
}

// Simulated AI conversation
async function startConversation() {
  addMessage("💬 AI Conversation Mode: Type messages in prompt. Type 'exit' to stop.", "bot");
  let userMessage = prompt("You:");
  while(userMessage && userMessage.toLowerCase() !== "exit") {
    const aiResponse = await getAIResponse(userMessage);
    addMessage(aiResponse, "bot");
    userMessage = prompt("You:");
  }
}

function getAIResponse(msg) {
  return new Promise(resolve => {
    setTimeout(() => resolve(`AI: I heard you say "${msg}"`), 500);
  });
}

speakBtn.addEventListener('click', startListening);
nextBtn.addEventListener('click', nextExercise);
conversationBtn.addEventListener('click', startConversation);

addMessage("Welcome! Select a language and topic, then click 'Next Exercise' to start.", "bot");
