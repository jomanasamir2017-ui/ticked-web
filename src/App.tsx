import {useEffect,useRef,useState,useMemo} from 'react';
import {Notebook} from './components/Notebook/Notebook';
import {NotebookCover} from './components/Notebook/NotebookCover';
import {BrandLogo} from './components/Brand/BrandLogo';
import {NativeLaunchIntro} from './components/NativeLaunchIntro';
import {Stamp} from './components/Stamp/Stamp';
import {getDayInfo} from './lib/dates';
import {useStationery} from './stationery/useStationery';
import {ownedNotebook} from './stationery/model';
import {NotebookOptions,CollectionTrash} from './stationery/NotebookManagement';
import {NewNotebook} from './stationery/NewNotebook';
import {searchCollection,targetKey,validBookmarks,availableBookmark,BOOKMARKS_KEY,type Bookmark,type SearchTarget} from './product/search';
import {ProductSettings} from './product/Settings';
import {NotebookDeck} from './product/NotebookDeck';
import {BottomNav,type Tab} from './product/BottomNav';
import {TasksPage} from './product/TasksPage';
import {CalendarPage} from './product/CalendarPage';
import {MorePage} from './product/MorePage';
import {todayISO} from './product/dayTasks';
import {readAppearance,applyAppearance,writeAppearance,type AppAppearance} from './product/appearance';
import {Icon} from './ui/Icon';
import './Collection.css';
import './styles/product-polish.css';
import './styles/app-appearance.css';
type AppRoute={screen:'collection'}|{screen:'gallery';itemId:string}|{screen:'notebook';itemId:string;target?:SearchTarget;skipCover?:boolean};
const noop=()=>{};
function readBookmarks(){try{const raw=localStorage.getItem(BOOKMARKS_KEY);if(raw===null)return {items:[] as Bookmark[],error:''};const value:unknown=JSON.parse(raw);if(!validBookmarks(value))throw Error('Unsupported saved bookmark data.');return {items:value.items,error:''};}catch(e){return {items:[] as Bookmark[],error:'Bookmarks are unreadable. Your original data was left unchanged; bookmark editing is disabled.'}}}
export function App(){
 const session=useStationery(),document=session.document;
 const [route,setRoute]=useState<AppRoute>({screen:'collection'});
 const [menuOpen,setMenuOpen]=useState(false);const [tab,setTab]=useState<Tab>('home');const [taskDay,setTaskDay]=useState(todayISO());
 const [appearanceRead]=useState(readAppearance);
 const [appearance,setAppearance]=useState<AppAppearance>(appearanceRead.value);
 const [appearanceError,setAppearanceError]=useState(appearanceRead.error);
 useEffect(()=>{applyAppearance(appearance);const media=window.matchMedia?.('(prefers-color-scheme: dark)');const changed=()=>{if(appearance.mode==='system')applyAppearance(appearance)};media?.addEventListener?.('change',changed);return()=>media?.removeEventListener?.('change',changed)},[appearance]);
 useEffect(()=>{if(!menuOpen)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenuOpen(false)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[menuOpen]);
 function updateAppearance(next:AppAppearance){if(appearanceRead.error){setAppearanceError('Saved appearance preferences are unreadable; reload or back them up before editing.');return;}try{writeAppearance(next);setAppearance(next);setAppearanceError('')}catch(e){setAppearanceError('Appearance could not be saved: '+(e instanceof Error?e.message:String(e)))}}
 const heading=useRef<HTMLHeadingElement>(null),back=useRef<HTMLButtonElement>(null);
 const [query,setQuery]=useState(''),[searchOpen,setSearchOpen]=useState(false),[bookmarksOpen,setBookmarksOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false);
 const [marks,setMarks]=useState(readBookmarks),[markError,setMarkError]=useState('');
 const [welcome,setWelcome]=useState(()=>{try{return localStorage.getItem('ticked:v1:onboarding')===null&&!['ticked:v1:stationery','ticked:v3:journal','ticked:v2:journal'].some(k=>localStorage.getItem(k)!==null)}catch{return false}}),[welcomeStep,setWelcomeStep]=useState(0);
 useEffect(()=>{(route.screen==='collection'?heading.current:back.current)?.focus()},[route]);
 const visible=document?.collection.itemIds.filter(id=>!document.items[id].deletedAt)??[];
 const results=useMemo(()=>document?searchCollection(document,query):[],[document,query]);
 const validMarks=document?marks.items.filter(b=>availableBookmark(document,b)):[];
 function open(itemId:string,target?:SearchTarget){(window as any).__ticked56SelectedItemId=itemId;setMenuOpen(false);setSearchOpen(false);setBookmarksOpen(false);setRoute({screen:'notebook',itemId,target,skipCover:true});}
 function showCovers(itemId:string){setMenuOpen(false);setRoute({screen:'gallery',itemId});}
 function toggle(target:SearchTarget,title:string){if(route.screen!=='notebook'||marks.error)return;
 const key=targetKey(route.itemId,target),next=marks.items.some(x=>targetKey(x.itemId,x.target)===key)?marks.items.filter(x=>targetKey(x.itemId,x.target)!==key):[...marks.items,{itemId:route.itemId,target,title}];
 try{localStorage.setItem(BOOKMARKS_KEY,JSON.stringify({version:1,items:next}));setMarks({items:next,error:''});setMarkError('')}catch(e){setMarkError(e instanceof Error?e.message:'Could not save bookmarks. No existing bookmarks were removed.')}}
 const steps:[string,string,'notebook'|'library'|'page'|'edit'][]=[['Welcome to TICKED','Dream. Plan. Do.','notebook'],['My Collection','Create, open and organize your notebooks.','library'],['Stationery Library','Add designed pages and trackers.','page'],['Creative Editor','Write, decorate and keep it all on your device.','edit']];
 function finishWelcome(){try{localStorage.setItem('ticked:v1:onboarding','finished');setWelcome(false)}catch{setWelcome(false);setMarkError('Could not save the intro preference; it may appear again next visit.')}}
 return <div className="device">
 {!document?<main className="save-warning" role="alert"><p>{session.warning}</p><button onClick={()=>window.location.reload()}>Reload saved data</button></main>:
 route.screen==='notebook'?<><nav className="collection-return" aria-label="Notebook navigation"><button ref={back} onClick={()=>setRoute({screen:'collection'})} aria-label="Back to Collection"><Icon name="back"/><span>Collection</span></button><button type="button" className="ticked-cover-design-access" aria-label="Design Cover" title="Design Cover" onClick={()=>window.dispatchEvent(new Event('ticked:design-cover'))}><Icon name="palette"/><span>Cover</span></button></nav><div className="notebook-route"><Notebook key={route.itemId+JSON.stringify(route.target||'')} itemId={route.itemId} session={session} startOpened={!!route.skipCover} openTarget={route.target} onBookmark={toggle} bookmarked={target=>marks.items.some(x=>targetKey(x.itemId,x.target)===targetKey(route.itemId,target))}/></div>{markError&&<p className="save-warning" role="alert">{markError}</p>}</>:
 route.screen==='gallery'?<NotebookDeck doc={document} itemId={route.itemId} onBack={()=>setRoute({screen:'collection'})} onEnter={(id,target)=>{(window as any).__ticked56SelectedItemId=id;(window as any).__ticked56LaunchMode='edit';setRoute({screen:'notebook',itemId:id,target,skipCover:true})}}/>: 
 <><main key={tab} className={`collection-home collection-home--${tab}`}><div className="collection-topline"><span className="collection-topline__tagline">Dream · Plan · Do</span></div>{tab==='home'&&<header className="collection-heading"><div className="collection-identity"><BrandLogo className="ticked-identity-logo"/></div><h1 ref={heading} tabIndex={-1}>My Collection</h1></header>}
 {session.error&&<aside className="save-warning" role="alert"><p>Not saved: {session.error} Pending changes remain in this window.</p><button onClick={session.retry}>Retry saving</button></aside>}
 
 {appearanceError&&<p className="save-warning" role="alert">{appearanceError}</p>}
 {marks.error&&<p role="alert" className="save-warning">{marks.error}</p>}
 {searchOpen&&<section className="ticked-find" aria-label="Search notebooks and pages"><div className="ticked-find__head"><h2>Search</h2><button onClick={()=>setSearchOpen(false)} aria-label="Close search"><Icon name="close"/></button></div><label><span className="tk-vh">Search across notebooks, sections and writing</span><input type="search" autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search titles and notes" aria-label="Search across notebooks, sections and writing"/></label>{!query.trim()?<p className="ticked-find__hint"><Icon name="lock"/><span>Private, on your device</span></p>:results.length?<div className="ticked-find__results">{results.map(r=><button key={r.key} onClick={()=>open(r.itemId,r.target)}><strong>{r.title}</strong><span>{r.notebook} / {r.section}</span><small>{r.preview}</small></button>)}</div>:<p className="ticked-find__hint"><Icon name="search"/><span>No matches</span></p>}</section>}
 {bookmarksOpen&&<section className="ticked-find" aria-label="Bookmarked Pages"><div className="ticked-find__head"><h2>Bookmarks</h2><button onClick={()=>setBookmarksOpen(false)} aria-label="Close bookmarks"><Icon name="close"/></button></div>{validMarks.length?validMarks.map(b=><button key={targetKey(b.itemId,b.target)} className="ticked-find__bookmark" onClick={()=>open(b.itemId,b.target)}>{b.title}<small>{document.items[b.itemId].title}</small></button>):<p className="ticked-find__hint"><Icon name="bookmark"/><span>No bookmarks yet</span></p>}</section>}
 {tab==='home'&&<>{!visible.length&&<p className="collection-empty"><Icon name="notebook" size={28}/><span>No notebooks yet</span></p>}
 <ul className="collection-items">{visible.map((id,index)=>{const item=document.items[id],notebook=ownedNotebook(document,id);return <li key={id} className="collection-entry"><NotebookOptions item={item} first={index===0} last={index===visible.length-1} manage={session.manageItem}/><button className="collection-item" onClick={()=>{if((window as any).__ticked56LaunchMode==='edit'){open(id)}else showCovers(id)}} aria-label={`Open notebook: ${item.title}`}><div className="collection-cover" aria-hidden="true" inert><div className="collection-cover-scale"><NotebookCover day={getDayInfo()} settings={notebook.cover} preview opened={false} onOpen={noop} onOpened={noop}/></div></div><span className="collection-caption"><Stamp width={38} height={44}><span>{String(index+1).padStart(2,'0')}</span></Stamp><span className="collection-title" dir="auto">{item.title}</span><Icon name="open"/></span></button></li>})}</ul></>}{tab==='tasks'&&<TasksPage day={taskDay} onDay={setTaskDay}/>}{tab==='calendar'&&<CalendarPage onOpenDay={iso=>{setTaskDay(iso);setTab('tasks')}}/>}{tab==='more'&&<MorePage marksCount={validMarks.length} onSearch={()=>{setSearchOpen(true);setBookmarksOpen(false)}} onBookmarks={()=>{setBookmarksOpen(true);setSearchOpen(false)}} onSettings={()=>setSettingsOpen(true)} newNotebook={<NewNotebook create={(name,color)=>{session.createNotebook(name,color);setTab('home')}} createYearly={(name,year)=>{session.createYearly(name,year);setTab('home')}}/>} trash={<CollectionTrash document={document} manage={session.manageItem}/>}/>}</main><BottomNav tab={tab} onChange={setTab}/></>}
 {settingsOpen&&document&&<ProductSettings doc={document} session={session} appearance={appearance} updateAppearance={updateAppearance} appearanceError={appearanceError} onClose={()=>setSettingsOpen(false)} reopenIntro={()=>{setSettingsOpen(false);setWelcomeStep(0);setWelcome(true)}}/>}
 {welcome&&document&&<div className="ticked-intro-screen" role="presentation"><section role="dialog" aria-modal="true" aria-label="Welcome to TICKED" className="ticked-intro"><BrandLogo className="ticked-intro-logo"/><div className="ticked-intro-art" aria-hidden="true"><Icon name={steps[welcomeStep][2]} size={44}/></div><h2>{steps[welcomeStep][0]}</h2><p>{steps[welcomeStep][1]}</p><div className="ticked-intro-dots" role="presentation" aria-label={`Step ${welcomeStep+1} of ${steps.length}`}>{steps.map((_,i)=><i key={i} data-on={i===welcomeStep}/>)}</div><div className="ticked-intro-actions"><button onClick={finishWelcome}>Skip</button>{welcomeStep>0&&<button onClick={()=>setWelcomeStep(x=>x-1)} aria-label="Back"><Icon name="back"/></button>}<button className="is-primary" onClick={()=>welcomeStep===steps.length-1?finishWelcome():setWelcomeStep(x=>x+1)}>{welcomeStep===steps.length-1?<><span>Start</span><Icon name="check"/></>:<><span>Next</span><Icon name="forward"/></>}</button></div></section></div>}
 <NativeLaunchIntro />
 </div>;
}
