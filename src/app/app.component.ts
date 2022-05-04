import { Component, OnInit } from '@angular/core';

interface Product {
  name?: string;
  quantity?: number;
  price?: number;
  totalAmount?: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  text = 'mathang';
  value = 20000;
  test = '';
  listData: Product[] = [];

  constructor() { }

  ngOnInit() {
  }

  submit() {
    console.log('submit: ', this.value);
    console.log('listData: ', this.listData);
  }

  setValue() {
    this.value = 1000000.123456;
  }

  add() {
    this.listData = [...this.listData, {
      name: '',
      price: 0,
      quantity: 0,
      totalAmount: 0
    }];
  }

  detectValue(item: Product) {
    item.totalAmount = (item.price ?? 0) * (item.quantity ?? 0);
  }

  update() {
    this.listData[0].price = 70;
    this.detectValue(this.listData[0]);
  }
}
