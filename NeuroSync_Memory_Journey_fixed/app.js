const questions = [
"What was the best food your mother used to make that you loved?",
"What did your father usually say when he came home from work?",
"Which place would you still love to travel to even today?",
"What was your favorite game to play when you were young?",
"Who was your closest friend when you were growing up?",
"What song takes you back to a particularly happy time?",
"What was your favorite festival or celebration as a child?",
"Did your family have a special recipe that everyone looked forward to?",
"What was your first job, and what do you remember most about it?",
"Who made you laugh the most when you were young?",
"What was your favorite subject or teacher at school?",
"Where did you go for your happiest family holiday?",
"What did you enjoy doing on a rainy afternoon?",
"What was your favorite sweet or dessert growing up?",
"Was there a tree, garden, field, or place where you loved spending time?",
"What was the nicest gift you remember receiving?",
"What did your family usually do together on Sundays?",
"What was a funny thing you and your friends used to do?",
"Which movie or actor did you really enjoy when you were younger?",
"What kind of clothes or style did you love wearing?",
"What was a memorable birthday celebration?",
"Who taught you an important lesson that you still remember?",
"What was your favorite thing to do during summer vacations?",
"Did you ever have a beloved pet? Tell us about them.",
"What smell immediately reminds you of your childhood home?",
"What was a special meal you remember sharing with family?",
"What was the first place you visited outside your hometown?",
"What hobby made you happiest?",
"Which relative always made family gatherings more enjoyable?",
"What was your favorite radio program, TV show, or story?",
"What did you like doing with your siblings or cousins?",
"What is one school memory that still makes you smile?",
"Who was someone you admired when you were young?",
"What was a memorable wedding or family celebration?",
"What was your favorite outdoor place to visit?",
"Did you have a favorite shop, tea stall, bakery, or market?",
"What was something you were very proud to learn?",
"What was a family tradition you looked forward to?",
"What is a kind thing someone did for you that you still remember?",
"What was your favorite way to spend an evening?",
"If you could revisit one happy day from your past, which day would you choose?",
"What was a favorite story someone in your family used to tell?",
"What was the funniest family moment you remember?",
"What was a place from your younger days that felt special to you?",
"What did you enjoy doing with your children or younger relatives?",
"What was one achievement that made you feel especially proud?",
"What was a peaceful moment from your younger years that you still remember?"
];

let session = [], current = 0, recognition = null, listening = false, startTime = 0, timerId = null;
const $ = id => document.getElementById(id);

function pickQuestions() {
  return [...questions].sort(() => Math.random() - 0.5).slice(0,5);
}
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.82; u.pitch = 1;
  speechSynthesis.speak(u);
}
function formatTime(sec) {
  const m = Math.floor(sec/60), s = sec % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}
