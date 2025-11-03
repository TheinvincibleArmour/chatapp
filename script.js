const chat = document.getElementById('chat');
const speakBtn = document.getElementById('speakBtn');
const nextBtn = document.getElementById('nextBtn');
const languageSelect = document.getElementById('languageSelect');
const topicSelect = document.getElementById('topicSelect');
const scoreEl = document.getElementById('score');
const xpEl = document.getElementById('xp');
const streakEl = document.getElementById('streak');

let recognition;
let currentExercise = null;
let streak = parseInt(localStorage.getItem('streak') || 0);
let xp = parseInt(localStorage.getItem('xp') || 0);

updateStats();

const lessons = {
  "es-ES": {
    greetings: [
      { type: "listen", phrase: "Hola", translation: "Hello" },
      { type: "speak", phrase: "Buenos días", translation: "Good morning" },
      { type: "translate", phrase: "Gracias", translation: "Thank you" }
    ],
    intro: [
      { type: "speak", phrase: "Me llamo...", translation: "My name is..." },
      { type: "translate", phrase: "¿Cómo estás?", translation: "How are you?" }
    ],
    numbers: [
      { type: "listen", phrase: "Uno", translation: "One" },
      { type: "listen", phrase: "Dos", translation: "Two" },
      { type: "speak", phrase: "Tres", translation: "Three" }
    ]
  },
  "fr-FR": {
    greetings: [
      { type: "listen", phrase: "Bonjour", translation: "Hello" },
      { type: "speak", phrase: "Salut", translation: "Hi" },
      { type: "translate", phrase: "Merci", translation: "Thank you" }
    ]
  }
};

// ------------------- FUNCTIONS -------------------

function updateStats() {
  xpEl.textContent = `XP: ${xp}`;
  streakEl.textContent = `🔥 Streak: ${streak}`;

  const progress = document.getElementById('progress');
  if (progress) {
    // 100 XP per level
    const progressPercent = Math.min((xp % 100), 100);
    progress.style.width = `${progressPercent}%`;
  }
}

function animateStat(el) {
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 300);
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
  for (let i = 0; i < Math.min(e.length, a.length); i++) {
    if (e[i] === a[i]) matches++;
  }
  return Math.round((matches / e.length) * 100);
}

function speak(text, lang) {
  speechSynthesis.cancel(); // stop previous speech
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  speechSynthesis.speak(utter);
}

function getExercise() {
  const lang = languageSelect.value;
  const topic = topicSelect.value;
  const topicLessons = lessons[lang]?.[topic];
  if (!topicLessons || topicLessons.length === 0) return null;
  return topicLessons[Math.floor(Math.random() * topicLessons.length)];
}

// ------------------- EXERCISE FLOW -------------------

function nextExercise() {
  chat.innerHTML = "";
  currentExercise = getExercise();

  if (!currentExercise) {
    addMessage("❌ No lessons available for this topic yet.", "bot");
    return;
  }

  switch (currentExercise.type) {
    case "listen":
      addMessage(`🎧 Listen and repeat: "${currentExercise.phrase}"`, "bot");
      speak(currentExercise.phrase, languageSelect.value);
      break;
    case "translate":
      addMessage(`✏️ Translate this: "${currentExercise.phrase}"`, "bot");
      break;
    case "speak":
      addMessage(`🗣 Say: "${currentExercise.phrase}" (${currentExercise.translation})`, "bot");
      speak(currentExercise.phrase, languageSelect.value);
      break;
  }
}

// ------------------- SPEECH RECOGNITION -------------------

function startListening() {
  if (!currentExercise) {
    addMessage("⚠️ Please click 'Next' to load an exercise first.", "bot");
    return;
  }

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = languageSelect.value;
  recognition.start();
  addMessage("🎙️ Listening...", "bot");

  recognition.onresult = (event) => {
    const userSpeech = event.results[0][0].transcript;
    addMessage(userSpeech, 'user');

    const score = pronunciationScore(currentExercise.phrase, userSpeech);
    scoreEl.textContent = `Pronunciation Score: ${score}%`;

    // Dynamic bot responses based on score
    if (score >= 85) {
      addMessage("🌟 Excellent! +10 XP", "bot");
      xp += 10;
      streak++;
      animateStat(xpEl);
      animateStat(streakEl);
    } else if (score >= 60) {
      addMessage("✅ Good job! +5 XP, keep practicing!", "bot");
      xp += 5;
      streak++;
      animateStat(xpEl);
      animateStat(streakEl);
    } else {
      addMessage("❌ Not quite. Try again!", "bot");
      streak = Math.max(0, streak - 1);
      animateStat(streakEl);
    }

    localStorage.setItem('xp', xp);
    localStorage.setItem('streak', streak);
    updateStats();
  };

  recognition.onerror = (e) => {
    addMessage(`⚠️ Error: ${e.error}`, "bot");
  };
}

// ------------------- EVENT LISTENERS -------------------

speakBtn.addEventListener('click', startListening);
nextBtn.addEventListener('click', nextExercise);

// ------------------- START -------------------

addMessage("👋 Welcome to Deez Nutz Language Course! Choose a language & topic, then click 'Next' to start.", "bot");
