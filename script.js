const chat = document.getElementById('chat');
const speakBtn = document.getElementById('speakBtn');
const nextBtn = document.getElementById('nextBtn');
const chatBtn = document.getElementById('chatBtn');
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
    ],
    food: [
      { type: "speak", phrase: "Manzana", translation: "Apple" },
      { type: "translate", phrase: "Pan", translation: "Bread" }
    ],
    travel: [
      { type: "speak", phrase: "¿Dónde está la estación?", translation: "Where is the station?" },
      { type: "translate", phrase: "El aeropuerto", translation: "The airport" }
    ],
    shopping: [
      { type: "translate", phrase: "¿Cuánto cuesta?", translation: "How much is it?" },
      { type: "speak", phrase: "Quiero comprar esto", translation: "I want to buy this" }
    ],
    intermediate: [
      { type: "speak", phrase: "Estoy aprendiendo español.", translation: "I am learning Spanish." },
      { type: "translate", phrase: "¿Puedes ayudarme?", translation: "Can you help me?" }
    ]
  },
  "fr-FR": {
    greetings: [
      { type: "listen", phrase: "Bonjour", translation: "Hello" },
      { type: "speak", phrase: "Salut", translation: "Hi" },
      { type: "translate", phrase: "Merci", translation: "Thank you" }
    ],
    intro: [
      { type: "speak", phrase: "Je m'appelle...", translation: "My name is..." },
      { type: "translate", phrase: "Comment ça va?", translation: "How are you?" }
    ]
  }
};

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
  let feedback = "";
  let matches = 0;
  for (let i = 0; i < Math.min(e.length, a.length); i++) {
    if (e[i] === a[i]) matches++;
    else feedback += `Expected '${e[i]}' but said '${a[i]}'. `;
  }
  const score = Math.round((matches / e.length) * 100);
  return { score, feedback };
}

function speak(text, lang) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  speechSynthesis.speak(utter);
}

function getExercise() {
  const lang = languageSelect.value;
  const topic = topicSelect.value;
  const topicLessons = lessons[lang]?.[topic] || lessons["es-ES"]["greetings"];
  return topicLessons[Math.floor(Math.random() * topicLessons.length)];
}

function nextExercise() {
  chat.innerHTML = "";
  currentExercise = getExercise();
  if (!currentExercise) return addMessage("No lessons yet for this topic.", "bot");

  switch (currentExercise.type) {
    case "listen":
      addMessage(`Listen and repeat: "${currentExercise.phrase}"`, "bot");
      speak(currentExercise.phrase, languageSelect.value);
      break;
    case "translate":
      addMessage(`Translate this: "${currentExercise.phrase}"`, "bot");
      break;
    case "speak":
      addMessage(`Say: "${currentExercise.phrase}" (${currentExercise.translation})`, "bot");
      speak(currentExercise.phrase, languageSelect.value);
      break;
  }
}

function startListening() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = languageSelect.value;
  recognition.start();

  recognition.onresult = (event) => {
    const userSpeech = event.results[0][0].transcript;
    addMessage(userSpeech, 'user');

    if(currentExercise){
      const { score, feedback } = pronunciationScore(currentExercise.phrase, userSpeech);
      scoreEl.textContent = `Pronunciation Score: ${score}%`;

      if (score >= 60) {
        addMessage("✅ Great job! +10 XP", "bot");
        xp += 10;
        streak++;
      } else {
        addMessage(`❌ Try again. Feedback: ${feedback}`, "bot");
        streak = 0;
      }
      localStorage.setItem('xp', xp);
      localStorage.setItem('streak', streak);
      updateStats();
    } else {
      addMessage("💬 Practice conversation mode active!", "bot");
    }
  };
}

// Simulated AI conversation
chatBtn.addEventListener('click', () => {
  const prompt = prompt("Say something to AI:");
  if (!prompt) return;
  addMessage(prompt, "user");

  // Simple AI placeholder response
  addMessage(`🤖 AI says: I heard "${prompt}". Let's continue in ${languageSelect.options[languageSelect.selectedIndex].text}!`, "bot");
});

speakBtn.addEventListener('click', startListening);
nextBtn.addEventListener('click', nextExercise);

