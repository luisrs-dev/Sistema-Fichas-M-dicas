import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'buttonStyle',
  standalone: true,
})
export class ButtonStylePipe implements PipeTransform {

  transform(value: string) {
   
    if(value.toLocaleLowerCase().includes('error') ){
      return `accent`
    }
    else if(value.toLocaleLowerCase().includes('info')){
      return `primary`
    }
    else{
      return `primary`
    }
  }

}
