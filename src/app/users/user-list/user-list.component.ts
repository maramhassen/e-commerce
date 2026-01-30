import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-user-list',
  template: `
    <h2>Users</h2>
    <ul>
      <li *ngFor="let u of users">
        {{ u.nom }} {{ u.prenom }}
        <button (click)="delete(u.id!)">Delete</button>
      </li>
    </ul>
  `
})
export class UserListComponent implements OnInit {
  users: User[] = [];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getAll().subscribe(data => this.users = data);
  }

  delete(id: number) {
    this.userService.delete(id).subscribe(() =>
      this.users = this.users.filter(u => u.id !== id)
    );
  }
}
