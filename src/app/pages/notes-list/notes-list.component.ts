import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component ,OnInit, ViewChild,ElementRef} from '@angular/core';
import { Note } from 'src/app/shared/note.module';
import { NotesService } from 'src/app/shared/notes.service';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  animations:[
    trigger('itemAnim',[
      //entry animation 
      transition('void => *',[
        // initial state 
        style({
          height:0,
          opacity:0,
          transfrom:'scale(0.85)',
          'margin-bottom':0,

          paddingTop:0,
          paddingBottom: 0,
          paddingLeft:0,
          paddingRight:0,
        }),
        // we first want to animate the spacing (which includes height and margin)
        animate('70ms',style({
          height:'*',
          'margin-bottom':'*',
          paddingTop:'*',
          paddingBottom: '*',
          paddingLeft:'*',
          paddingRight:'*',
        })),
        animate(100)
      ]),
      transition('* => void',[
        // first scale up 
        animate(50,style({
          transform:'scale(1.05)'
        })),
        // then scale down back to normal size while beginning to fade out 
        animate(50,style({
          transform:'scale(1)',
          opacity:0.75
        })),
        // scale down and fade out completely 
        animate('120ms ease-out',style({
          transform:'scale(0.68)',
          opacity:0,
        })),
        // then animate the spacing (which includes height, margin and padding)
        animate('150ms ease-out',style({
          height:0,
          paddingTop:0,
          paddingBottom: 0,
          paddingLeft:0,
          paddingRight:0,
          'margin-bottom':'0',
        }))
      ])
    ]),
    trigger('listAnim',[
      transition('* => *',[
        query(':enter',[
          style({
            opacity:0,
            height:0,
          }),
          stagger(100,[
            animate('0.2s ease')
          ])
        ],{
          optional:true
        })
      ])
    ])
  ]
})
export class NotesListComponent implements OnInit {
    notes : Note[] = new Array<any>();
    filteredNotes:Note[] = new Array<any>();
    @ViewChild('filterInput') filterInputElRef !: ElementRef<HTMLInputElement>;
    constructor(private notesService : NotesService) { }
  
    ngOnInit() {
      // we want to retrieve all notes from NotesService
      this.notes = this.notesService.getAll();
      this.filteredNotes = this.notesService.getAll(); ;
    }
    deleteNote(note:Note){
      let noteId = this.notesService.getId(note);
      this.notesService.delete(noteId);
      this.filter(this.filterInputElRef.nativeElement.value);
    }
    generateNoteURL(note:Note):string{
      let noteId = this.notesService.getId(note);
      return noteId.toString();
    }
    filter(query:string){
      query = query.toLowerCase().trim();
      let allResults:Note[] = new Array<Note>();
      // split the search query into individual words
      let terms:string[] = query.split(' '); // split on spaces
      // remove duplicate search terms
      terms = this.removeDuplicates(terms);
      // compile all relevant results into the allResults array
      terms.forEach(term=>{
        let results:Note[] = this.relevantNotes(term);
        // append results to the allResults array
        allResults = [...allResults,...results]
      });
      // allResults will include duplicate notes
      // because a particular note can be the result of many search terms
      // but we don't want to show the same note multiple times on the UI
      // so we first must remove the duplicates
      let uniqueResults = this.removeDuplicates(allResults);
      this.filteredNotes = uniqueResults;
      //sort by relevancy
      this.sortByRelevance(allResults);
    }
    removeDuplicates(arr:Array<any>):Array<any>{
      let uniqueResults:Set<any> = new Set<any>();
      // loop through the input array and add the items to the set
      arr.forEach(e => uniqueResults.add(e));
      return Array.from(uniqueResults);
    }
    relevantNotes(query:string):Array<Note>{
      query = query.toLowerCase().trim();
      let relevantNotes = this.notes.filter(note => {
        if(note.title && note.title.toLowerCase().includes(query)){
          return true;
        }
        if(note.body && note.body.toLowerCase().includes(query)){
          return true;
        }
        return false;
      })
      return relevantNotes;
    }
    sortByRelevance(searchResults:Note[]){
      let noteCountObj: { [key: string]: number } = {}; 
      searchResults.forEach(note=>{
        let noteId = this.notesService.getId(note);
        if(noteCountObj[noteId]){
          noteCountObj[noteId] += 1;
        }else{
          noteCountObj[noteId] = 1;
        }
      });
      this.filteredNotes = this.filteredNotes.sort((a:Note,b:Note)=>{
        let aId = this.notesService.getId(a);
        let bId = this.notesService.getId(b);
        let aCount = noteCountObj[aId] ? noteCountObj[aId] : 0;
        let bCount = noteCountObj[bId] ? noteCountObj[bId] : 0;
        return bCount - aCount;
      })
    }
  }   
