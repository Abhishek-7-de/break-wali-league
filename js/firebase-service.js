import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDVORHO39x44pCO4I_DtZ_kn2KCWgdADr0",
  authDomain: "break-wali-league.firebaseapp.com",
  projectId: "break-wali-league",
  storageBucket: "break-wali-league.firebasestorage.app",
  messagingSenderId: "168964292865",
  appId: "1:168964292865:web:927cf2ef87239fccae9b00",
  measurementId: "G-JZ6WGYBWSS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let confirmationResultRef = null;
let recaptchaRef = null;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function boostWindow(config) {
  const now = new Date(), mins = now.getHours()*60+now.getMinutes();
  const start = config.matchBoost.startHour*60+config.matchBoost.startMinute;
  const end = config.matchBoost.endHour*60+config.matchBoost.endMinute;
  return mins >= start && mins <= end;
}

function defaultUserPayload({uid,phone,name,nickname,profilePhoto}) {
  return { uid,phone,name,nickname:nickname||'',profilePhoto:profilePhoto||'',totalPoints:0,matchesPlayed:0,runs:0,wickets:0,sixes:0,dots:0,streak:0,playsToday:0,lastPlayDate:'',lastOverTime:0,history:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp() };
}

function getRecaptcha(containerId='recaptcha-container') {
  if (recaptchaRef) return recaptchaRef;
  recaptchaRef = new RecaptchaVerifier(auth, containerId, {
    size: 'normal',
    callback: () => {},
    'expired-callback': () => { recaptchaRef = null; }
  });
  return recaptchaRef;
}

async function sendOtp(phoneNumber, containerId='recaptcha-container') {
  if (recaptchaRef) { try { recaptchaRef.clear(); } catch(e){} recaptchaRef = null; }
  const recaptcha = getRecaptcha(containerId);
  confirmationResultRef = await signInWithPhoneNumber(auth, phoneNumber, recaptcha);
  return true;
}

async function verifyOtp(code) {
  if (!confirmationResultRef) throw new Error('OTP session missing');
  const result = await confirmationResultRef.confirm(code);
  return result.user;
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db,'users',uid));
  return snap.exists() ? snap.data() : null;
}

async function upsertUserProfile({uid,phone,name,nickname,profilePhoto,historicalData}) {
  const ref = doc(db,'users',uid);
  const existing = await getUserProfile(uid);
  if (!existing) {
    let payload = defaultUserPayload({uid,phone,name,nickname,profilePhoto});
    if (historicalData) {
      payload.totalPoints = historicalData.totalPoints || 0;
      payload.runs = historicalData.runs || 0;
      payload.wickets = historicalData.wickets || 0;
      payload.sixes = historicalData.sixes || 0;
      payload.matchesPlayed = historicalData.matchesPlayed || 0;
    }
    await setDoc(ref, payload);
  } else {
    await updateDoc(ref, { name, nickname:nickname||existing.nickname||'', profilePhoto:profilePhoto||existing.profilePhoto||'', updatedAt:serverTimestamp() });
  }
  if (auth.currentUser && name) {
    await updateProfile(auth.currentUser, { displayName:nickname||name }).catch(()=>null);
  }
  return await getUserProfile(uid);
}

async function saveGameResult({uid,mode,outcome,config}) {
  const ref = doc(db,'users',uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('User not found');
  const user = snap.data();
  const cfg = config || { matchBoost:{startHour:19,startMinute:0,endHour:23,endMinute:30,multiplier:2} };
  const multiplier = boostWindow(cfg) ? cfg.matchBoost.multiplier : 1;
  const finalPoints = outcome.points * multiplier;
  const today = todayKey();
  const isNewDay = user.lastPlayDate !== today;
  const nextHistory = Array.isArray(user.history) ? [...user.history] : [];
  nextHistory.push({ mode, label:outcome.label, finalPoints, boost:multiplier, ts:new Date().toISOString() });
  const updated = {
    totalPoints:(user.totalPoints||0)+finalPoints,
    matchesPlayed:(user.matchesPlayed||0)+1,
    playsToday:(user.playsToday||0)+1,
    lastPlayDate:today,
    streak:isNewDay?(user.streak||0)+1:(user.streak||1),
    runs:(user.runs||0)+(outcome.runs||0),
    wickets:(user.wickets||0)+(outcome.wickets||0),
    sixes:(user.sixes||0)+(outcome.sixes||0),
    dots:(user.dots||0)+(outcome.dots||0),
    history:nextHistory.slice(-30),
    updatedAt:serverTimestamp()
  };
  await updateDoc(ref, updated);
  return { ...user, ...updated, uid, finalPoints, multiplier };
}

async function fetchTopLeaderboard(count=25) {
  const q = query(collection(db,'users'), orderBy('totalPoints','desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d=>d.data());
}

window.CBCL_FIREBASE = { app, auth, db, sendOtp, verifyOtp, getUserProfile, upsertUserProfile, saveGameResult, fetchTopLeaderboard };
