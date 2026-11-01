export type ParcelPhase='envelope'|'openingLetter'|'unfoldingLetter'|'letterFocus'|'letter'|'letterReady'|'closingLetter'|'backpack'|'openingBag'|'extractingTicket'|'ticketFocus'|'ticket'|'closingBag'|'ready'|'prepared';
export type ParcelAction='openLetter'|'letterUnfold'|'letterUnfolded'|'letterShown'|'letterWaited'|'closeLetter'|'letterStored'|'openBag'|'ticketExtract'|'ticketExtracted'|'ticketShown'|'closeBag'|'bagStored'|'prepare'|'skip';
const transitions:Partial<Record<ParcelPhase,Partial<Record<ParcelAction,ParcelPhase>>>>={
 envelope:{openLetter:'openingLetter'},openingLetter:{letterUnfold:'unfoldingLetter'},unfoldingLetter:{letterUnfolded:'letterFocus'},letterFocus:{letterShown:'letter'},letter:{letterWaited:'letterReady'},
 letterReady:{closeLetter:'closingLetter'},closingLetter:{letterStored:'backpack'},backpack:{openBag:'openingBag'},
 openingBag:{ticketExtract:'extractingTicket'},extractingTicket:{ticketExtracted:'ticketFocus'},ticketFocus:{ticketShown:'ticket'},ticket:{closeBag:'closingBag'},closingBag:{bagStored:'ready'},ready:{prepare:'prepared'}
};
export function parcelReducer(phase:ParcelPhase,action:ParcelAction):ParcelPhase{if(action==='skip')return phase==='prepared'?'prepared':'ready';return transitions[phase]?.[action]??phase;}
export const parcelTimers:Partial<Record<ParcelPhase,{delay:number;action:ParcelAction}>>={
 openingLetter:{delay:650,action:'letterUnfold'},letter:{delay:3000,action:'letterWaited'},
 closingLetter:{delay:450,action:'letterStored'},openingBag:{delay:650,action:'ticketExtract'},closingBag:{delay:550,action:'bagStored'}
};
