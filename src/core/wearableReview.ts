import type {ImageAttachment} from './vision';
import type {AtelierCategory,AtelierDepth} from './outfitPrototype';
export type AtelierAttachment=ImageAttachment&{prepared?:boolean;category?:AtelierCategory;reviewId?:string;reviewRevision?:number;wearableReview?:boolean;project?:unknown;accessoryDepth?:AtelierDepth};
export interface WearableReview{id:string;name:string;category:'hair'|'accessory';depth:AtelierDepth;revision:number;status:'pending'|'saved'|'dismissed';itemId:string|null;width:number;height:number;fitWarnings?:string[];reviewNotes?:string;needsEdits?:boolean}

export function filterWearableReviews(reviews:WearableReview[],query:string,category:string,filter:string,sort:string){const q=query.trim().toLocaleLowerCase();return reviews.filter(r=>(category==='all'||r.category===category)&&(!q||(r.name+' '+(r.reviewNotes??'')).toLocaleLowerCase().includes(q))&&(filter==='needs-edits'?r.needsEdits:filter==='edited'?r.revision>0:filter==='warnings'?!!r.fitWarnings?.length:true)).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='oldest'?a.id.localeCompare(b.id):b.id.localeCompare(a.id));}
