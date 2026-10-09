import { prepareAvatarReference } from './core/avatarReference';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import ChatPanel from "./components/ChatPanel";
import VisionDrawer from './components/VisionDrawer';
import SavedImagesDrawer from './components/SavedImagesDrawer';
import { loadSavedImages, saveSavedImages, retainImage } from './core/savedImages';
import { inspectForChat } from './core/visionChat';
import { loadVisionSettings } from './core/vision';
import type { ImageAttachment } from './core/vision';
import MoreTools from './components/MoreTools';
import SkillsDrawer from './components/SkillsDrawer';
import {loadPractice,savePractice,skillsContext} from './core/skills';
import NarrativesDrawer from './components/NarrativesDrawer';
import {loadNarratives,saveNarratives,narrativePayload,narrativeContext,lessonReplyFocus,editableNarrativeRevision,canSaveNarrative,validateNarratives,NARRATIVE_LIMIT} from './core/narratives';
import type {Narrative,NarrativeKind} from './core/narratives';
import EventsDrawer from './components/EventsDrawer';
import {loadEvents,saveEvents,changedEventSources,appendEvents} from './core/events';
import type {EventSource} from './core/events';
import {loadEpisodes,saveEpisodes,episodeContext} from './core/episodes';
import ThoughtsDrawer from './components/ThoughtsDrawer';
import {loadThoughts,saveThoughts,thoughtSources,thoughtPayload} from './core/thoughts';
import type {Thought} from './core/thoughts';
import {loadPersonality,personalityContext,replyStyleReminder} from './core/personality';
import ChatArchivesDrawer from './components/ChatArchivesDrawer';
import {loadChatArchives,saveChatArchives,newChatArchive} from './core/chatArchives';
import SettingsDrawer from "./components/SettingsDrawer";
import StagePanel from "./components/StagePanel";
import Wardrobe from "./components/Wardrobe";
import MemoryDrawer from "./components/MemoryDrawer";
import StateDrawer from "./components/StateDrawer";
import DiaryDrawer from "./components/DiaryDrawer";
import GoalsDrawer from "./components/GoalsDrawer";
import FollowupsDrawer from './components/FollowupsDrawer';
import ActivitiesDrawer from './components/ActivitiesDrawer';
import {loadSharedActivities,saveSharedActivities,sharedActivityPayload,addActivityReply} from './core/sharedActivities';
import {loadFollowups,saveFollowups,suggestFollowups,dueFollowups,followupContext,followupStatusContext,promptedFollowup} from './core/followups';
import { loadWork, saveWork, workContext, workPayload, revisionMetadata, revisionPayload, cleanRevisionContent, revisionChanges } from "./core/work";
import type { WorkDraft, WorkKind } from "./core/work";
import { loadPlaytests,savePlaytests,playtestContext } from "./core/playtests";
import { loadInterests, saveInterests, acceptGoalInterests, interestsContext } from "./core/interests";
import { loadGoals, saveGoals, goalsContext, newGoal, goalProposalPayload, cleanGoalTitle } from "./core/goals";
import { loadDiary, reflectionPayload, saveDiary } from "./core/diary";
import { completeJournal, dailyJournalPayload, dueJournalDate, journalClock, journalMessages, loadJournalState, recordJournalSource, saveJournalState } from "./core/dailyJournal";
import type { JournalState } from "./core/dailyJournal";
import { useInternalState } from "./core/useInternalState";
import { internalStateContext, stateMood } from "./core/internalState";
import { clockContext } from "./core/clock";
import { loadInitiative, saveInitiative, initiativeDue, initiativePayload, initiativeReplyContext, repeatsInitiativeOpening, scheduleInitiative, resolveInitiative, initiativeExpired, timeoutMessage, continuityContext, repeatsRecentOpening } from "./core/initiative";
import type { InitiativeState } from "./core/initiative";
import { initiativePaused, requestedPauseMinutes, pauseInitiative, returnFromPause, invalidReturnReply } from "./core/initiative";
import { loadRelationship, saveRelationship, relationshipEvent, relationshipContext } from "./core/relationship";
import type { Relationship } from "./core/relationship";
import { useActivity } from "./core/useActivity";
import { activityContext } from "./core/activity";
import { identityContext, memoryContext, loadIdentity, loadMemories, saveIdentity, saveMemories, retrieveMemories, memoriesToReinforce, reinforceMemories } from "./core/character";
import { loadMemoryReviews, saveMemoryReviews, suggestMemories } from "./core/memorySuggestions";
import { loadAvatarConfig, saveAvatarConfig } from "./core/avatar";
import type { AvatarConfig, Vowel } from "./core/avatar";
import { cleanReply } from "./core/emotion";
import { buildPayload, streamChat, echoedChatReply } from "./core/llm";
import { conversationGuidance, conversationIssue, unsupportedCapability, simpleComparisonPayload } from "./core/conversation";
import { bumpMessage, grantMilestone } from "./core/progress";
import { fillTemplate, loadChat, loadSettings, saveChat, saveSettings, validateSettings } from "./core/settings";
import type { Settings } from "./core/settings";
import { uid } from "./core/types";
import type { Msg } from "./core/types";
import { useAvatarAssets } from "./core/useAvatar";
import { inTauri, useLlama } from "./core/useLlama";
import { flushPersistence, persistenceStatus, subscribePersistence } from "./core/persistence";
import { useProgress } from "./core/useProgress";
import { buildWardrobe, itemLabel, resolveLoadout } from "./core/wardrobe";

const STATUS_LABEL = {
  stopped: "Model off",
  starting: "Loading",
  ready: "Ready",
  error: "Problem",
} as const;

