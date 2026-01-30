import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';
import { Order } from 'src/app/models/order';

@Component({
  selector: 'app-order-list',
  template: `
    <h2>Orders</h2>
    <div *ngFor="let o of orders">
      Order #{{ o.id }} - {{ o.status }} - {{ o.totalPrice }} DT
    </div>
  `
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.orderService.getAll().subscribe(data => this.orders = data);
  }
}
