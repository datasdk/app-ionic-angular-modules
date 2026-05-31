import { Component, OnInit } from '@angular/core';
import { Users } from '../users.model'; // ret path
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})


export class ProfileComponent implements OnInit {

  users: Users[] = [];

  constructor() {}


  async ngOnInit() {


  }


  async loadUsers() {

    
    try {

      this.users = await Users.$query().with(['address']).get();

      console.log(this.users);

    } catch (error) {

      console.error(error);

    }


  }


}