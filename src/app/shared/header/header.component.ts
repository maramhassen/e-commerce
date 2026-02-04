import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  link1:string='Home';
  link2:string="Residences";
  link3:string="Apartement";
  url:string="https://esprit.tn/";
  linkColor:string=" "

// changeColor(){
// this.linkColor= this.linkColor;
// }
  clickMe(){
    alert(" vous avez cliquer!!!!!");
  }
}