export default function App() {
  const [showVision,setShowVision]=useState(false);
  const [savedImages,setSavedImages]=useState(loadSavedImages);
  const savedImagesRef=useRef(savedImages);savedImagesRef.current=savedImages;
  const [showSavedImages,setShowSavedImages]=useState(false);
  const [imageStatus,setImageStatus]=useState('');
  const [imageError,setImageError]=useState('');
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [practice,setPractice]=useState(loadPractice);
  const [showSkills,setShowSkills]=useState(false);
  const [narratives,setNarratives]=useState(loadNarratives);
  const [showNarratives,setShowNarratives]=useState(false);
  const [narrativeDraft,setNarrativeDraft]=useState<Narrative|null>(null);
  const [narrativeGenerating,setNarrativeGenerating]=useState(false);
  const [narrativeError,setNarrativeError]=useState('');
  const [thoughts,setThoughts]=useState(loadThoughts);
  const [events,setEvents]=useState(loadEvents);
  const [episodes,setEpisodes]=useState(loadEpisodes);
  const [showEvents,setShowEvents]=useState(false);
  const [showThoughts,setShowThoughts]=useState(false);
  const [thoughtDraft,setThoughtDraft]=useState<Thought|null>(null);
  const [thoughtGenerating,setThoughtGenerating]=useState(false);
  const [thoughtError,setThoughtError]=useState('');
  const [messages, setMessages] = useState<Msg[]>(loadChat);
  const [chatArchives,setChatArchives]=useState(loadChatArchives);
  const [showChatArchives,setShowChatArchives]=useState(false);
  const [archiving,setArchiving]=useState(false);
  const [busy, setBusy] = useState(false);
  const [initiative, setInitiative] = useState(loadInitiative);
  const [relationship, setRelationship] = useState(loadRelationship);
  const relationshipRef = useRef(relationship);
  relationshipRef.current = relationship;
  const initiativeRef = useRef(initiative);
  initiativeRef.current = initiative;
  const lastActivityAt = useRef(Date.now());
  const hasChatDraft = useRef(false);
  const [chatHasDraft, setChatHasDraft] = useState(false);
  const [initiativeStatus, setInitiativeStatus] = useState("");
  const [initiativeGenerating, setInitiativeGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [showState, setShowState] = useState(false);
  const [showGoals,setShowGoals] = useState(false);
  const [showFollowups,setShowFollowups]=useState(false);
  const [showActivities,setShowActivities]=useState(false);
  const [sharedActivities,setSharedActivities]=useState(loadSharedActivities);
  const sharedActivitiesRef=useRef(sharedActivities);
  sharedActivitiesRef.current=sharedActivities;
  const [activityGeneratingId,setActivityGeneratingId]=useState<string|null>(null);
  const [activityPreview,setActivityPreview]=useState('');
  const [activityError,setActivityError]=useState('');
  const [followups,setFollowups]=useState(loadFollowups);
  const followupsRef=useRef(followups);
  followupsRef.current=followups;
  const [goals,setGoals] = useState(loadGoals);
  const [interests,setInterests] = useState(loadInterests);
  const [goalDraft,setGoalDraft] = useState("");
  const [goalGenerating,setGoalGenerating] = useState(false);
  const [goalError,setGoalError] = useState("");
  const [work,setWork] = useState(loadWork);
  const [playtests,setPlaytests] = useState(loadPlaytests);
  const [workDraft,setWorkDraft] = useState<WorkDraft|null>(null);
  const [workGenerating,setWorkGenerating] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [diary, setDiary] = useState(loadDiary);
  const diaryRef = useRef(diary);
  diaryRef.current = diary;
  const [journal, setJournal] = useState(loadJournalState);
  const followupSuggestions=useMemo(()=>suggestFollowups(messages,followups,journal.timeZone),[messages,followups,journal.timeZone]);
  const journalRef = useRef(journal);
  journalRef.current = journal;
  const [journalWriting, setJournalWriting] = useState<string | null>(null);
  const [journalStatus, setJournalStatus] = useState("");
  const journalRetryAfter = useRef(0);
  const journalOpenedAt = useRef(Date.now());
  const [reflectionDraft, setReflectionDraft] = useState("");
  const [reflecting, setReflecting] = useState(false);
  const [reflectionError, setReflectionError] = useState("");
  const reflectionSources = useRef({ sourceMessageIds: [] as string[], sourceMemoryIds: [] as string[], mood: "neutral" });
  const [identity, setIdentity] = useState(loadIdentity);
  const [memories, setMemories] = useState(loadMemories);
  const [memoryReviews, setMemoryReviews] = useState(loadMemoryReviews);
  const suggestions = useMemo(() => suggestMemories(messages, memories, memoryReviews, settings.charName), [messages, memories, memoryReviews, settings.charName]);
  const [savedCfg, setSavedCfg] = useState<AvatarConfig>(loadAvatarConfig);
  const [voiceMouth,setVoiceMouth]=useState<Vowel|null|undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const storage = useSyncExternalStore(subscribePersistence, persistenceStatus);

  const llama = useLlama(settings);
  const avatar = useAvatarAssets(settings.avatarDir);
  const progress = useProgress(avatar.assets);
  const companion = useInternalState();
  const activity = useActivity({ state: companion.state, timeZone: journal.timeZone, chatting: busy,
    initiating: initiativeGenerating, reflecting, journaling: !!journalWriting, waiting: !!initiative.pending,working:workGenerating||!!activityGeneratingId });
  useEffect(() => {
    companion.setRecovery(activity.kind === "sleeping" || activity.kind === "resting" ? activity.kind : "idle");
  }, [activity.kind, companion.setRecovery]);

  useEffect(() => { saveIdentity(identity); }, [identity]);
  useEffect(() => { saveMemories(memories); }, [memories]);
  useEffect(() => { saveDiary(diary); }, [diary]);
  useEffect(() => { saveGoals(goals); }, [goals]);
  useEffect(() => { saveInterests(interests); }, [interests]);
  useEffect(() => { saveWork(work); }, [work]);
  useEffect(() => { savePlaytests(playtests); }, [playtests]);
  useEffect(()=>{saveFollowups(followups);},[followups]);
  useEffect(()=>{saveSharedActivities(sharedActivities);},[sharedActivities]);
  const eventSources=useMemo<EventSource[]>(()=>[
    ...goals.map(g=>({id:g.id,kind:'goal' as const,title:g.title,outcome:`User-recorded goal status: ${g.status}`})),
    ...work.map(w=>({id:w.id,kind:'work' as const,title:w.title,outcome:`Reviewed ${w.kind} draft saved, version ${w.version??1}. Not executed or tested.`})),
    ...playtests.map(p=>({id:p.id,kind:'playtest' as const,title:p.artifactTitle,outcome:`Deterministic battle preview: ${p.outcome}, ${p.turns} turns, version ${p.version}. Not a full game test.`})),
    ...sharedActivities.sessions.map(s=>({id:s.id,kind:'activity' as const,title:s.prompt,outcome:`User-recorded ${s.kind} session status: ${s.status}`})),
    ...diary.filter(d=>!d.deletedAt).map(d=>({id:d.id,kind:'diary' as const,title:d.journalDate?`Diary: ${d.journalDate}`:'Diary reflection',outcome:'Diary entry saved. Generated reflection, not independent activity evidence.'})),
    ...thoughts.entries.map(t=>({id:t.id,kind:'thought' as const,title:'Simulated thought',outcome:'Reviewed character reflection saved. Not hidden reasoning or a verified fact.'})),
    ...chatArchives.map(a=>({id:a.id,kind:'archive' as const,title:a.title,outcome:'Conversation archived.'})),
  ],[goals,work,playtests,sharedActivities,diary,thoughts,chatArchives]);
  const previousEventSources=useRef(eventSources);
  useEffect(()=>{
    const changes=changedEventSources(previousEventSources.current,eventSources);
    previousEventSources.current=eventSources;
    if(changes.length){const next=appendEvents(loadEvents(),changes);saveEvents(next);setEvents(next);}
  },[eventSources]);
  useEffect(() => {
    if (initiativeRef.current.enabled && !initiativeRef.current.nextAttemptAt) changeInitiative(scheduleInitiative(initiativeRef.current));
  }, []);

  function changeJournal(next: JournalState) {
    journalRef.current = next;
    setJournal(next);
    saveJournalState(next);
  }

  function changeInitiative(next: InitiativeState) {
    if (next.enabled && (!initiativeRef.current.enabled || next.cooldownMinutes !== initiativeRef.current.cooldownMinutes || !next.nextAttemptAt)) next = scheduleInitiative(next);
    initiativeRef.current = next;
    setInitiative(next);
    saveInitiative(next);
  }

  function updateRelationship(id: string, kind: NonNullable<Relationship["lastChange"]>) {
    const next = relationshipEvent(relationshipRef.current, id, kind);
    relationshipRef.current = next;
    setRelationship(next);
    saveRelationship(next);
  }

  async function proposeGoal() {
    if (abortRef.current || busy || reflecting || llama.status !== "ready" || storage.error) return;
    if (goalDraft.trim() && !window.confirm("Replace the unsaved goal draft?")) return;
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setGoalGenerating(true); setReflecting(true); setGoalError("");
    let content = "";
    try {
      const proposal=goalProposalPayload(identity,goals,settings.charName);
      proposal[1].content += interestsContext(interests,identity.interests);
      await streamChat({port:llama.port,temperature:0.5,signal:ctrl.signal,messages:proposal,onToken:(token)=>{content+=token;}});
      const text = cleanReply(content,settings.charName).text;
      if (ctrl.signal.aborted || !text) throw new Error("No complete proposal generated");
      setGoalDraft(text.slice(0,2150));
    } catch(e) { setGoalError(ctrl.signal.aborted ? "Proposal stopped. No goal saved." : `Proposal failed: ${String(e)}`); }
    finally {abortRef.current=null;setGoalGenerating(false);setReflecting(false);}
  }

  async function workOnGoal(id:string,kind:WorkKind,instruction:string,sourceId?:string) {
    if(abortRef.current||busy||reflecting||llama.status!=="ready"||storage.error)return;
    const goal=goals.find((g)=>g.id===id&&g.status==="active");
    if(!goal)return;
    const source=sourceId?work.find((a)=>a.id===sourceId&&a.goalId===goal.id):undefined;
    if(sourceId&&!source)return;
    if(workDraft&&!window.confirm("Replace the unsaved work draft?"))return;
    const ctrl=new AbortController();abortRef.current=ctrl;setWorkGenerating(true);setReflecting(true);setGoalError("");
    let content="";
    try{
      const payload=source?revisionPayload(goal,source,instruction,settings.charName):workPayload(goal,kind,instruction,work,settings.charName);
      if(source)payload[1].content+=playtestContext(playtests,source.id);
      await streamChat({port:llama.port,temperature:0.4,signal:ctrl.signal,messages:payload,onToken:(token)=>{content+=token;}});
      const extract=(value:string)=>{const raw=value.replace(/^(?:\s*<think>[\s\S]*?<\/think>\s*)+/,"").trim();return source?cleanRevisionContent(raw,source):raw;};
      let text=extract(content);
      if(source&&!ctrl.signal.aborted&&!revisionChanges(source.content,text).length){
        content="";
        payload[1].content+="\nCorrection: the first attempt returned unchanged content. Make a concrete change that addresses the requested revision. For balancing, use the measured health, damage, counters and turn data to change relevant numeric stats; preserve unrelated fields. Return the full changed document. Do not simply reformat or reorder JSON keys.";
        await streamChat({port:llama.port,temperature:0.4,signal:ctrl.signal,messages:payload,onToken:(token)=>{content+=token;}});
        text=extract(content);
        if(!revisionChanges(source.content,text).length)throw new Error("The model returned unchanged content after one retry. No new revision created. Try a specific numeric target or change.");
      }
      if(ctrl.signal.aborted||!text)throw new Error("No complete work draft generated");
      setWorkDraft({goalId:goal.id,goalTitle:goal.title,kind:source?.kind??kind,title:source?.title??`${goal.title} — ${kind}`.slice(0,200),content:text.slice(0,16000),generatedAt:new Date().toISOString(),...(source?revisionMetadata(source,work):{version:1})});
    }catch(e){setGoalError(ctrl.signal.aborted?"Work session stopped. No artifact saved.":`Work session failed: ${String(e)}`);}
    finally{abortRef.current=null;setWorkGenerating(false);setReflecting(false);}
  }

  async function startConversation(manual = false) {
    const current = initiativeRef.current;
    if (!current.enabled || current.pending || initiativePaused(current) || busy || reflecting || abortRef.current || reflectionDraft || hasChatDraft.current || storage.error || llama.status !== "ready") return;
    const now = new Date();
    if (!manual && !initiativeDue(current, now, journalRef.current.timeZone, journalOpenedAt.current, lastActivityAt.current, companion.state.energy)) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setInitiativeGenerating(true);
    setInitiativeStatus(`${settings.charName} is thinking of something to say...`);
    changeInitiative(scheduleInitiative({ ...current, lastAttemptAt: now.toISOString() }, now));
    let content = "";
    try {
      // Persist the attempt first so a restart cannot bypass the cooldown.
      await flushPersistence();
      if (ctrl.signal.aborted) throw new Error("Conversation stopped");
      const dueNote=dueFollowups(followupsRef.current,now)[0]??null;
      const context = identityContext(identity, settings.charName, settings.userName)
        + workContext(work)
        + interestsContext(interests,identity.interests)
        + goalsContext(goals)
        + continuityContext(goals,messagesRef.current,settings.charName)
        + followupContext(dueNote)
        + followupStatusContext(followupsRef.current)
        + activityContext("initiating")
        + relationshipContext(relationshipRef.current)
        + internalStateContext(companion.state)
        + clockContext(now, journalRef.current.timeZone, messagesRef.current, companion.state.lastConversationAt)
        + memoryContext(memories, "", "", settings.charName, settings.userName);
      await streamChat({ port: llama.port, temperature: settings.temperature, signal: ctrl.signal,
        messages: initiativePayload(fillTemplate(settings.systemPrompt, settings), context),
        onToken: (token) => { content += token; } });
      let clean = cleanReply(content, settings.charName);
      if (!ctrl.signal.aborted && (unsupportedCapability(clean.text, "") || repeatsRecentOpening(clean.text,messagesRef.current,settings.charName))) {
        content = "";
        await streamChat({ port: llama.port, temperature: settings.temperature, signal: ctrl.signal,
          messages: initiativePayload(fillTemplate(settings.systemPrompt, settings), context + "\nCorrection: choose a fresh specific follow-up or topic. Do not repeat previous wording, questions or invitations. Offer a chat topic only. Do not claim visual input or promise physical actions or music playback."),
          onToken: (token) => { content += token; } });
        clean = cleanReply(content, settings.charName);
        if (unsupportedCapability(clean.text, "")) throw new Error("The model still claimed an unavailable capability. No opening was added.");
        if (repeatsRecentOpening(clean.text,messagesRef.current,settings.charName)) throw new Error("The model repeated a recent follow-up after one retry. No opening was added.");
      }
      if (ctrl.signal.aborted || !clean.text) throw new Error("No complete conversation opener was generated");
      const message: Msg = { id: uid(), role: "assistant", content, createdAt: new Date().toISOString() };
      const nextMessages = [...messagesRef.current, message];
      messagesRef.current = nextMessages;
      setMessages(nextMessages);
      saveChat(nextMessages);
      if(dueNote)setFollowups(prev=>promptedFollowup(prev,dueNote.id));
      changeJournal(recordJournalSource(journalRef.current,message,settings.charName));
      changeInitiative({ ...initiativeRef.current, pending: { messageId: message.id, content: clean.text, createdAt: message.createdAt!, expiresAt: new Date(Date.now() + (initiativeRef.current.replyMinutes ?? 5) * 60_000).toISOString() } });
      companion.reply(clean.emotion);
      setInitiativeStatus("");
    } catch (e) {
      setInitiativeStatus(ctrl.signal.aborted ? "Conversation opener stopped. No message added." : `Could not start a conversation: ${String(e)}`);
    } finally { abortRef.current = null; setBusy(false); setInitiativeGenerating(false); }
  }

  useEffect(() => {
    const check = () => {
      if (initiativeExpired(initiativeRef.current) && !busy && !reflecting && !abortRef.current && !hasChatDraft.current && !storage.error && document.visibilityState === "visible") {
        const openingId = initiativeRef.current.pending!.messageId;
        const closing: Msg = { id: uid(), role: "assistant", content: timeoutMessage(settings.userName), createdAt: new Date().toISOString() };
        const nextMessages = [...messagesRef.current, closing];
        messagesRef.current = nextMessages;
        setMessages(nextMessages);
        saveChat(nextMessages);
        changeInitiative(resolveInitiative(initiativeRef.current));
        updateRelationship(`initiative:${openingId}`, "timeout");
        setInitiativeStatus("");
        return;
      }
      if (document.visibilityState !== "visible" || showSavedImages || showVision || showSkills || showNarratives || narrativeDraft || showEvents || showSettings || showMemories || showState || showDiary || showWardrobe || showGoals || showFollowups || showActivities || showChatArchives || showThoughts || thoughtDraft || archiving) return;
      // A due daily journal has priority over initiating a chat.
      if (dueJournalDate(journalRef.current, diaryRef.current)) return;
      void startConversation();
    };
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [initiative, busy, reflecting, reflectionDraft, llama.status, storage.error, companion.state, identity, memories, settings, goals, interests, work, followups, showActivities, showFollowups, showSettings, showMemories, showState, showDiary, showWardrobe, showGoals,showChatArchives,showThoughts,showEvents,showSkills,showNarratives,narrativeDraft,thoughtDraft,archiving,showVision,showSavedImages]);

  async function generateActivityReply(id:string){
    if(abortRef.current||busy||reflecting||storage.error||llama.status!=='ready')return;
    const session=sharedActivitiesRef.current.sessions.find(s=>s.id===id);
    if(!session||session.kind==='words'||session.status!=='active'||session.turns[session.turns.length-1]?.role!=='user')return;
    const ctrl=new AbortController();abortRef.current=ctrl;setReflecting(true);setActivityGeneratingId(id);setActivityPreview('');setActivityError('');lastActivityAt.current=Date.now();
    let content='';
    try{
      await flushPersistence();
      if(ctrl.signal.aborted)throw new Error('Activity stopped');
      await streamChat({port:llama.port,temperature:settings.temperature,signal:ctrl.signal,messages:sharedActivityPayload(session,settings.charName,settings.userName,identity.personality,personalityContext(loadPersonality())),onToken:token=>{content+=token;setActivityPreview(cleanReply(content,settings.charName).text);}});
      const text=cleanReply(content,settings.charName).text;
      if(ctrl.signal.aborted||!text)throw new Error('No completed activity reply');
      const current=sharedActivitiesRef.current.sessions.find(s=>s.id===id);
      if(!current||current.turns[current.turns.length-1]?.id!==session.turns[session.turns.length-1]?.id)throw new Error('The activity changed; no reply was saved.');
      const next=addActivityReply(current,text);
      if(!next)throw new Error('This session cannot accept another reply.');
      const updated={...sharedActivitiesRef.current,sessions:sharedActivitiesRef.current.sessions.map(s=>s.id===id?next:s)};
      sharedActivitiesRef.current=updated;setSharedActivities(updated);saveSharedActivities(updated);setActivityPreview('');
    }catch(e){setActivityError(ctrl.signal.aborted?'Activity reply stopped. Your saved turn remains; retry when ready.':`Activity reply failed: ${String(e)}. Your saved turn remains.`);setActivityPreview('');}
    finally{abortRef.current=null;setReflecting(false);setActivityGeneratingId(null);}
  }

  async function writeJournal(date: string, rewrite=false) {
    if (abortRef.current || busy || reflecting || storage.error || llama.status !== "ready" || reflectionDraft) return;
    if (!rewrite && (journalRef.current.completedDates.includes(date) || diaryRef.current.some((e) => e.journalDate === date))) return;
    let sourceState=journalRef.current;
    if(rewrite){
      sourceState={...sourceState,completedDates:sourceState.completedDates.filter((d)=>d!==date)};
      for(const entry of diaryRef.current.filter(e=>e.journalDate===date))for(const message of entry.sourceMessages??[])sourceState=recordJournalSource(sourceState,message,settings.charName);
      for(const message of messagesRef.current) sourceState=recordJournalSource(sourceState,message,settings.charName);
    }
    const sourceMessages = journalMessages(sourceState,date);
    const sourceMemories = [...memories].sort((a,b) => Number(b.pinned)-Number(a.pinned) || b.importance-a.importance).slice(0,4).map((m) => ({ ...m,content:m.content.slice(0,1000) }));
    const writingState = companion.state;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setReflecting(true); setJournalWriting(date); setJournalStatus(`Writing journal for ${date}...`);
    let content = "";
    try {
      await streamChat({ port:llama.port,temperature:0.4,signal:ctrl.signal,
        messages:dailyJournalPayload(reflectionPayload(identity,writingState,sourceMessages,sourceMemories,settings.charName,settings.userName,journalRef.current.timeZone,new Date(),[],[],true),date,!sourceMessages.some((m)=>m.role==="user"),goals,journalRef.current.timeZone),
        onToken:(token) => { content += token; } });
      const text = cleanReply(content,settings.charName).text;
      if (ctrl.signal.aborted || !text) throw new Error("No complete journal entry was generated");
      const entry = { id:uid(),content:text,createdAt:new Date().toISOString(),journalDate:date,mood:writingState.mood,
        sourceMessages,
        sourceMessageIds:sourceMessages.map((m) => m.id),sourceMemoryIds:sourceMemories.map((m) => m.id) };
      const next = [...diaryRef.current.map((e)=>rewrite&&e.journalDate===date&&!e.deletedAt?{...e,deletedAt:new Date().toISOString()}:e),entry];
      diaryRef.current = next; setDiary(next); saveDiary(next);
      changeJournal(completeJournal(journalRef.current,date));
      progress.update(grantMilestone("first_diary"));
      setJournalStatus(`Daily journal for ${date} saved.`);
    } catch (e) {
      journalRetryAfter.current = Date.now()+300_000;
      setJournalStatus(ctrl.signal.aborted ? "Daily journal stopped. No entry saved; automatic retry waits five minutes." : `Daily journal failed: ${String(e)}. Automatic retry waits five minutes.`);
    } finally { abortRef.current = null; setReflecting(false); setJournalWriting(null); }
  }

  useEffect(() => {
    const check = () => {
      if (showSavedImages || showVision || busy || reflecting || reflectionDraft || hasChatDraft.current || abortRef.current || llama.status !== "ready" || storage.error || Date.now() < journalRetryAfter.current) return;
      if (Date.now()-journalOpenedAt.current < 120_000) return;
      const date = dueJournalDate(journalRef.current,diaryRef.current);
      if (!date) return;
      const daySources = journalRef.current.sources.filter((s) => s.date === date);
      const lastSource = daySources[daySources.length-1];
      if (lastSource && Date.now()-Date.parse(lastSource.createdAt) < 120_000) return;
      void writeJournal(date);
    };
    check();
    const timer = window.setInterval(check,30_000);
    return () => window.clearInterval(timer);
  }, [busy,reflecting,reflectionDraft,llama.status,journal,diary,identity,memories,goals,work,companion.state,settings,storage.error,showVision,showSavedImages]);

  async function draftThought() {
    if(!thoughts.enabled||thoughts.entries.length>=100||thoughtDraft||busy||reflecting||abortRef.current||storage.error||llama.status!=='ready')return;
    const sources=thoughtSources(messagesRef.current,settings.charName),snapshot=companion.state;
    const ctrl=new AbortController();abortRef.current=ctrl;setReflecting(true);setThoughtGenerating(true);setThoughtError('');
    let content='';
    try{
      await streamChat({port:llama.port,temperature:0.4,signal:ctrl.signal,messages:thoughtPayload(identity,snapshot,sources,settings.charName,settings.userName),onToken:token=>{content+=token;}});
      const text=cleanReply(content,settings.charName).text;
      if(ctrl.signal.aborted||!text||text.length>2000)throw new Error('No complete short thought was generated.');
      setThoughtDraft({id:uid(),text,createdAt:new Date().toISOString(),mood:snapshot.mood,sources});
    }catch(e){setThoughtError(ctrl.signal.aborted?'Stopped. No thought saved.':String(e));}
    finally{abortRef.current=null;setReflecting(false);setThoughtGenerating(false);}
  }

  async function draftNarrative(kind:NarrativeKind,ids:string[],previous?:Narrative){
    if(busy||reflecting||abortRef.current||storage.error||llama.status!=='ready'||narrativeDraft||narratives.length>=NARRATIVE_LIMIT||previous&&previous.version>=100)return;
    const sources=previous?.sources??episodes.filter(e=>ids.includes(e.id)).slice(0,4);if(!sources.length)return;
    const ctrl=new AbortController();abortRef.current=ctrl;setReflecting(true);setNarrativeGenerating(true);setNarrativeError('');let content='';
    try{
      await streamChat({port:llama.port,temperature:0.4,signal:ctrl.signal,messages:narrativePayload(kind,sources,settings.charName,previous),onToken:token=>{content+=token;}});
      const text=cleanReply(content,settings.charName).text;
      if(ctrl.signal.aborted||!text||text.length>2000)throw new Error('No complete short interpretation was generated.');
      setNarrativeDraft({id:uid(),kind,content:text,createdAt:new Date().toISOString(),sources,version:previous?previous.version+1:1,...(previous?{parentId:previous.id}:{})});
    }catch(e){setNarrativeError(ctrl.signal.aborted?'Stopped. No interpretation saved.':String(e));}
    finally{abortRef.current=null;setReflecting(false);setNarrativeGenerating(false);}
  }

  async function reflect() {
 
    if (busy || reflecting || abortRef.current || llama.status !== "ready") return;
    if (reflectionDraft && !window.confirm("Replace the unsaved reflection draft?")) return;
    const sourceMessages = messages.filter((m) => m.role === "user" && m.content.trim()).slice(-8).map((m) => ({ ...m, content: m.content.slice(0,1000) }));
    const sourceMemories = [...memories].sort((a,b) => Number(b.pinned)-Number(a.pinned) || b.importance-a.importance).slice(0,4).map((m) => ({ ...m, content: m.content.slice(0,1000) }));
    reflectionSources.current = { sourceMessageIds: sourceMessages.map((m) => m.id), sourceMemoryIds: sourceMemories.map((m) => m.id), mood: companion.state.mood };
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setReflecting(true); setReflectionDraft(""); setReflectionError("");
    let content = "";
    try {
      await streamChat({ port: llama.port, temperature: 0.4, signal: ctrl.signal,
        messages: reflectionPayload(identity, companion.state, sourceMessages, sourceMemories, settings.charName, settings.userName,journalRef.current.timeZone,new Date(),goals,work),
        onToken: (token) => { content += token; setReflectionDraft(cleanReply(content, settings.charName).text); } });
      if (!cleanReply(content, settings.charName).text) setReflectionError("No reflection was generated. Try again.");
    } catch (e) {
      setReflectionDraft("");
      setReflectionError(ctrl.signal.aborted ? "Reflection stopped. No entry was saved." : `Reflection failed: ${String(e)}`);
    } finally { abortRef.current = null; setReflecting(false); }
  }

  // What she may wear right now (depends on what you two have unlocked), and what she IS wearing.
  const wardrobe = useMemo(
    () => (avatar.assets ? buildWardrobe(avatar.assets, progress.stats, new Date(), settings.charName) : null),
    [avatar.assets, progress.stats, settings.charName],
  );
  const cfg = useMemo(() => (wardrobe ? resolveLoadout(savedCfg, wardrobe) : savedCfg), [wardrobe, savedCfg]);

  function changeCfg(next: AvatarConfig) {
    setSavedCfg(next);
    saveAvatarConfig(next);
  }

  useEffect(() => {
    if (!busy) saveChat(messages);
  }, [messages, busy]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => saveChat(messagesRef.current), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    if (!inTauri) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void import("@tauri-apps/api/window").then(async ({ getCurrentWindow }) => {
      const appWindow = getCurrentWindow();
      const cleanup = await appWindow.onCloseRequested(async (event) => {
        event.preventDefault();
        abortRef.current?.abort();
        saveChat(messagesRef.current);
        try { await flushPersistence(); await appWindow.destroy(); }
        catch { /* Keep the window open; the persistence banner offers Retry. */ }
      });
      if (disposed) cleanup(); else unlisten = cleanup;
    });
    return () => { disposed = true; unlisten?.(); };
  }, []);

  const lastBot = [...messages].reverse().find((m) => m.role === "assistant");
  const lastClean = lastBot ? cleanReply(lastBot.content, settings.charName) : null;
  const emotion = busy ? lastClean?.emotion ?? "thinking" : stateMood(companion.state);
  const speech = lastBot && lastClean ? { id: lastBot.id, text: lastClean.text } : null;

  async function sendAttachment(text:string,image?:ImageAttachment,compareAvatar=false):Promise<boolean>{
    if(abortRef.current||reflecting||storage.error||llama.status!=='ready')return false;
    setImageError('');
    if(!image){void send(text);return true;}
    const controller=new AbortController();abortRef.current=controller;setBusy(true);setImageStatus('Checking vision model…');
    const timeout=setTimeout(()=>controller.abort(),240000);
    let report:Msg['imageReport'];
    try{
      const retained=retainImage(savedImagesRef.current,image);
      const reference=compareAvatar&&avatar.assets?await prepareAvatarReference(avatar.assets,cfg,controller.signal):undefined;
      report=await inspectForChat(loadVisionSettings(),settings.exePath,llama.port,image,text,controller.signal,setImageStatus,reference);
      if(controller.signal.aborted)return false;
      saveSavedImages(retained.images);savedImagesRef.current=retained.images;setSavedImages(retained.images);
      await flushPersistence();
      report.imageId=retained.imageId;
    }
    catch(e){setImageError(controller.signal.aborted?'Image request stopped or timed out. Your attachment is still in the composer.':String(e));return false;}
    finally{clearTimeout(timeout);abortRef.current=null;setBusy(false);setImageStatus('');}
    if(controller.signal.aborted)return false;
    void send(text,report);return true;
  }

  async function send(text: string,imageReport?:Msg['imageReport']) {
    if (abortRef.current || reflecting) return;
    const now = new Date().toISOString();
    lastActivityAt.current = Date.now();
    setInitiativeStatus("");
    const pauseMinutes=requestedPauseMinutes(text);
    const pendingOpening = pauseMinutes?null:initiativeRef.current.pending;
    let waitingContext = initiativeReplyContext(initiativeRef.current, text);
    let returningFromPause=false;
    if(pauseMinutes){
      const paused=pauseInitiative(initiativeRef.current,pauseMinutes,new Date(),text);
      changeInitiative(paused);
      setInitiativeStatus(`Conversation starters paused for ${pauseMinutes} minutes.`);
      waitingContext+=`\nThe application paused conversation starters for ${pauseMinutes} minutes at the user's request and cleared the reply countdown without a timeout penalty. Acknowledge briefly, do not ask a follow-up or pressure them to stay. Ordinary chat remains available.`;
    } else {
      const returned=returnFromPause(initiativeRef.current,text);
      if(returned.context){returningFromPause=true;changeInitiative(returned.state);waitingContext+=returned.context;}
      else if (pendingOpening) changeInitiative(resolveInitiative(initiativeRef.current));
    }
    const userMsg: Msg = { id: uid(), role: "user", content: text, createdAt:now };
    if(imageReport)userMsg.imageReport=imageReport;
    const proposedFollowup=suggestFollowups([userMsg],followupsRef.current,journalRef.current.timeZone)[0];
    if(proposedFollowup)waitingContext+=`\nThe application recognized a proposed follow-up, not an accepted reminder: ${JSON.stringify(proposedFollowup)}. Briefly tell the user they can review/save it in Follow-ups. Do not claim it is scheduled, set an alarm, or promise a notification at an exact time. Due notes only inform normal opt-in conversation starters while the app is open.`;
    const botMsg: Msg = { id: uid(), role: "assistant", content: "", createdAt:now };
    changeJournal(recordJournalSource(journalRef.current,userMsg));
    const history = [...messages, userMsg];
    const stateForReply = companion.talk();
    saveChat(history);

    // Count this message toward your time together; this may unlock something.
    const unlocked = progress.update(bumpMessage);
    const assets = avatar.assets;
    const extra =
      assets && unlocked.length
        ? `\n\n[Just now you and ${settings.userName} reached something special together, and you unlocked new things for your look: ${unlocked.map((id) => itemLabel(assets, id)).join(", ")}. You are very happy about it. Mention it briefly and warmly in this reply.]`
        : "";

    setMessages([...history, botMsg]);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let acc = "";
    let diagnostics: Msg["diagnostics"];
    const recentUserText = messages.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join("\n");
    const recalled = memoriesToReinforce(retrieveMemories(memories, text, recentUserText), text, recentUserText);
    const narrativeGuide=narrativeContext(narratives,text);
    const lessonFocus=lessonReplyFocus(narrativeGuide);
    // A focused lesson request already has its reviewed source snapshots. Prior
    // model guesses and generic work excerpts must not compete with that evidence.
    const replyHistory=lessonFocus?history.slice(-1):history;
    const replyStyle=replyStyleReminder(loadPersonality())+lessonFocus;
    const currentContext = imageReport
      ? identityContext(identity,settings.charName,settings.userName)+internalStateContext(stateForReply)+clockContext(new Date(now),journalRef.current.timeZone,history,companion.state.lastConversationAt)
      : identityContext(identity, settings.charName, settings.userName)
      + (lessonFocus?'':workContext(work))
      + interestsContext(interests,identity.interests)
      + goalsContext(goals)
      + activityContext("chatting")
      + followupStatusContext(followupsRef.current)
      + conversationGuidance(text, identity)
      + relationshipContext(relationshipRef.current)
      + waitingContext
      + clockContext(new Date(now), journalRef.current.timeZone, history, companion.state.lastConversationAt)
      + internalStateContext(stateForReply)
      + memoryContext(memories, text, recentUserText, settings.charName, settings.userName)
      + (lessonFocus?'':episodeContext(episodes,text))
      + narrativeGuide;
    const practiceContext=imageReport?'':skillsContext(practice,text);

    try {
      await streamChat({
        port: llama.port,
        temperature: settings.temperature,
        signal: ctrl.signal,
        messages: buildPayload(fillTemplate(settings.systemPrompt, settings) + extra,
          replyHistory, 24, settings.charName, currentContext+practiceContext,replyStyle),
        onToken: (t) => {
          acc += t;
          const snapshot = acc;
          setMessages((prev) => prev.map((m) => (m.id === botMsg.id ? { ...m, content: snapshot } : m)));
        },
      });
      const echoed = (reply: string) => !!(pendingOpening && repeatsInitiativeOpening(reply, pendingOpening.content, settings.charName)) || echoedChatReply(reply, history, settings.charName);
      const issue = (reply: string) => returningFromPause&&invalidReturnReply(reply,settings.charName)?"return-role" as const:conversationIssue(reply, history, settings.charName) ?? (echoed(reply) ? "repetition" : null);
      if (!ctrl.signal.aborted && issue(acc)) {
        const reason = issue(acc);
        const wrongReturn=returningFromPause&&invalidReturnReply(acc,settings.charName);
        diagnostics = { attempts: [{ text: acc.slice(0, 8000), issue: reason }] };
        // One targeted retry for models that echo the opening instead of answering.
        acc = "";
        setMessages((prev) => prev.map((m) => m.id === botMsg.id ? { ...m, content: "" } : m));
        const correction = currentContext + practiceContext + (wrongReturn
          ? "\nCorrection: you reversed the return roles or asked whether the user missed you. The USER returned; you stayed available. Welcome THEM back, never announce 'I'm back' as yourself. Do not ask 'Did you miss me?'. Answer their latest message naturally without assuming how work went."
          : reason === "capability"
          ? "\nYour first attempt claimed an unavailable capability. You cannot see the user, make or bring food/drinks, or play music. Respond to what they told you with grounded support; you may suggest something they could do."
          : "\nYour first attempt repeated substantial wording from an earlier reply. Answer the latest user message with a genuinely different response and topic when appropriate. Do not reuse the previous suggestion or follow-up question.");
        await streamChat({ port: llama.port, temperature: settings.temperature, signal: ctrl.signal,
          messages: buildPayload(fillTemplate(settings.systemPrompt, settings) + extra, replyHistory, 24, settings.charName, correction,replyStyle),
          onToken: (token) => { acc += token; const snapshot = acc; setMessages((prev) => prev.map((m) => m.id === botMsg.id ? { ...m, content: snapshot } : m)); } });
        const retryIssue = issue(acc);
        diagnostics.attempts.push({ text: acc.slice(0, 8000), issue: retryIssue });
        setMessages((prev) => prev.map((m) => m.id === botMsg.id ? { ...m, diagnostics } : m));
        if (retryIssue) {
          acc = "";
          throw new Error(`Reply rejected: ${retryIssue === "capability" ? "unsupported capability claim" : retryIssue === "return-role" ? "incorrect welcome-back roles" : "repeated wording"} after one corrective retry. Open Reply diagnostics to inspect both attempts. No restart is needed.`);
        }
      }
      if (!ctrl.signal.aborted && cleanReply(acc, settings.charName).text && recalled.length) setMemories((prev) => reinforceMemories(prev, recalled));
      if (!ctrl.signal.aborted && cleanReply(acc, settings.charName).text) {
        companion.reply(cleanReply(acc, settings.charName).emotion);
        saveChat([...history, { ...botMsg, content: acc, diagnostics }]);
        changeJournal(recordJournalSource(journalRef.current,{...botMsg,content:acc,createdAt:new Date().toISOString()},settings.charName));
        updateRelationship(pendingOpening ? `initiative:${pendingOpening.messageId}` : `chat:${userMsg.id}`, pendingOpening ? "initiativeReply" : "conversation");
      }
    } catch (e) {
      const aborted = ctrl.signal.aborted || e instanceof DOMException && e.name === "AbortError";
      if(aborted&&acc.trim())setMessages((prev)=>prev.map((m)=>m.id===botMsg.id?{...m,content:acc,error:"Reply stopped before completion. This partial text is excluded from future context and memory suggestions.",diagnostics}:m));
      if (!aborted) {
        const msg = e instanceof Error ? e.message : String(e);
        setMessages((prev) => prev.map((m) => (m.id === botMsg.id ? { ...m, content: acc, error: msg, diagnostics } : m)));
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
      // Drop an empty reply (stopped before any text arrived).
      setMessages((prev) => prev.filter((m) => !(m.id === botMsg.id && !m.content && !m.error)));
    }
  }

  async function clearChat() {
    if (busy || reflecting || archiving || storage.error) return;
    if (!messages.length) return;
    if(chatArchives.length>=50){window.alert('Archive storage is full. Delete an old archive before starting a fresh chat.');setShowChatArchives(true);return;}
    if (window.confirm("Archive this conversation and start a fresh chat?")) {
      setArchiving(true);
      setReflecting(true);
      try {
      const next=[newChatArchive(messages),...chatArchives];
      saveChatArchives(next);
      await flushPersistence();
      setChatArchives(next);
      saveChat([]);
      await flushPersistence();
      setMessages([]);
      changeInitiative(resolveInitiative(initiativeRef.current));
      lastActivityAt.current = Date.now();
      }catch(e){saveChat(messages);window.alert(`Could not finish archiving: ${String(e)}. Your conversation has been retained.`);}
      finally{setArchiving(false);setReflecting(false);}
    }
  }

  async function compareReply(messageId: string) {
    if (busy || reflecting || abortRef.current || reflectionDraft || hasChatDraft.current || storage.error || llama.status !== "ready") return;
    const index = messagesRef.current.findIndex((m) => m.id === messageId);
    const message = messagesRef.current[index];
    const user = messagesRef.current.slice(0, index).reverse().find((m) => m.role === "user");
    if (!message?.diagnostics || !user) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl; setBusy(true);
    let content = "";
    const publish = (comparison: string) => setMessages((prev) => prev.map((m) => m.id === messageId && m.diagnostics ? { ...m, diagnostics: { ...m.diagnostics, comparison } } : m));
    publish("Running simpler-prompt comparison...");
    try {
      await streamChat({ port: llama.port, temperature: settings.temperature, signal: ctrl.signal,
        messages: simpleComparisonPayload(user.content, settings.charName, settings.userName), onToken: (token) => { content += token; } });
      if (ctrl.signal.aborted) throw new Error("Comparison stopped");
      publish(content || "No comparison text returned.");
    } catch (e) { publish(ctrl.signal.aborted ? "Comparison stopped." : `Comparison failed: ${String(e)}`); }
    finally { abortRef.current = null; setBusy(false); }
  }

  const running = llama.running;
  const freshAssets = avatar.assets;

  return (
    <div className="app">
      <StagePanel
        charName={settings.charName}
        emotion={emotion}
        busy={busy}
        speech={speech}
        voiceMouth={voiceMouth}
        avatar={avatar}
        cfg={cfg}
        onCfg={changeCfg}
        onOpenWardrobe={() => setShowWardrobe(true)}
      />

      <main className="main">
        <header className="topbar">
          <span className={`pill ${llama.status}`}>{STATUS_LABEL[llama.status]}</span>
          <div className="spacer" />
          {running ? (
            <button className="btn" onClick={() => { abortRef.current?.abort(); void llama.stop(); }}>
              Stop model
            </button>
          ) : (
            <button className="btn primary" onClick={llama.start}>
              Start model
            </button>
          )}
          <button className="btn" onClick={()=>void clearChat()} disabled={busy || reflecting || archiving}>
            Archive &amp; clear
          </button>
          <MoreTools badge={suggestions.length+followupSuggestions.length}>
          <button className="btn" onClick={()=>setShowChatArchives(true)}>Archives ({chatArchives.length})</button>
          <button className="btn" onClick={() => setShowSettings(true)}>
            Settings
          </button>
          <button className="btn" onClick={() => setShowMemories(true)}>Memories{suggestions.length ? ` (${suggestions.length})` : ""}</button>
          <button className="btn" onClick={() => setShowState(true)}>State</button>
          <button className="btn" onClick={()=>setShowGoals(true)}>Goals</button>
          <button className="btn" onClick={()=>setShowFollowups(true)}>Follow-ups{followupSuggestions.length?` (${followupSuggestions.length})`:''}</button>
          <button className="btn" onClick={()=>setShowActivities(true)}>Activities</button>
          <button className="btn" onClick={() => setShowDiary(true)}>Diary{journalWriting ? " · writing" : ""}</button>
          <button className="btn" onClick={()=>setShowThoughts(true)}>Thoughts</button>
          <button className="btn" onClick={()=>setShowEvents(true)}>Event history</button>
          <button className="btn" onClick={()=>setShowNarratives(true)}>Themes &amp; lessons</button>
          <button className="btn" onClick={()=>setShowSkills(true)}>Skills</button>
          <button className="btn" disabled={busy||reflecting} onClick={()=>setShowVision(true)}>Images</button>
          <button className="btn" onClick={()=>setShowSavedImages(true)}>Saved images</button>
          </MoreTools>
        </header>

        {storage.error && <div className="banner error" role="alert">
          {storage.error}
          <button className="btn" onClick={() => { void flushPersistence().catch(() => {}); }}>Retry saving</button>
        </div>}

        {llama.detail && (llama.status === "error" || llama.status === "starting") && (
          <div className={`banner ${llama.status}`} role="status">
            {llama.detail}
          </div>
        )}

        {freshAssets && progress.fresh.length > 0 && (
          <div className="banner unlock" role="status">
            <span>
              {settings.charName} unlocked: {progress.fresh.map((id) => itemLabel(freshAssets, id)).join(", ")}!
            </span>
            <button
              className="btn"
              onClick={() => {
                setShowWardrobe(true);
                progress.dismiss();
              }}
            >
              Open wardrobe
            </button>
            <button className="btn" onClick={progress.dismiss}>
              Dismiss
            </button>
          </div>
        )}

        {initiative.pending && <div className="banner" role="status">
          <span>{settings.charName} started a conversation and will wait a few minutes. You can reply or dismiss it.</span>
          <button className="btn" onClick={() => { changeInitiative(resolveInitiative(initiativeRef.current)); lastActivityAt.current = Date.now(); }}>Dismiss</button>
        </div>}
        {initiativeStatus && <div className="banner" role="status">{initiativeStatus}</div>}
        <ChatPanel
          savedImages={savedImages}
          avatarReferenceAvailable={!!avatar.assets}
          imageStatus={imageStatus}
          imageError={imageError}
          onVoiceMouth={setVoiceMouth}
          messages={messages}
          busy={busy}
          ready={llama.status === "ready" && !reflecting}
          charName={settings.charName}
          onSend={sendAttachment}
          userName={settings.userName}
          onStop={() => abortRef.current?.abort()}
          onDraftChange={(draft) => { hasChatDraft.current = !!draft.trim(); setChatHasDraft(!!draft.trim()); lastActivityAt.current = Date.now(); }}
          onCompare={(id) => { void compareReply(id); }}
        />
      </main>

      {showSavedImages&&<SavedImagesDrawer images={savedImages} editable={!busy&&!reflecting&&!storage.error} onClose={()=>setShowSavedImages(false)} onDelete={id=>{if(busy||reflecting||storage.error)return;const next=savedImagesRef.current.filter(image=>image.id!==id);saveSavedImages(next);savedImagesRef.current=next;setSavedImages(next);}}/>}
      {showVision&&<VisionDrawer exePath={settings.exePath} chatPort={llama.port} canDiscuss={llama.status==='ready'&&!busy&&!reflecting&&!storage.error} onBusy={setReflecting} onClose={()=>setShowVision(false)} onDiscuss={text=>{setShowVision(false);void send(text);}}/>}
      {showSettings && (
        <SettingsDrawer
          settings={settings}
          running={running}
          backupReady={!busy&&!reflecting&&!storage.error}
          onBackupBusy={setReflecting}
          onSave={(s) => {
            const valid = validateSettings(s);
            setSettings(valid);
            saveSettings(valid);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showSkills&&<SkillsDrawer entries={practice} work={work} activities={sharedActivities} editable={!busy&&!reflecting&&!storage.error} onChange={next=>{savePractice(next);setPractice(next);}} onClose={()=>setShowSkills(false)}/>}

      {showNarratives&&<NarrativesDrawer entries={narratives} episodes={episodes} draft={narrativeDraft} generating={narrativeGenerating} ready={!busy&&!reflecting&&!storage.error&&llama.status==='ready'} error={narrativeError}
        onGenerate={(kind,ids,previous)=>void draftNarrative(kind,ids,previous)} onDraft={setNarrativeDraft} onStop={()=>abortRef.current?.abort()}
        editable={!busy&&!reflecting&&!storage.error}
        onEdit={source=>{if(busy||reflecting||storage.error||narrativeDraft||narratives.length>=NARRATIVE_LIMIT)return;setNarrativeError('');setNarrativeDraft(editableNarrativeRevision(source));}}
        onSave={()=>{if(!narrativeDraft||busy||reflecting||storage.error||!canSaveNarrative(narrativeDraft,narratives))return;const valid=validateNarratives([{...narrativeDraft,createdAt:new Date().toISOString()}])[0];if(!valid)return;const next=[...narratives,valid];saveNarratives(next);setNarratives(next);setNarrativeDraft(null);}}
        onDelete={id=>{if(storage.error||busy||reflecting)return;const next=narratives.filter(n=>n.id!==id);saveNarratives(next);setNarratives(next);}}
        onUse={(id,enabled)=>{if(storage.error||busy||reflecting)return;const next=validateNarratives(narratives.map(n=>{if(n.id!==id)return n;const {useInChat,...rest}=n;return enabled?{...rest,useInChat:true}:rest;}));saveNarratives(next);setNarratives(next);}}
        onClose={()=>{if(narrativeGenerating)abortRef.current?.abort();setNarrativeDraft(null);setShowNarratives(false);}}/>}

      {showFollowups&&<FollowupsDrawer name={settings.charName} state={followups} suggestions={followupSuggestions} timeZone={journal.timeZone} ready={!busy&&!reflecting&&!storage.error} onState={next=>{followupsRef.current=next;setFollowups(next);saveFollowups(next);}} onClose={()=>setShowFollowups(false)}/>}
      {showActivities&&<ActivitiesDrawer name={settings.charName} state={sharedActivities} editable={!busy&&!reflecting&&!storage.error} modelReady={llama.status==='ready'&&!busy&&!reflecting&&!storage.error} generatingId={activityGeneratingId} preview={activityPreview} error={activityError} onState={next=>{sharedActivitiesRef.current=next;setSharedActivities(next);saveSharedActivities(next);setActivityError('');lastActivityAt.current=Date.now();}} onGenerate={id=>void generateActivityReply(id)} onStop={()=>abortRef.current?.abort()} onClose={()=>{if(activityGeneratingId)abortRef.current?.abort();setShowActivities(false);}}/>}
      {showMemories && <MemoryDrawer charName={settings.charName} identity={identity} memories={memories}
        suggestions={suggestions} onReview={(id) => { const next = [...memoryReviews, id]; setMemoryReviews(next); saveMemoryReviews(next); }}
        onIdentity={setIdentity} onMemories={setMemories} onClose={() => setShowMemories(false)} />}

      {showState && <StateDrawer charName={settings.charName} state={companion.state} timeZone={journal.timeZone} onClose={() => setShowState(false)}
        relationship={relationship}
        activity={activity}
        initiative={initiative} onInitiative={(next) => { if (!next.enabled && initiativeGenerating) abortRef.current?.abort(); if (initiativeRef.current.pending && !next.pending) next = resolveInitiative(next); changeInitiative(next); }} initiativeStatus={initiativeStatus}
        initiativeReady={llama.status === "ready" && !busy && !reflecting && !reflectionDraft && !storage.error && !chatHasDraft}
        onStartConversation={() => { void startConversation(true); }} />}

      {showGoals && <GoalsDrawer name={settings.charName} goals={goals} draft={goalDraft} onDraft={setGoalDraft} generating={goalGenerating}
        work={work} workDraft={workDraft} onWorkDraft={setWorkDraft} workGenerating={workGenerating} onWork={(id,kind,instruction)=>{void workOnGoal(id,kind,instruction);}}
        playtests={playtests} onSavePlaytest={(report)=>setPlaytests((prev)=>prev.some((r)=>r.id===report.id)?prev:[...prev,report])} onDeletePlaytest={(id)=>setPlaytests((prev)=>prev.filter((r)=>r.id!==id))}
        onRevise={(id,instruction)=>{const source=work.find((a)=>a.id===id);if(source)void workOnGoal(source.goalId,source.kind,instruction,id);}}
        onSaveWork={()=>{if(!workDraft||workGenerating||!workDraft.title.trim()||!workDraft.content.trim())return;if(!goals.some((g)=>g.id===workDraft.goalId)){setGoalError("The goal was deleted. Save a new goal before starting another work session.");return;}if(workDraft.parentId){const source=work.find((a)=>a.id===workDraft.parentId);if(!source){setGoalError("The source artifact was deleted. Start a new work session before saving a revision.");return;}if(!revisionChanges(source.content,workDraft.content).length){setGoalError("This revision has no content changes. Edit the draft or dismiss it instead of saving a duplicate.");return;}}setWork((prev)=>[...prev,{...workDraft,id:uid(),createdAt:new Date().toISOString()}]);setWorkDraft(null);setGoalError("");}}
        onDeleteWork={(id)=>{setWork((prev)=>prev.filter((a)=>a.id!==id));setPlaytests((prev)=>prev.filter((r)=>r.artifactId!==id));}}
        interestNames={identity.interests} interests={interests} onInterests={setInterests}
        ready={llama.status === "ready" && !busy && !reflecting && !storage.error} error={goalError} onPropose={()=>{void proposeGoal();}} onStop={()=>abortRef.current?.abort()}
        onAccept={()=>{const goal=newGoal(goalDraft);if(goal&&!goalGenerating){setGoals((prev)=>[...prev,goal]);setInterests((prev)=>acceptGoalInterests(prev,identity.interests,goal));setGoalDraft("");setGoalError("");}}}
        onUpdate={(goal)=>setGoals((prev)=>prev.map((g)=>g.id===goal.id?{...goal,title:cleanGoalTitle(goal.title)||g.title,updatedAt:new Date().toISOString()}:g))}
        onDelete={(id)=>setGoals((prev)=>prev.filter((g)=>g.id!==id))}
        onClose={()=>{if(goalGenerating||workGenerating)abortRef.current?.abort();setShowGoals(false);}} />}

      {showDiary && <DiaryDrawer name={settings.charName} entries={diary} draft={reflectionDraft} generating={reflecting}
        onRestore={(id)=>{const entry=diary.find((e)=>e.id===id);if(entry?.journalDate&&diary.some((e)=>!e.deletedAt&&e.journalDate===entry.journalDate)){setJournalStatus("An entry for that day already exists. Move it to Recently deleted before restoring the earlier one.");return;}setDiary((prev)=>prev.map((e)=>{if(e.id!==id)return e;const {deletedAt,...restored}=e;return restored;}));}}
        onPurge={(id)=>setDiary((prev)=>prev.filter((e)=>e.id!==id))}
        onRewrite={()=>{if(window.confirm("Write a replacement for today's journal using available recorded chat? Any current entry will move to Recently deleted only after the replacement succeeds. Deleted original wording cannot be recreated exactly."))void writeJournal(journalClock(new Date(),journal.timeZone).date,true);}}
        journal={journal} onJournal={changeJournal} journalStatus={journalStatus} dailyWriting={journalWriting}
        onDaily={() => { void writeJournal(journalClock(new Date(),journal.timeZone).date); }}
        ready={llama.status === "ready" && !busy && !storage.error} error={reflectionError} onDraft={setReflectionDraft} onReflect={() => { void reflect(); }}
        onStop={() => abortRef.current?.abort()} onSave={() => {
          if (reflecting || !reflectionDraft.trim()) return;
          setDiary((prev) => [...prev, { id: uid(), content: reflectionDraft.trim(), createdAt: new Date().toISOString(), ...reflectionSources.current }]);
          setReflectionDraft(""); progress.update(grantMilestone("first_diary"));
        }} onDelete={(id) => setDiary((prev) => prev.map((entry)=>entry.id===id?{...entry,deletedAt:new Date().toISOString()}:entry))}
        onClose={() => { if (reflecting && !journalWriting) abortRef.current?.abort(); setShowDiary(false); }} />}

      {showWardrobe && wardrobe && (
        <Wardrobe
          data={wardrobe}
          cfg={cfg}
          stats={progress.stats}
          charName={settings.charName}
          itemsError={avatar.assets?.itemsError}
          onChange={changeCfg}
          onClose={() => setShowWardrobe(false)}
        />
      )}
      {showEvents&&<EventsDrawer events={events} episodes={episodes} relationship={relationship} timeZone={journal.timeZone} onEpisodes={next=>{saveEpisodes(next);setEpisodes(next);}} editable={!busy&&!reflecting&&!storage.error} onChange={next=>{saveEvents(next);setEvents(next);}} onClose={()=>setShowEvents(false)}/>}
      {showThoughts&&<ThoughtsDrawer name={settings.charName} state={thoughts} draft={thoughtDraft} generating={thoughtGenerating}
        ready={!busy&&!reflecting&&!storage.error&&llama.status==='ready'} error={thoughtError}
        onState={next=>{saveThoughts(next);setThoughts(next);}} onGenerate={()=>void draftThought()} onStop={()=>abortRef.current?.abort()}
        onSave={()=>{if(thoughtDraft&&thoughts.entries.length<100){const next={...thoughts,entries:[...thoughts.entries,thoughtDraft]};saveThoughts(next);setThoughts(next);setThoughtDraft(null);}}}
        onClose={()=>{if(thoughtGenerating)abortRef.current?.abort();setThoughtDraft(null);setShowThoughts(false);}}/>}
      {showChatArchives&&<ChatArchivesDrawer savedImages={savedImages} archives={chatArchives} charName={settings.charName} userName={settings.userName}
        onDelete={id=>{const next=chatArchives.filter(a=>a.id!==id);saveChatArchives(next);setChatArchives(next);}}
        onClose={()=>setShowChatArchives(false)}/>}
    </div>
  );
}
