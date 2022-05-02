import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  text = 'mathang';
  value = -20000.123;
  test = '';

  constructor() { }

  ngOnInit() {
  }

  submit() {
    console.log('submit: ', this.value);
  }

  setValue() {
    this.value = 1000000.123456;
  }
}
