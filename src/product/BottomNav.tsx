import {Icon} from '../ui/Icon';
import type {IconName} from '../ui/icons';
import './bottom-nav.css';
export type Tab='home'|'tasks'|'calendar'|'more';
const TABS:{id:Tab;label:string;icon:IconName}[]=[{id:'home',label:'Home',icon:'home'},{id:'tasks',label:'Tasks',icon:'tasks'},{id:'calendar',label:'Calendar',icon:'calendar'},{id:'more',label:'More',icon:'more'}];
/** Bottom navigation of the main screens (hidden inside a notebook). */
export function BottomNav({tab,onChange}:{tab:Tab;onChange:(t:Tab)=>void}){
 return <nav className="bottom-nav" aria-label="Main">{TABS.map(t=><button key={t.id} type="button" className="bottom-nav__item" aria-current={tab===t.id?'page':undefined} onClick={()=>onChange(t.id)}><span className="bottom-nav__pill"><Icon name={t.icon}/></span><span className="bottom-nav__label">{t.label}</span></button>)}</nav>;
}