function startTimer() {
  startTime = Date.now();
  clearInterval(timerId);
  timerId = setInterval(() => $('timer').textContent = formatTime(Math.floor((Date.now()-startTime)/1000)), 250);
}
function stopListening() {
  if (recognition) try { recognition.stop(); } catch(e) {}
  listening = false; $('recordingState').classList.add('hidden'); $('recordBtn').textContent = '🎙 Start Answering';
}
function setupSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { $('speechHelp').textContent = 'Speech-to-text is not supported in this browser. You can still type an answer below.'; return; }
  recognition = new SR();
  recognition.lang = 'en-IN';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onresult = e => {
    let text = '';
    for (let i=e.resultIndex; i<e.results.length; i++) text += e.results[i][0].transcript;
    $('answerBox').textContent = text;
    $('answerBox').classList.add('has-answer');
  };
  recognition.onend = () => {
    listening = false;
    $('recordingState').classList.add('hidden');

    if ($('answerBox').classList.contains('has-answer')) {
      $('recordBtn').textContent = 'Next Question →';
      $('speechHelp').textContent = 'Answer captured. Click “Next Question” when you are ready.';
    } else {
      $('recordBtn').textContent = '🎙 Start Answering';
    }
  };
  recognition.onerror = e => {
    stopListening();
    $('speechHelp').textContent = 'We could not hear the answer. Please try again or skip the question.';
  };
}
function renderQuestion() {
  const q = session[current];
  $('progressText').textContent = `Question ${current+1} of 5`;
  $('progressBar').style.width = `${((current+1)/5)*100}%`;
  $('questionText').textContent = q.text;
  $('answerBox').textContent = 'Your spoken answer will appear here…';
  $('answerBox').classList.remove('has-answer');
  $('answerBox').contentEditable = 'false';
  $('recordBtn').textContent = '🎙 Start Answering';
  $('speechHelp').textContent = 'Allow microphone access when your browser asks.';
  $('timer').textContent = '0:00';
  startTimer();
  setTimeout(() => speak(q.text), 350);
}
function saveAndNext(skipped=false) {
  stopListening();
  const elapsed = Math.floor((Date.now()-startTime)/1000);
  const answer = $('answerBox').classList.contains('has-answer') ? $('answerBox').textContent.trim() : '';
  session[current].answer = skipped ? '' : answer;
  session[current].skipped = skipped || !answer;
  session[current].seconds = elapsed;
  session[current].attempts = session[current].attempts || 0;
  current++;
  if (current >= 5) finishSession(); else renderQuestion();
}
function finishSession() {
  clearInterval(timerId); speechSynthesis.cancel();
  const answered = session.filter(x=>!x.skipped).length;
  const skipped = 5-answered;
  const answeredTimes = session.filter(x=>!x.skipped).map(x=>x.seconds);
  const avg = answeredTimes.length ? answeredTimes.reduce((a,b)=>a+b,0)/answeredTimes.length : 0;
  const longPauses = session.filter(x=>x.seconds >= 35).length;
  const restarts = session.reduce((a,x)=>a+(x.attempts||0),0);
  let nervous = 'Low';
  if (longPauses >= 2 || restarts >= 3) nervous = 'Moderate';
  if (longPauses >= 4 || restarts >= 6) nervous = 'High';

  $('answeredStat').textContent = answered;
  $('skippedStat').textContent = skipped;
  $('avgStat').textContent = `${avg.toFixed(1)}s`;
  $('nervousStat').textContent = nervous;
  $('detailList').innerHTML = session.map((x,i)=>`
    <div class="detail"><strong>Question ${i+1}:</strong> ${x.skipped ? 'Skipped' : 'Answered in '+x.seconds+' seconds'}
    ${x.answer ? `<br><span>${escapeHtml(x.answer)}</span>` : ''}</div>`).join('');
  $('gameScreen').classList.add('hidden');
  $('reportScreen').classList.remove('hidden');
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

$('startBtn').onclick = () => {
  const name = $('nameInput').value.trim() || 'Patient';
  const age = $('ageInput').value.trim() || '—';
  $('patientName').textContent = name;
  $('patientAge').textContent = `Age ${age}`;
  $('welcomeScreen').classList.add('hidden');
  $('gameScreen').classList.remove('hidden');
  session = pickQuestions().map(text => ({text, answer:'', skipped:false, seconds:0, attempts:0}));
  current = 0; setupSpeech(); renderQuestion();
};
$('speakBtn').onclick = () => speak($('questionText').textContent);
$('recordBtn').onclick = () => {
  // If we already have an answer, this button advances to the next question.
  if ($('answerBox').classList.contains('has-answer') && !listening) {
    saveAndNext(false);
    return;
  }

  // Fallback for browsers without SpeechRecognition.
  if (!recognition) {
    $('answerBox').contentEditable = 'true';
    $('answerBox').focus();
    $('speechHelp').textContent = 'Speech recognition unavailable — type the answer, then click “Next Question”.';
    $('recordBtn').textContent = 'Next Question →';
    return;
  }

  // Stop recording and immediately make the answer actionable.
  if (listening) {
    stopListening();
    if ($('answerBox').classList.contains('has-answer')) {
      $('recordBtn').textContent = 'Next Question →';
    } else {
      $('recordBtn').textContent = '🎙 Start Answering';
    }
    return;
  }

  session[current].attempts = (session[current].attempts||0) + 1;
  listening = true;
  $('recordingState').classList.remove('hidden');
  $('recordBtn').textContent = '■ Stop & Continue';
  $('speechHelp').textContent = 'Speak your answer. Click “Stop & Continue” when you are finished.';
  try {
    recognition.start();
  } catch (e) {
    // Browser may throw if recognition is already active.
    listening = false;
    $('recordingState').classList.add('hidden');
  }
};
$('skipBtn').onclick = () => saveAndNext(true);
$('pdfBtn').onclick = () => {
  const patient = $('patientName').textContent;
  const age = $('patientAge').textContent.replace('Age ','');
  const answered = session.filter(x=>!x.skipped).length;
  const skipped = 5-answered;
  const times = session.filter(x=>!x.skipped).map(x=>x.seconds);
  const avg = times.length ? times.reduce((a,b)=>a+b,0)/times.length : 0;
  const longPauses = session.filter(x=>x.seconds >= 35).length;
  const restarts = session.reduce((a,x)=>a+(x.attempts||0),0);
  let nervous = longPauses >= 4 || restarts >= 6 ? 'High' : (longPauses >= 2 || restarts >= 3 ? 'Moderate' : 'Low');

  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>NeuroSync Report</title><style>
  body{font-family:Arial,sans-serif;color:#35271f;padding:45px;line-height:1.5}h1{color:#4f3626}
  .box{padding:18px;background:#f5eee7;margin:18px 0;border-radius:10px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .stat{padding:16px;background:#faf7f3;text-align:center}.stat b{display:block;font-size:24px}.q{border-bottom:1px solid #ddd;padding:12px 0}
  small{color:#6f6259}.disclaimer{font-size:12px;color:#6f6259;margin-top:25px}
  </style></head><body><h1>NeuroSync — Memory Journey Report</h1>
  <p><b>Patient:</b> ${escapeHtml(patient)} &nbsp; <b>Age:</b> ${escapeHtml(age)} &nbsp; <b>Date:</b> ${new Date().toLocaleString()}</p>
  <div class="grid"><div class="stat"><b>${answered}</b>Answered</div><div class="stat"><b>${skipped}</b>Skipped</div>
  <div class="stat"><b>${avg.toFixed(1)}s</b>Avg. Answer Time</div><div class="stat"><b>${nervous}</b>Nervousness*</div></div>
  <div class="box"><b>Session summary:</b> The patient completed ${answered} of 5 questions. ${skipped} question(s) were skipped. Average response time was ${avg.toFixed(1)} seconds.</div>
  <h2>Question Details</h2>${session.map((x,i)=>`<div class="q"><b>Q${i+1}. ${escapeHtml(x.text)}</b><br>${x.skipped?'Skipped':`Answered in ${x.seconds} seconds`} ${x.answer?`<br><small>Response: ${escapeHtml(x.answer)}</small>`:''}</div>`).join('')}
  <p class="disclaimer">*Nervousness is an interaction estimate derived from session behavior (long response pauses and repeated recording attempts). It is not a medical diagnosis and should not be used alone for clinical decisions.</p>
  <script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`);
  w.document.close();
};
$('restartBtn').onclick = () => location.reload();
