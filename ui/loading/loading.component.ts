import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  imports: [CommonModule, IonicModule]
})
export class LoadingComponent {
  @Input() label = 'Indlæser';
  @Input() tone: 'default' | 'light' = 'default';
}
