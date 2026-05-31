import { Component, OnInit } from '@angular/core';
import { LoginComponent } from '../../components/login/login.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'page-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    LoginComponent
  ]
})

export class LoginPage implements OnInit {

  ngOnInit() {}


}
